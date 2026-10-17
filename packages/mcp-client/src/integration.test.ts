import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrchestraServer } from '@orchestra/mcp-server';
import { OrchestraMcpClient } from './client.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

test('ORCHESTRA MCP Streamable HTTP Integration Test Suite', async (t) => {
  const TEST_PORT = 3199;
  const TEST_URL = `http://127.0.0.1:${TEST_PORT}/mcp`;
  const TEST_DB = path.join(process.cwd(), 'test-scratch.db');

  // Clean prior scratch db if exists
  if (fs.existsSync(TEST_DB)) {
    try { fs.unlinkSync(TEST_DB); } catch {}
  }

  let serverInstance = createOrchestraServer({
    host: '127.0.0.1',
    port: TEST_PORT,
    endpoint: '/mcp',
    dbPath: TEST_DB
  });

  let runningServer = await serverInstance.listen();

  t.after(async () => {
    if (runningServer) {
      await runningServer.close();
    }
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
  });

  // TC-MCP-01: Client connects to running server using selected compatible MCP protocol version
  await t.test('TC-MCP-01: Client connects to running server over Streamable HTTP', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const sessionId = client.getSessionId();
    assert.ok(sessionId, 'Client received a valid session ID upon handshake');
    await client.close();
  });

  // TC-MCP-02: Client discovers the registered tools over MCP
  await t.test('TC-MCP-02: Client discovers all 16 registered tools dynamically', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const tools = await client.listTools();
    const toolNames = tools.map(t => t.name);

    const expectedTools = [
      'search_knowledge',
      'retrieve_document',
      'analyze_document',
      'create_task',
      'update_task',
      'get_task_status',
      'get_conversation_context',
      'save_context',
      'verify_action',
      'detect_conflict',
      'validate_result',
      'calendar_read_events',
      'calendar_create_reminder',
      'database_query',
      'send_notification',
      'list_connected_services'
    ];

    for (const expected of expectedTools) {
      assert.ok(toolNames.includes(expected), `Tool '${expected}' was discovered over MCP`);
    }
    assert.equal(tools.length, 16, 'All 16 tools discovered over MCP boundary');
    await client.close();
  });

  // TC-MCP-03: Client invokes search_knowledge through MCP client
  await t.test('TC-MCP-03: Client invokes search_knowledge and receives demo documents', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const res = await client.callTool('search_knowledge', { query: 'Roadmap', limit: 3 }) as { results: Array<{ id: string; is_local_demo: boolean }> };
    assert.ok(res.results.length > 0, 'Found matching demonstration documents');
    assert.equal(res.results[0]!.is_local_demo, true, 'Document explicitly labeled as local demonstration data');
    assert.equal(res.results[0]!.id, 'doc-q4-roadmap');
    await client.close();
  });

  // TC-MCP-04: Client invokes retrieve_document through MCP and receives stored content
  await t.test('TC-MCP-04: Client invokes retrieve_document through MCP', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const res = await client.callTool('retrieve_document', { documentId: 'doc-q4-roadmap' }) as { id: string; content: string; is_local_demo: boolean };
    assert.equal(res.id, 'doc-q4-roadmap');
    assert.ok(res.content.includes('Q4 PRODUCT ROADMAP DISCUSSION BRIEF'), 'Stored document content matches demonstration record');
    assert.equal(res.is_local_demo, true);
    await client.close();
  });

  // TC-MCP-05: Client invokes create_task and confirms task is persisted
  let createdTaskId = '';
  await t.test('TC-MCP-05: Client invokes create_task and confirms task persisted', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const res = await client.callTool('create_task', {
      missionId: 'mission-hackathon-01',
      title: 'Analyze roadmap dependencies',
      priority: 'high'
    }) as { taskId: string; title: string; status: string };

    assert.ok(res.taskId.startsWith('task-'));
    assert.equal(res.title, 'Analyze roadmap dependencies');
    assert.equal(res.status, 'pending');
    createdTaskId = res.taskId;

    // Verify task status via get_task_status
    const statusRes = await client.callTool('get_task_status', { missionId: 'mission-hackathon-01' }) as { totalTasks: number; tasks: Array<{ taskId: string }> };
    assert.equal(statusRes.totalTasks, 1);
    assert.equal(statusRes.tasks[0]!.taskId, createdTaskId);
    await client.close();
  });

  // TC-MCP-06: Client invokes update_task and confirms updated state
  await t.test('TC-MCP-06: Client invokes update_task and confirms updated state', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const res = await client.callTool('update_task', {
      taskId: createdTaskId,
      status: 'completed',
      notes: 'Roadmap dependencies verified against schedule.'
    }) as { taskId: string; updatedStatus: string; notes: string };

    assert.equal(res.taskId, createdTaskId);
    assert.equal(res.updatedStatus, 'completed');
    assert.equal(res.notes, 'Roadmap dependencies verified against schedule.');
    await client.close();
  });

  // TC-MCP-07: Invalid arguments are rejected
  await t.test('TC-MCP-07: Invalid arguments are rejected with schema validation error', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    await assert.rejects(
      async () => {
        // Missing required 'title' field for create_task
        await client.callTool('create_task', { missionId: 'mission-test' });
      },
      /error/i,
      'Schema error thrown for invalid input parameters'
    );
    await client.close();
  });

  // TC-MCP-08: An unavailable server produces an honest connection error
  await t.test('TC-MCP-08: Unavailable server produces honest connection error', async () => {
    const client = new OrchestraMcpClient({ serverUrl: 'http://127.0.0.1:49999/mcp' });
    await assert.rejects(
      async () => {
        await client.connect();
      },
      /ECONNREFUSED|Streamable HTTP error|fetch failed/i,
      'Produces honest network connection error when server is offline'
    );
  });

  // TC-MCP-09: Persisted records remain available after server restart
  await t.test('TC-MCP-09: Persisted records remain available after server restart', async () => {
    // 1. Restart server on same database file
    await runningServer.close();

    // Small delay to allow TCP socket release on Windows
    await new Promise((resolve) => setTimeout(resolve, 250));

    serverInstance = createOrchestraServer({
      host: '127.0.0.1',
      port: TEST_PORT,
      endpoint: '/mcp',
      dbPath: TEST_DB
    });
    runningServer = await serverInstance.listen();

    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const statusRes = await client.callTool('get_task_status', { missionId: 'mission-hackathon-01' }) as { totalTasks: number; tasks: Array<{ taskId: string; status: string }> };
    assert.equal(statusRes.totalTasks, 1, 'Persisted task survives server restart');
    assert.equal(statusRes.tasks[0]!.taskId, createdTaskId);
    assert.equal(statusRes.tasks[0]!.status, 'completed', 'Task status intact in SQLite storage');
    await client.close();
  });

  // TC-MCP-10: The server does not report success when a handler fails
  await t.test('TC-MCP-10: Server does not report success when handler fails', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    await assert.rejects(
      async () => {
        await client.callTool('retrieve_document', { documentId: 'non-existent-doc-id-999' });
      },
      /not found/i,
      'Handler failure propagated as error result'
    );
    await client.close();
  });

  // TC-MCP-11: Actual negotiated protocol version meets the hackathon requirement
  await t.test('TC-MCP-11: Actual negotiated protocol version is 2025-11-25 or later', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();
    const version = client.getNegotiatedProtocolVersion();
    assert.ok(version, 'Negotiated protocol version is defined');
    assert.ok(
      version >= '2024-11-05',
      `Protocol version '${version}' is compatible with standard`
    );
    assert.equal(version, '2025-11-25', 'Negotiated version is 2025-11-25 as required');
    await client.close();
  });

  await t.test('TC-MCP-12: Calendar, analytics, notifications, and connector tools work on local demo data', async () => {
    const client = new OrchestraMcpClient({ serverUrl: TEST_URL });
    await client.connect();

    const calendar = await client.callTool('calendar_read_events', {}) as {
      events: Array<{ id: string; title: string }>;
      externalCalendarAccess: boolean;
      is_local_demo: boolean;
    };
    assert.equal(calendar.events[0]!.id, 'demo-roadmap-meeting');
    assert.equal(calendar.externalCalendarAccess, false);
    assert.equal(calendar.is_local_demo, true);

    const reminder = await client.callTool('calendar_create_reminder', {
      title: 'Prepare for roadmap meeting',
      reminderTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      eventId: 'demo-roadmap-meeting'
    }) as { reminder: { status: string }; delivery: string };
    assert.equal(reminder.reminder.status, 'scheduled_local');
    assert.equal(reminder.delivery, 'local_demo_only');

    const notification = await client.callTool('send_notification', {
      channel: 'email',
      recipient: 'demo@example.test',
      title: 'Roadmap reminder',
      message: 'This is a local demo notification.'
    }) as { notification: { status: string }; delivery: string };
    assert.equal(notification.notification.status, 'queued_local');
    assert.equal(notification.delivery, 'queued_local_only');

    const analytics = await client.callTool('database_query', { metric: 'calendar' }) as {
      reminders: { count: number };
      is_local_demo: boolean;
    };
    assert.equal(analytics.reminders.count, 1);
    assert.equal(analytics.is_local_demo, true);

    const services = await client.callTool('list_connected_services', {}) as {
      services: unknown[];
      externalProviderAccess: boolean;
    };
    assert.ok(services.services.length > 0);
    assert.equal(services.externalProviderAccess, false);
    await client.close();
  });
});
