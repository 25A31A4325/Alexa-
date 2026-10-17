import { createOrchestraServer } from './server.js';

export * from './db.js';
export * from './tools.js';
export * from './server.js';
export * from './integrations.js';

// Auto-run if executed directly as entrypoint
if (process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts')) {
  const host = process.env.MCP_SERVER_HOST || process.env.HOST || '0.0.0.0';
  const port = Number(process.env.MCP_SERVER_PORT || process.env.PORT) || 3001;
  const endpoint = process.env.MCP_SERVER_ENDPOINT || '/mcp';
  const server = createOrchestraServer({
    host,
    port,
    endpoint,
    dbPath: process.env.MCP_DB_PATH || process.env.ORCHESTRA_DB_PATH || process.env.DB_PATH || ':memory:'
  });

  server.listen().then((handle) => {
    console.log(`[ORCHESTRA MCP Server] Listening on http://${host}:${port}${endpoint}`);

    const shutdown = async () => {
      console.log('[ORCHESTRA MCP Server] Received shutdown signal, closing cleanly...');
      await handle.close();
      console.log('[ORCHESTRA MCP Server] Closed successfully.');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  });
}
