import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import { Server as HttpServer } from 'node:http';
import { ToolDatabase } from './db.js';
import { registerAllTools } from './tools.js';
import { IntegrationService, McpApprovalContext } from './integrations.js';
import { runWithMcpRequestIdentity } from './request-context.js';

export interface McpServerConfig {
  host?: string;
  port?: number;
  endpoint?: string;
  dbPath?: string;
  integrationService?: IntegrationService;
}

interface McpSession {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

export function createOrchestraServer(config: McpServerConfig = {}) {
  const host = config.host || '0.0.0.0';
  const port = config.port ?? 3001;
  const endpoint = config.endpoint || '/mcp';
  const dbPath = config.dbPath || ':memory:';
  const db = new ToolDatabase(dbPath);
  const integrations = config.integrationService || new IntegrationService({ dbPath });
  db.seedDemoKnowledge();
  db.seedDemoCalendar();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const sessions = new Map<string, McpSession>();

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', port });
  });

  const requestIdentity = (req: Request) => {
    const sessionId = req.header('x-orchestra-user-session') || '';
    const approvalPayload = req.header('x-orchestra-approval') || '';
    const signature = req.header('x-orchestra-context-signature') || '';
    if (!sessionId || !integrations.verifyMcpContext(sessionId, approvalPayload, signature)) {
      return { sessionId: null };
    }
    let approval: McpApprovalContext | undefined;
    if (approvalPayload) {
      try {
        const parsed: unknown = JSON.parse(Buffer.from(approvalPayload, 'base64url').toString('utf8'));
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'missionId' in parsed &&
          'taskId' in parsed &&
          'actionType' in parsed &&
          'fingerprint' in parsed &&
          'parameters' in parsed &&
          typeof parsed.missionId === 'string' &&
          typeof parsed.taskId === 'string' &&
          typeof parsed.actionType === 'string' &&
          typeof parsed.fingerprint === 'string' &&
          typeof parsed.parameters === 'object' &&
          parsed.parameters !== null &&
          !Array.isArray(parsed.parameters)
        ) {
          approval = parsed as McpApprovalContext;
        } else {
          return { sessionId: null };
        }
      } catch {
        return { sessionId: null };
      }
    }
    return { sessionId, approval };
  };

  const handlePostRequest = async (req: Request, res: Response): Promise<void> => {
    const transportSessionId = req.header('mcp-session-id');
    const session = transportSessionId ? sessions.get(transportSessionId) : undefined;
    try {
      if (!session && !transportSessionId && isInitializeRequest(req.body)) {
        let transport!: StreamableHTTPServerTransport;
        const server = new McpServer({
          name: 'orchestra-mcp-server',
          version: '1.0.0'
        });
        registerAllTools(server, db, integrations);
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            sessions.set(newSessionId, { server, transport });
          }
        });
        transport.onclose = () => {
          if (transport.sessionId) sessions.delete(transport.sessionId);
        };
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      if (!session && transportSessionId) {
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
  };

  app.post(endpoint, (req: Request, res: Response) =>
    runWithMcpRequestIdentity(requestIdentity(req), () => handlePostRequest(req, res))
  );

  const handleSessionRequest = async (req: Request, res: Response): Promise<void> => {
    const transportSessionId = req.header('mcp-session-id');
    if (!transportSessionId) {
      res.status(400).send('Missing MCP session ID');
      return;
    }
    const session = sessions.get(transportSessionId);
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
      if (!res.headersSent) res.status(500).send('Internal server error');
    }
  };

  const handleAuthenticatedSessionRequest = (req: Request, res: Response) =>
    runWithMcpRequestIdentity(requestIdentity(req), () => handleSessionRequest(req, res));
  app.get(endpoint, handleAuthenticatedSessionRequest);
  app.delete(endpoint, handleAuthenticatedSessionRequest);

  let httpServer: HttpServer | undefined;
  return {
    app,
    db,
    integrations,
    async listen(): Promise<{ port: number; close: () => Promise<void> }> {
      httpServer = app.listen(port, host);
      await new Promise<void>((resolve, reject) => {
        httpServer!.once('listening', resolve);
        httpServer!.once('error', reject);
      });
      const addr = httpServer!.address();
      const actualPort = typeof addr === 'object' && addr !== null ? addr.port : port;
      return {
        port: actualPort,
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
          if (!config.integrationService) integrations.close();
        }
      };
    }
  };
}
