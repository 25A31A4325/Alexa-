import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface McpClientConfig {
  serverUrl?: string;
  clientName?: string;
  clientVersion?: string;
}

export interface DiscoveredTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

interface McpContentItem {
  type: string;
  text?: string;
  [key: string]: unknown;
}

interface McpToolCallResponse {
  content?: McpContentItem[];
  isError?: boolean;
  [key: string]: unknown;
}

export class OrchestraMcpClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  private serverUrl: string;

  constructor(config: McpClientConfig = {}) {
    this.serverUrl = config.serverUrl || process.env.MCP_SERVER_URL || 'http://http://127.0.0.1:3001/mcp';
    this.client = new Client({
      name: config.clientName || 'orchestra-client',
      version: config.clientVersion || '1.0.0'
    });
  }

  public async connect(): Promise<void> {
    if (this.transport) {
      return;
    }
    const url = new URL(this.serverUrl);
    const transport = new StreamableHTTPClientTransport(url, {
      requestInit: {
        headers: {
          'Accept': 'text/event-stream, application/json',
          'Content-Type': 'application/json'
        }
      }
    });
    try {
      await this.client.connect(transport);
      this.transport = transport;
    } catch (err) {
      this.transport = null;
      try {
        await transport.close();
      } catch {}
      throw err;
    }
  }

  public async listTools(): Promise<DiscoveredTool[]> {
    if (!this.transport) {
      throw new Error('McpClient is not connected. Call connect() first.');
    }
    try {
      const res = await this.client.listTools();
      return (res.tools || []).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema as Record<string, unknown>
      }));
    } catch (err: any) {
      if (err?.message?.includes('Not connected') || err?.message?.includes('closed')) {
        this.transport = null;
      }
      throw err;
    }
  }

  public async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.transport) {
      throw new Error('McpClient is not connected. Call connect() first.');
    }
    try {
      const rawRes = await this.client.callTool({
        name,
        arguments: args
      });

      const res = rawRes as McpToolCallResponse;

      if (res.isError) {
        const errText = res.content
          ?.map((c) => (c.type === 'text' && c.text ? c.text : ''))
          .join(' ') || 'Unknown MCP tool error';
        throw new Error(`Tool execution error: ${errText}`);
      }

      if (res.content && res.content.length > 0) {
        const first = res.content[0];
        if (first && first.type === 'text' && typeof first.text === 'string') {
          try {
            return JSON.parse(first.text);
          } catch {
            return first.text;
          }
        }
      }
      return res;
    } catch (err: any) {
      if (err?.message?.includes('Not connected') || err?.message?.includes('closed')) {
        this.transport = null;
      }
      throw err;
    }
  }

  public isConnected(): boolean {
    return this.transport !== null;
  }

  public getNegotiatedProtocolVersion(): string | undefined {
    return this.transport?.protocolVersion;
  }

  public getSessionId(): string | undefined {
    return this.transport?.sessionId;
  }

  public async close(): Promise<void> {
    if (this.transport) {
      try {
        await this.client.close();
      } catch {
        // Safe tear down
      }
      this.transport = null;
    }
  }
}
