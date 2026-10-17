import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import { Server as HttpServer } from 'node:http';
import { ToolDatabase } from './db.js';
import { registerAllTools } from './tools.js';

export interface McpServerConfig {
  host?: string;
  port?: number;
  endpoint?: string;
  dbPath?: string;
}

interface McpSession {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

export function createOrchestraServer(config: McpServerConfig = {}) {
  const host = config.host || '0.0.0.0';
  const port = config.port ?? 3001;
  const endpoint = config.endpoint || '/mcp';
  const db = new ToolDatabase(config.dbPath || ':memory:');
  db.seedDemoKnowledge();
  db.seedDemoCalendar();
  db.seedDemoIntegrations();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const sessions = new Map<string, McpSession>();

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', port });
  });

  app.post(endpoint, async (req: Request, res: Response) => {
    const sessionId = req.header('mcp-session-id');
    let session = sessionId ? sessions.get(sessionId) : undefined;

    try {
      if (!session && !sessionId && isInitializeRequest(req.body)) {
        let transport!: StreamableHTTPServerTransport;
        const server = new McpServer({
          name: 'orchestra-mcp-server',
          version: '1.0.0'
        });
        registerAllTools(server, db);

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            sessions.set(newSessionId, { server, transport });
          }
        });
        transport.onclose = () => {
          if (transport.sessionId) {
            sessions.delete(transport.sessionId);
          }
        };

        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      if (!session && sessionId) {
        res.status(404).json({
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Session not found' },
          id: null
        });
        return;
      }

      if (!session) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Expected an MCP initialize request' },
          id: null
        });
        return;
      }

      await session.transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[ORCHESTRA MCP] Failed to process MCP POST request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null
        });
      }
    }
  });

  const handleSessionRequest = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.header('mcp-session-id');
    if (!sessionId) {
      res.status(400).send('Missing MCP session ID');
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session not found' },
        id: null
      });
      return;
    }

    try {
      await session.transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[ORCHESTRA MCP] Failed to process MCP session request:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      }
    }
  };

  app.get(endpoint, handleSessionRequest);
  app.delete(endpoint, handleSessionRequest);

  let httpServer: HttpServer | undefined;

  return {
    app,
    db,
    async listen(): Promise<{ close: () => Promise<void> }> {
      httpServer = app.listen(port, host);
      await new Promise<void>((resolve, reject) => {
        httpServer!.once('listening', resolve);
        httpServer!.once('error', reject);
      });

      return {
        close: async () => {
          await Promise.all([...sessions.values()].map(({ transport }) => transport.close()));
          sessions.clear();
          if (httpServer) {
            httpServer.closeAllConnections();
            await new Promise<void>((resolve, reject) => {
              httpServer!.close((error) => error ? reject(error) : resolve());
            });
            httpServer = undefined;
          }
          db.close();
        }
      };
    }
  };
}
