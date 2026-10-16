# ORCHESTRA — MCP Protocol, Transport & Conformance Specification (Proven)

## 1. Specification Baseline & SDK Verification
ORCHESTRA strictly implements the official Model Context Protocol (MCP) using the official TypeScript SDK `@modelcontextprotocol/sdk` (v1.x, currently latest v1.32.1 on npm).

* **Specification Standard:** Model Context Protocol (2024-11-05 standard).
* **Transport Mode:** **Streamable HTTP** (the modern standard succeeding legacy HTTP+SSE).
* **Wire Protocol:** JSON-RPC 2.0 over HTTP.
* **Server Transport:** `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`.
* **Client Transport:** `StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk/client/streamableHttp.js`.
* **Network Address:** `http://127.0.0.1:3001/mcp` (configurable via `MCP_SERVER_URL`).

---

## 2. Server Architecture & Lifecycle

### 2.1. Server Lifecycle States
1. **Boot:** Server initializes Express instance and mounts `/mcp`. Registers all 11 domain tools with typed Zod schemas.
2. **Listen:** Binds to `127.0.0.1:3001`. Validates incoming `Host` headers to prevent DNS rebinding.
3. **Session Handshake (`initialize`):** Receives JSON-RPC `initialize` request from client. Negotiates protocol version `2024-11-05` and returns server capabilities:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "result": {
       "protocolVersion": "2024-11-05",
       "capabilities": {
         "tools": { "listChanged": true }
       },
       "serverInfo": { "name": "orchestra-mcp-server", "version": "1.0.0" }
     }
   }
   ```
4. **Active Operation:** Handles concurrent `tools/list` and `tools/call` requests over Streamable HTTP.
5. **Teardown / Graceful Shutdown:** Closes active HTTP connections, flushes open event streams, and releases port.

### 2.2. Streamable HTTP Express Implementation Pattern
```typescript
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

export function createMcpHttpServer() {
  const app = express();
  app.use(express.json());

  // DNS Rebinding Guard
  app.use((req, res, next) => {
    const host = req.headers.host;
    if (host && (host.startsWith('localhost:3001') || host.startsWith('127.0.0.1:3001'))) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden: invalid host header" });
  });

  const mcpServer = new McpServer({
    name: "orchestra-mcp-server",
    version: "1.0.0"
  });

  // Register domain tools
  registerOrchestraTools(mcpServer);

  // Mount Streamable HTTP transport
  app.all('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport();
    await mcpServer.connect(transport);
    // Transport processes request/response stream
  });

  return app;
}
```

---

## 3. Client Architecture & Lifecycle

### 3.1. Client Lifecycle States
1. **Instantiation:** Instantiates official `Client` and `StreamableHTTPClientTransport(new URL("http://127.0.0.1:3001/mcp"))`.
2. **Connection Handshake:** Dispatches `initialize` and `notifications/initialized`.
3. **Dynamic Tool Discovery:** Calls `client.listTools()`. Discovered schemas are mapped to the LLM's function-calling tool format.
4. **Tool Invocation:** Calls `client.callTool({ name, arguments })` over HTTP.
5. **Error & Disconnect Handling:** Catches JSON-RPC errors (`-32602` Invalid params, `-32601` Method not found, `-32603` Internal error) and network timeouts.

---

## 4. Error Handling, Timeouts, and Recovery

| Failure Scenario | Protocol / Network Behavior | Orchestrator Recovery Action |
|---|---|---|
| **Server Offline / Unreachable** | Client fetch throws `ECONNREFUSED` | Orchestrator transitions to `RECOVERING`. Retries with exponential backoff (1s, 2s, 4s). Fails after 3 attempts with user-facing message. |
| **Invalid Tool Arguments** | Server returns JSON-RPC `-32602` Invalid params with Zod error breakdown | Tool invocation recorded as failed in SQLite. LLM receives error feedback in next turn to self-correct parameters. |
| **Unknown Tool Requested** | Server returns JSON-RPC `-32601` Method not found | Orchestrator invalidates tool cache, re-triggers `tools/list`, and prompts LLM with valid tool catalog. |
| **Tool Execution Timeout** | Client aborts after 30,000ms via `AbortSignal` | Invocation marked as `TIMEOUT`. Task marked `FAILED_RETRYABLE`. |
| **Mid-Execution Server Crash** | Connection terminates abruptly | Orchestrator startup reconciliation routine detects incomplete invocation, marks as interrupted, and reconciles state safely. |

---

## 5. Mandatory Conformance Integration Test Chain

We mandate an automated integration test (`test/mcp-conformance.test.ts`) that executes the complete physical chain without mocking:

```
[Actual Test Runner] 
         | (1) Spawns real McpServer on 127.0.0.1:3001
         v
[StreamableHTTPServerTransport]
         ^
         | (2) Physical HTTP POST/GET over TCP loopback
         v
[StreamableHTTPClientTransport]
         | (3) Handshake & initialize
         v
[tools/list] ---> Verifies all 11 tools returned with valid JSON Schema
         | (4) Real invocation
         v
[tools/call ('search_knowledge', { query: 'roadmap' })]
         | (5) Executes real handler
         v
[Real Handler returns demonstration documents]
         | (6) Verifies JSON-RPC 2.0 response format and payload content
         v
[Test Asserts Success]
```

**Failure Conditions:** The test suite immediately fails if:
* The HTTP port is unreachable.
* The protocol version handshake fails.
* `tools/list` does not discover the registered tools.
* Direct function calls are made instead of using `client.callTool`.
* Returned tool payload is missing structured content.
