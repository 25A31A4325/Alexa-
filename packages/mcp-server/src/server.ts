import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { ToolDatabase } from './db.js';
import { registerAllTools } from './tools.js';

export interface McpServerConfig {
  host?: string;
  port?: number;
  endpoint?: string;
  dbPath?: string;
}

export function createOrchestraServer(config: McpServerConfig = {}) {
  const host = config.host || process.env.MCP_SERVER_HOST || '127.0.0.1';
  const port = config.port || Number(process.env.MCP_SERVER_PORT) || 3001;
  const endpoint = config.endpoint || process.env.MCP_SERVER_ENDPOINT || '/mcp';
  const dbPath = config.dbPath || process.env.MCP_DB_PATH || ':memory:';

  const db = new ToolDatabase(dbPath);
  db.seedDemoKnowledge();

  const app = express();
  app.use(express.json());

  // Security: Host header check (DNS Rebinding protection)
  const allowedHostsEnv = process.env.MCP_ALLOWED_HOSTS ? process.env.MCP_ALLOWED_HOSTS.split(',').map(h => h.trim()) : [];
  app.use((req, res, next) => {
    const reqHost = req.headers.host;
    if (
      reqHost &&
      (reqHost.startsWith('127.0.0.1') ||
        reqHost.startsWith('localhost') ||
        reqHost.startsWith('0.0.0.0') ||
        reqHost.startsWith(`${host}:${port}`) ||
        reqHost === `${host}:${port}` ||
        reqHost.startsWith('mcp-server') ||
        reqHost.startsWith('orchestra-mcp') ||
        reqHost.includes('.railway.internal') ||
        allowedHostsEnv.some(ah => reqHost === ah || reqHost.startsWith(ah)))
    ) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: host header rejected by security policy' });
  });

  // Health check endpoint for container orchestration & liveness probes
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'orchestra-mcp-server',
      protocolVersion: '2025-11-25',
      time: new Date().toISOString()
    });
  });

  // Stateful transport registry keyed by sessionId
  const transports = new Map<string, StreamableHTTPServerTransport>();

  function createServerInstance(): McpServer {
    const server = new McpServer({
      name: 'orchestra-mcp-server',
      version: '1.0.0'
    });
    registerAllTools(server, db);
    return server;
  }

  app.all(endpoint, async (req: Request, res: Response) => {
    try {
      // Normalize headers for strict Streamable HTTP compliance
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, mcp-session-id');
      res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }

      const accept = (req.headers['accept'] || '') as string;
      if (req.method === 'GET') {
        if (!accept.includes('text/event-stream')) {
          req.headers['accept'] = accept ? `${accept}, text/event-stream` : 'text/event-stream';
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
      } else if (req.method === 'POST') {
        const parts: string[] = [];
        if (!accept.includes('application/json')) parts.push('application/json');
        if (!accept.includes('text/event-stream')) parts.push('text/event-stream');
        if (parts.length > 0) {
          req.headers['accept'] = accept ? `${accept}, ${parts.join(', ')}` : 'application/json, text/event-stream';
        }
        if (!req.headers['content-type']) {
          req.headers['content-type'] = 'application/json';
        }
      }

      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        // Prevent -32600 "Invalid Request: session not found" when client passes stale session ID
        if (sessionId) {
          delete req.headers['mcp-session-id'];
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessionclosed: (id: string) => {
            transports.delete(id);
          }
        });

        const server = createServerInstance();
        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);

      if (transport.sessionId) {
        transports.set(transport.sessionId, transport);
        if (!res.headersSent) {
          res.setHeader('mcp-session-id', transport.sessionId);
        }
      }
    } catch (err: unknown) {
      console.error('[MCP Server] Error processing request:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : 'Internal Server Error'
          },
          id: null
        });
      }
    }
  });

  return {
    app,
    db,
    host,
    port,
    endpoint,
    listen: () => {
      return new Promise<{ close: () => Promise<void> }>((resolve) => {
        const httpServer = app.listen(port, host, () => {
          resolve({
            close: async () => {
              // Close all open transports first
              for (const t of transports.values()) {
                try {
                  await t.close();
                } catch {}
              }
              transports.clear();

              return new Promise<void>((resClose) => {
                httpServer.closeAllConnections();
                httpServer.close(() => {
                  db.close();
                  resClose();
                });
              });
            }
          });
        });
      });
    }
  };
}
