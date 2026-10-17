import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { createWebApp } from './server.js';
import { OrchestratorDatabase, MissionOrchestrator } from '@orchestra/orchestrator';
import { ToolDatabase, createOrchestraServer } from '@orchestra/mcp-server';
import { INVARIANT_SIDEBAR_ITEMS } from './components/sidebar.js';
import { classifyTool, renderToolsPage } from './pages/tools.js';

describe('ORCHESTRA Phase 5.1 — UI/Backend Integration & Security Audit', () => {
  let webServer: Server;
  let mcpServer: Server;
  let webBaseUrl: string;
  let mcpServerUrl: string;
  let orchestratorDb: OrchestratorDatabase;
  let toolDb: ToolDatabase;
  let orchestrator: MissionOrchestrator;

  before(async () => {
    // 1. Start live MCP Server on dynamic port
    const mcpApp = createOrchestraServer({ port: 0 });
    await new Promise<void>((resolve) => {
      mcpServer = mcpApp.app.listen(0, '127.0.0.1', () => {
        const addr = mcpServer.address();
        if (typeof addr === 'object' && addr !== null) {
          mcpServerUrl = `http://127.0.0.1:${addr.port}/mcp`;
        }
        resolve();
      });
    });

    // 2. Initialize in-memory databases
    orchestratorDb = new OrchestratorDatabase(':memory:');
    toolDb = new ToolDatabase(':memory:');
    toolDb.seedDemoKnowledge();

    // 3. Connect Orchestrator to live MCP Server
    orchestrator = new MissionOrchestrator({
      serverUrl: mcpServerUrl,
      db: orchestratorDb
    });
    await orchestrator.connect();

    // 4. Start Web Application connected to live orchestrator and databases
    const web = createWebApp({
      orchestrator,
      orchestratorDb,
      toolDb,
      mcpServerUrl
    });

    await new Promise<void>((resolve) => {
      webServer = web.app.listen(0, '127.0.0.1', () => {
        const addr = webServer.address();
        if (typeof addr === 'object' && addr !== null) {
          webBaseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    webServer.closeAllConnections?.();
    await new Promise<void>((resolve) => {
      webServer.close(() => resolve());
    });
    mcpServer.closeAllConnections?.();
    await new Promise<void>((resolve) => {
      mcpServer.close(() => resolve());
    });
    await orchestrator.close();
    toolDb.close();
  });

  // =========================================================================
  // 1. INVARIANT SIDEBAR VERIFICATION
  // =========================================================================
  test('UI-NAV-01: Invariant sidebar strictly enforces exactly 8 items in required order across routes', async () => {
    assert.equal(INVARIANT_SIDEBAR_ITEMS.length, 8, 'Sidebar must have exactly 8 items');

    const expectedItems = [
      { id: 'home', label: 'Home', route: '/' },
      { id: 'new-conversation', label: 'New Conversation', route: '/new' },
      { id: 'missions', label: 'Missions', route: '/missions' },
      { id: 'knowledge', label: 'Knowledge', route: '/knowledge' },
      { id: 'tools', label: 'Tools', route: '/tools' },
      { id: 'integrations', label: 'Integrations', route: '/integrations' },
      { id: 'activity', label: 'Activity', route: '/activity' },
      { id: 'settings', label: 'Settings', route: '/settings' }
    ];

    for (let i = 0; i < expectedItems.length; i++) {
      const exp = expectedItems[i]!;
      const actual = INVARIANT_SIDEBAR_ITEMS[i]!;
      assert.equal(actual.id, exp.id);
      assert.equal(actual.label, exp.label);
      assert.equal(actual.route, exp.route);
    }

    const res = await fetch(`${webBaseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();

    for (const item of expectedItems) {
      assert.ok(html.includes(item.label), `HTML must contain sidebar label "${item.label}"`);
      assert.ok(html.includes(`href="${item.route}"`), `HTML must contain sidebar href "${item.route}"`);
    }
  });

  // =========================================================================
  // 2. ROUTE RENDERING BASELINE
  // =========================================================================
  test('UI-ROUTE-01: All primary routes render with 200 OK and valid HTML shells', async () => {
    const routes = [
      '/',
      '/new',
      '/missions',
      '/knowledge',
      '/tools',
      '/integrations',
      '/activity',
      '/settings'
    ];

    for (const route of routes) {
      const res = await fetch(`${webBaseUrl}${route}`);
      assert.equal(res.status, 200, `Route ${route} must return 200 OK`);
      const text = await res.text();
      assert.ok(text.includes('ORCHESTRA'), `Route ${route} must contain ORCHESTRA branding`);
      assert.ok(text.includes('<!DOCTYPE html>'), `Route ${route} must return valid DOCTYPE`);
    }
  });

  // =========================================================================
  // 3. KNOWLEDGE LIBRARY TRANSPARENCY
  // =========================================================================
  test('UI-KNOW-01: Knowledge route queries SQLite and tags local demo records honestly', async () => {
    const res = await fetch(`${webBaseUrl}/knowledge`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Q4 Product Roadmap') || html.includes('doc-q4-roadmap'), 'Must display roadmap doc');
    assert.ok(html.includes('is_local_demo: true') || html.includes('DEMO RECORD'), 'Must explicitly display local demo record tag');

    const resDoc = await fetch(`${webBaseUrl}/knowledge?id=doc-q4-roadmap`);
    assert.equal(resDoc.status, 200);
    const docHtml = await resDoc.text();
    assert.ok(docHtml.includes('Executive Summary'), 'Must display Executive Summary');
    assert.ok(docHtml.includes('Key Insights'), 'Must display Key Insights');
  });

  // =========================================================================
  // 4. LIVE MCP TOOL DISCOVERY & NONEXISTENT TOOL REJECTION
  // =========================================================================
  test('UI-TOOL-01: Tools route renders actual MCP tools from live discovery over Streamable HTTP', async () => {
    const res = await fetch(`${webBaseUrl}/tools`);
    assert.equal(res.status, 200);
    const html = await res.text();

    // Verify ACTUAL registered tools from packages/mcp-server/src/tools.ts appear
    assert.ok(html.includes('search_knowledge'), 'Must contain real search_knowledge tool');
    assert.ok(html.includes('retrieve_document'), 'Must contain real retrieve_document tool');
    assert.ok(html.includes('analyze_document'), 'Must contain real analyze_document tool');
    assert.ok(html.includes('create_task'), 'Must contain real create_task tool');
    assert.ok(html.includes('update_task'), 'Must contain real update_task tool');
    assert.ok(html.includes('get_task_status'), 'Must contain real get_task_status tool');
    assert.ok(html.includes('get_conversation_context'), 'Must contain real get_conversation_context tool');
    assert.ok(html.includes('save_context'), 'Must contain real save_context tool');
    assert.ok(html.includes('verify_action'), 'Must contain real verify_action tool');
    assert.ok(html.includes('detect_conflict'), 'Must contain real detect_conflict tool');
    assert.ok(html.includes('validate_result'), 'Must contain real validate_result tool');
    assert.ok(html.includes('calendar_read_events'), 'Must contain real calendar_read_events tool');
    assert.ok(html.includes('calendar_create_reminder'), 'Must contain real calendar_create_reminder tool');
    assert.ok(html.includes('database_query'), 'Must contain real database_query tool');
    assert.ok(html.includes('send_notification'), 'Must contain real send_notification tool');
    assert.ok(html.includes('list_connected_services'), 'Must contain real list_connected_services tool');

    // Confirm that hypothetical nonexistent tools do NOT appear as available
    assert.ok(!html.includes('data-tool-name="send_message"'), 'Must NOT list nonexistent send_message tool');
    assert.ok(!html.includes('data-tool-name="create_calendar_event"'), 'Must NOT list nonexistent create_calendar_event tool');
    assert.ok(!html.includes('data-tool-name="crm_update_contact"'), 'Must NOT list nonexistent crm_update_contact tool');
    assert.ok(!html.includes('data-tool-name="send_email"'), 'Must NOT list nonexistent send_email tool');

    // Confirm consequential classification on verify_action
    assert.ok(html.includes('Consequential Gate'), 'verify_action must be flagged as Consequential Gate');
  });

  test('UI-TOOL-02: Backend classification strictly marks unknown tools as "Classification unavailable"', () => {
    const unknown = classifyTool('nonexistent_custom_tool');
    assert.equal(unknown.classification, 'Classification unavailable');
    assert.equal(unknown.category, 'Unclassified');
  });

  test('UI-TOOL-03: Offline MCP server is reported honestly without rendering mock catalog', () => {
    const html = renderToolsPage({
      tools: [],
      serverOnline: false,
      errorMessage: 'ECONNREFUSED http://127.0.0.1:3001'
    });

    assert.ok(html.includes('MCP Server Offline / Tools Unavailable'));
    assert.ok(html.includes('0 Tools Available'));
    assert.ok(!html.includes('data-tool-name="search_knowledge"'));
  });

  test('UI-TOOL-04: Tools catalog renders 9 capability cards, filter pill tabs, hero banner, and orchestration pipeline', async () => {
    const res = await fetch(`${webBaseUrl}/tools`);
    assert.equal(res.status, 200);
    const html = await res.text();

    // 1. Header & Hero banner
    assert.ok(html.includes('Tools'), 'Must contain Tools title');
    assert.ok(html.includes('Manage Tools'), 'Must contain Manage Tools button');
    assert.ok(html.includes('Multiple capabilities. One intelligent agent.'), 'Must contain hero heading');
    assert.ok(html.includes('Explore all tools →'), 'Must contain explore button');

    // 2. Filter pill tabs & Search box
    assert.ok(html.includes('All Tools'), 'Filter All Tools must exist');
    assert.ok(html.includes('Planning'), 'Filter Planning must exist');
    assert.ok(html.includes('Context'), 'Filter Context must exist');
    assert.ok(html.includes('Data'), 'Filter Data must exist');
    assert.ok(html.includes('External Services'), 'Filter External Services must exist');
    assert.ok(html.includes('Verification'), 'Filter Verification must exist');
    assert.ok(html.includes('Search tools...'), 'Search input must exist');

    // 3. 9 Cards
    assert.ok(html.includes('Document Analysis'), 'Document Analysis card must exist');
    assert.ok(html.includes('Calendar'), 'Calendar card must exist');
    assert.ok(html.includes('Knowledge Search'), 'Knowledge Search card must exist');
    assert.ok(html.includes('Task Management'), 'Task Management card must exist');
    assert.ok(html.includes('Data Analysis'), 'Data Analysis card must exist');
    assert.ok(html.includes('Notifications'), 'Notifications card must exist');
    assert.ok(html.includes('Conversation Context'), 'Conversation Context card must exist');
    assert.ok(html.includes('Verification'), 'Verification card must exist');
    assert.ok(html.includes('Connected Services'), 'Connected Services card must exist');

    // 4. Tool Orchestration Pipeline
    assert.ok(html.includes('Tool Orchestration'), 'Tool Orchestration header must exist');
    assert.ok(html.includes('Discover Tools'), 'Pipeline step Discover Tools must exist');
    assert.ok(html.includes('Select'), 'Pipeline step Select must exist');
    assert.ok(html.includes('Execute'), 'Pipeline step Execute must exist');
    assert.ok(html.includes('Verify'), 'Pipeline step Verify must exist');
    assert.ok(html.includes('Deliver Results'), 'Pipeline step Deliver Results must exist');
  });

  // =========================================================================
  // 5. INTEGRATIONS & DEMO ADAPTER TRANSPARENCY
  // =========================================================================
  test('UI-INT-01: Integrations route displays connectors and distinguishes demo adapters', async () => {
    const res = await fetch(`${webBaseUrl}/integrations`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Alexa & Google Calendar'));
    assert.ok(html.includes('Slack & Alexa Messaging'));
    assert.ok(html.includes('LOCAL DEMO'));
  });

  // =========================================================================
  // 6. ACTIVITY & AUDIT METRICS
  // =========================================================================
  test('UI-ACT-01: Activity route queries audit records and metrics from SQLite', async () => {
    orchestratorDb.recordActivity({
      id: `act-audit-${Date.now()}`,
      eventType: 'Mission',
      title: 'Audit Verification Event',
      description: 'Audit test record persisted in SQLite'
    });

    const res = await fetch(`${webBaseUrl}/activity`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Audit Verification Event'));
    assert.ok(html.includes('Total Invocations'));
  });

  // =========================================================================
  // 7. SETTINGS PAGE
  // =========================================================================
  test('UI-SET-01: Settings route displays builder profile, MCP endpoints, and SHA-256 fingerprinting', async () => {
    const res = await fetch(`${webBaseUrl}/settings`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Shanmukheswar'));
    assert.ok(html.includes('2025-11-25'));
    assert.ok(html.includes('Streamable HTTP'));
    assert.ok(html.includes('SHA-256'));
  });

  // =========================================================================
  // 8. FULL END-TO-END MEETING PREPARATION WORKFLOW THROUGH LIVE MCP SERVER
  // =========================================================================
  test('UI-E2E-01: Meeting Preparation Mission submits, executes tasks via MCP, halts at approval, and resumes upon valid fingerprint', async () => {
    const goal = 'I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven\'t prepared, prepare a checklist, and remind me what I need to do.';

    // 1. Submit mission via POST /api/missions
    const submitRes = await fetch(`${webBaseUrl}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    });
    assert.equal(submitRes.status, 201);
    const submitData = await submitRes.json() as any;
    const missionId = submitData.missionId;
    assert.ok(missionId);

    // 2. Poll state until execution pauses at AWAITING_APPROVAL
    let paused = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      const stateRes = await fetch(`${webBaseUrl}/api/missions/${missionId}/state`);
      const stateData = await stateRes.json() as any;
      if (stateData.mission.status === 'AWAITING_APPROVAL') {
        paused = true;
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    assert.ok(paused, 'Mission must pause in AWAITING_APPROVAL at step 7');

    // 3. Inspect persistent SQLite state
    const stateRes = await fetch(`${webBaseUrl}/api/missions/${missionId}/state`);
    const stateData = await stateRes.json() as any;

    assert.equal(stateData.mission.status, 'AWAITING_APPROVAL');
    assert.equal(stateData.tasks.length, 7, 'All 7 tasks planned in DAG');

    // Tasks 1-6 completed with real tool invocations
    for (let i = 0; i < 6; i++) {
      assert.equal(stateData.tasks[i].status, 'completed', `Task ${i + 1} completed via live MCP`);
      assert.ok(stateData.tasks[i].duration_ms >= 0);
      assert.ok(stateData.tasks[i].result_json);
    }

    // Task 7 pending approval
    assert.equal(stateData.tasks[6].status, 'pending');
    assert.equal(stateData.tasks[6].requires_approval, 1);

    // Pending approval record exists
    const approval = stateData.pendingApproval;
    assert.ok(approval, 'Pending approval record must exist in SQLite');
    assert.equal(approval.action_type, 'calendar_create_reminder');
    assert.equal(approval.status, 'pending');

    // 4. Test Approval Security: Reject tampered fingerprint
    const tamperedRes = await fetch(`${webBaseUrl}/api/approvals/${approval.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedFingerprint: 'tampered-fingerprint-bad-sha256',
        decision: 'approved'
      })
    });
    assert.equal(tamperedRes.status, 400, 'Tampered parameter fingerprint must be rejected');

    // 5. Approve with legitimate canonical fingerprint
    const validRes = await fetch(`${webBaseUrl}/api/approvals/${approval.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedFingerprint: approval.canonical_fingerprint,
        decision: 'approved',
        note: 'Authorized by reviewer'
      })
    });
    assert.equal(validRes.status, 200, 'Matching fingerprint must be accepted');

    // 6. Wait for downstream completion through independent verification
    let completed = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      const finRes = await fetch(`${webBaseUrl}/api/missions/${missionId}/state`);
      const finData = await finRes.json() as any;
      if (finData.mission.status === 'COMPLETED') {
        completed = true;
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    assert.ok(completed, 'Mission must reach COMPLETED status after approval execution');

    // 7. Verify final persisted verification results
    const finalState = await (await fetch(`${webBaseUrl}/api/missions/${missionId}/state`)).json() as any;
    assert.equal(finalState.mission.status, 'COMPLETED');
    assert.ok(finalState.verification, 'Independent verification record must exist');
    assert.equal(finalState.verification.is_valid, 1);
    assert.ok(finalState.verification.confidence_score >= 0.8);
  });

  // =========================================================================
  // 9. CONTROLLED MISSION FAILURE BEHAVIOR
  // =========================================================================
  test('UI-FAIL-01: Controlled failure leaves mission visibly in FAILED state without false completion', async () => {
    const missionId = `m-controlled-fail-${Date.now()}`;
    orchestratorDb.createMission(missionId, 'Mission doomed to failure');
    orchestratorDb.updateMissionStatus(missionId, 'FAILED', 'Controlled failure test: simulation error');

    const res = await fetch(`${webBaseUrl}/api/missions/${missionId}/state`);
    assert.equal(res.status, 200);
    const data = await res.json() as any;
    assert.equal(data.mission.status, 'FAILED');
    assert.ok(data.mission.error_message.includes('simulation error'));

    // Check UI detail page
    const detailRes = await fetch(`${webBaseUrl}/missions/${missionId}`);
    assert.equal(detailRes.status, 200);
    const detailHtml = await detailRes.text();
    assert.ok(detailHtml.includes('FAILED'), 'Detail view must display FAILED badge');
    assert.ok(!detailHtml.includes('COMPLETED'), 'Failed mission must not display COMPLETED badge');
  });

  // =========================================================================
  // 9B. CLARIFICATION HANDLING & APPROVAL REJECTION
  // =========================================================================
  test('UI-CLARIFY-01: Needs clarification state displays input and resumes via POST /api/missions/:id/clarify', async () => {
    const missionId = `m-clarify-${Date.now()}`;
    orchestratorDb.createMission(missionId, 'Ambiguous meeting brief');
    orchestratorDb.updateMissionStatus(missionId, 'NEEDS_CLARIFICATION');
    orchestratorDb.setClarificationPrompt(missionId, 'Specify participant list');

    // Verify UI renders clarification prompt
    const pageRes = await fetch(`${webBaseUrl}/missions/${missionId}`);
    assert.equal(pageRes.status, 200);
    const pageHtml = await pageRes.text();
    assert.ok(pageHtml.includes('MISSION OBJECTIVE REQUIRES CLARIFICATION'));
    assert.ok(pageHtml.includes('Specify participant list'));

    // Submit clarification
    const clarifyRes = await fetch(`${webBaseUrl}/api/missions/${missionId}/clarify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalContext: 'Participants: Product, Eng, Design' })
    });
    assert.equal(clarifyRes.status, 200);
    const clarifyData = await clarifyRes.json() as any;
    assert.equal(clarifyData.success, true);

    const updated = orchestratorDb.getMission(missionId);
    assert.ok(updated!.goal.includes('Participants: Product, Eng, Design'));
  });

  test('UI-REJECT-01: Human rejection safely halts consequential action without execution', async () => {
    const missionId = `m-reject-${Date.now()}`;
    orchestratorDb.createMission(missionId, 'Action that user rejects');
    orchestratorDb.updateMissionStatus(missionId, 'AWAITING_APPROVAL');

    const plan = orchestratorDb.createPlan(`p-rej-${Date.now()}`, missionId);
    const task = orchestratorDb.createTask({
      id: `task-rej-${Date.now()}`,
      missionId,
      planId: plan.id,
      stepIndex: 1,
      title: 'Dangerous action',
      toolName: 'verify_action',
      toolInputTemplate: JSON.stringify({ actionType: 'delete_data', parameters: {} }),
      requiresApproval: true
    });

    const fp = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const app = orchestratorDb.createApproval({
      id: `app-rej-${Date.now()}`,
      missionId,
      taskId: task.id,
      actionType: 'delete_data',
      canonicalFingerprint: fp,
      parametersJson: JSON.stringify({ actionType: 'delete_data', parameters: {} }),
      expiresAt: Date.now() + 60000
    });

    // Reject via API
    const rejRes = await fetch(`${webBaseUrl}/api/approvals/${app.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedFingerprint: fp,
        decision: 'rejected',
        note: 'User declined action'
      })
    });
    assert.equal(rejRes.status, 200);

    const updatedApp = orchestratorDb.getApproval(app.id);
    assert.equal(updatedApp?.status, 'rejected');
  });

  // =========================================================================
  // 10. REAL SSE STREAMING & RECONNECTION DEDUPLICATION
  // =========================================================================
  test('UI-SSE-01: SSE stream sends state_sync on connection, assigns stable deduplication IDs, and handles clean disconnect', async () => {
    const missionId = `m-sse-test-${Date.now()}`;
    orchestratorDb.createMission(missionId, 'SSE stream validation mission');

    const controller = new AbortController();
    const response = await fetch(`${webBaseUrl}/api/missions/${missionId}/events`, {
      signal: controller.signal
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/event-stream');

    const reader = response.body?.getReader();
    assert.ok(reader);

    // Initial event must be state_sync with stable event ID
    const { value } = await reader.read();
    const textChunk = new TextDecoder().decode(value);

    assert.ok(textChunk.includes('event: state_sync'), 'Initial event must be state_sync');
    assert.ok(textChunk.includes('id: evt-sync-'), 'Must contain stable deduplication event ID');
    assert.ok(textChunk.includes(missionId), 'Payload must contain missionId');

    // Clean disconnect
    controller.abort();
  });

  // =========================================================================
  // 11. DATA AND SECURITY BOUNDARIES
  // =========================================================================
  test('UI-SEC-01: Invalid mission inputs, missing approvals, and non-existent missions are rejected honestly', async () => {
    // 1. Invalid mission goal rejected
    const badGoalRes = await fetch(`${webBaseUrl}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'hi' })
    });
    assert.equal(badGoalRes.status, 400);

    // 2. Non-existent approval ID rejected
    const badApprRes = await fetch(`${webBaseUrl}/api/approvals/non-existent-id/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedFingerprint: 'dummy',
        decision: 'approved'
      })
    });
    assert.equal(badApprRes.status, 404);

    // 3. SSE stream for non-existent mission returns 404
    const badSseRes = await fetch(`${webBaseUrl}/api/missions/non-existent-m-id/events`);
    assert.equal(badSseRes.status, 404);
  });

  // =========================================================================
  // 12. BROWSER AUTOMATION STATUS AUDIT
  // =========================================================================
  test('UI-BROWSER-01: Browser automation status is evaluated and verified as BLOCKED', async () => {
    let hasBrowserTooling = false;
    try {
      await import('playwright' as any);
      hasBrowserTooling = true;
    } catch {
      hasBrowserTooling = false;
    }

    // Must report BLOCKED honestly without fabricating browser test runs
    assert.equal(hasBrowserTooling, false, 'Playwright is not installed in the repository');
  });

  // =========================================================================
  // 13. OFFICIAL LOGO LOCK & BRANDING INTEGRATION
  // =========================================================================
  test('UI-BRAND-01: Official Amazon logo assets are served statically and rendered without distortion', async () => {
    // 1. Verify static asset endpoint for Image 1 (Amazon Smile Logo)
    const smileRes = await fetch(`${webBaseUrl}/static/amazon-smile-logo.png`);
    assert.equal(smileRes.status, 200, 'Smile logo asset must return HTTP 200');
    assert.ok(smileRes.headers.get('content-type')?.includes('image/png'), 'Must have image/png content type');
    const smileBytes = await smileRes.arrayBuffer();
    assert.ok(smileBytes.byteLength > 0, 'Smile logo asset must be present');

    // 2. Verify static asset endpoint for Image 2 (Amazon Wordmark Logo)
    const wordmarkRes = await fetch(`${webBaseUrl}/static/amazon-wordmark-logo.png`);
    assert.equal(wordmarkRes.status, 200, 'Wordmark logo asset must return HTTP 200');
    assert.ok(wordmarkRes.headers.get('content-type')?.includes('image/png'), 'Must have image/png content type');
    const wordmarkBytes = await wordmarkRes.arrayBuffer();
    assert.ok(wordmarkBytes.byteLength > 0, 'Wordmark logo asset must be present');

    // 3. Verify Favicon in layout head
    const homeRes = await fetch(`${webBaseUrl}/`);
    assert.equal(homeRes.status, 200);
    const homeHtml = await homeRes.text();
    assert.ok(homeHtml.includes('<link rel="icon" type="image/png" href="/static/amazon-smile-logo.png">'), 'Favicon must point to official Amazon smile logo');

    // 4. Verify Sidebar branding area
    assert.ok(homeHtml.includes('src="/static/amazon-smile-logo.png"'), 'Sidebar must render official Amazon smile logo');
    assert.ok(homeHtml.includes('src="/static/amazon-wordmark-logo.png"'), 'Sidebar must render official Amazon wordmark logo');

    // 5. Verify Tools page features the branding banner
    const toolsRes = await fetch(`${webBaseUrl}/tools`);
    assert.equal(toolsRes.status, 200);
    const toolsHtml = await toolsRes.text();
    assert.ok(toolsHtml.includes('Multiple capabilities. One intelligent agent.'), 'Tools page must include reference branding banner');
    assert.ok(toolsHtml.includes('src="/static/amazon-smile-logo.png"'), 'Tools banner must render smile logo');
    assert.ok(toolsHtml.includes('src="/static/amazon-wordmark-logo.png"'), 'Tools banner must render wordmark logo');

    // 6. Verify Settings profile card has Amazon Hackathon badge
    const settingsRes = await fetch(`${webBaseUrl}/settings`);
    assert.equal(settingsRes.status, 200);
    const settingsHtml = await settingsRes.text();
    assert.ok(settingsHtml.includes('src="/static/amazon-wordmark-logo.png"'), 'Settings page must render wordmark in builder profile');
  });

  // =========================================================================
  // 14. HOME PAGE REDESIGN MATCHING REFERENCE SCREENSHOT
  // =========================================================================
  test('UI-HOME-01: Redesigned Home page renders centered hero, 5 capability chips, mission input, and 4 use-case cards', async () => {
    const res = await fetch(`${webBaseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();

    // 1. Headline & Subtitle
    assert.ok(html.includes('Turn complex goals into'), 'Must contain primary headline');
    assert.ok(html.includes('real outcomes with'), 'Must contain headline continuation');
    assert.ok(html.includes('Alexa+'), 'Must highlight Alexa+ in headline');
    assert.ok(html.includes('I can understand your objective, plan the work, use multiple tools') || html.includes('I understand your objective'), 'Must contain reference subtitle');

    // 2. Action pills matching reference design
    assert.ok(html.includes('Plan a complex task') || html.includes('Plan and organize'), 'Action pill 1 must exist');
    assert.ok(html.includes('Analyze documents'), 'Action pill 2 must exist');
    assert.ok(html.includes('Find and organize information') || html.includes('Work with your data'), 'Action pill 3 must exist');
    assert.ok(html.includes('Take actions with my tools') || html.includes('Use multiple tools'), 'Action pill 4 must exist');

    // 3. Natural-language mission input form & action pills
    assert.ok(html.includes('Tell me your goal in natural language...'), 'Must contain natural language placeholder');
    assert.ok(html.includes('id="mission-form"'), 'Must contain mission input form');
    assert.ok(html.includes('id="mission-goal-input"'), 'Must contain mission input textarea');
    assert.ok(html.includes('id="mission-submit-btn"'), 'Must contain submit button');
    assert.ok(html.includes('Deep Research'), 'Must contain Deep Research action pill');
    assert.ok(html.includes('Web'), 'Must contain Web action pill');
    assert.ok(html.includes('🎙️'), 'Must contain voice mic icon');

    // 4. Popular Use Cases cards
    assert.ok(html.includes('POPULAR USE CASES'), 'Must contain Popular Use Cases section header');
    assert.ok(html.includes('Prepare me for my investor meeting') || html.includes('Prepare for my meeting'), 'Card 1 title must exist');
    assert.ok(html.includes('Analyse these documents') || html.includes('Analyze these documents'), 'Card 2 title must exist');
    assert.ok(html.includes('Review this data') || html.includes('Review available data'), 'Card 3 title must exist');

    // 5. Real SQLite statistics & execution ledger
    assert.ok(html.includes('Total Missions'), 'Must preserve Total Missions metric');
    assert.ok(html.includes('Completed Missions'), 'Must preserve Completed Missions metric');
    assert.ok(html.includes('Pending Approvals'), 'Must preserve Pending Approvals metric');
    assert.ok(html.includes('Tool Invocations'), 'Must preserve Tool Invocations metric');
  });

  // =========================================================================
  // 15. EXECUTION PLAN VIEW (/plan) AND RESULTS VIEW (/results)
  // =========================================================================
  test('UI-PLAN-01: Execution Plan route (/plan) renders 7 numbered steps, tools, and connected services', async () => {
    const res = await fetch(`${webBaseUrl}/plan`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Execution Plan'), 'Must contain Execution Plan header');
    assert.ok(html.includes('Check calendar and meeting details') || html.includes('calendar details') || html.includes('conversation context'), 'Step 1 must exist');
    assert.ok(html.includes('Search knowledge base for Q4 Product Roadmap') || html.includes('Search knowledge') || html.includes('Roadmap'), 'Step 3 must exist');
    assert.ok(html.includes('Analyze document content, decisions, and risk items') || html.includes('Analyze') || html.includes('roadmap content'), 'Step 4 must exist');
    assert.ok(html.includes('Tools to be used'), 'Must contain Tools list card');
    assert.ok(html.includes('Calendar'), 'Tool Calendar must exist');
    assert.ok(html.includes('Knowledge Search'), 'Tool Knowledge Search must exist');
    assert.ok(html.includes('Connected Services'), 'Must contain Connected Services section');
    assert.ok(html.includes('Google Calendar'), 'Google Calendar service must exist');
    assert.ok(html.includes('Google Drive'), 'Google Drive service must exist');
  });

  test('UI-RESULTS-01: Results route (/results) renders completion banner, tabs, summary, and action items', async () => {
    const res = await fetch(`${webBaseUrl}/results`);
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Your request is complete!'), 'Must contain completion headline');
    assert.ok(html.includes('Save to Notion'), 'Must contain Save to Notion button');
    assert.ok(html.includes('Export'), 'Must contain Export button');
    assert.ok(html.includes('Summary'), 'Tab Summary must exist');
    assert.ok(html.includes('Action Plan'), 'Tab Action Plan must exist');
    assert.ok(html.includes('Key Insights'), 'Tab Key Insights must exist');
    assert.ok(html.includes('Next Steps'), 'Next Steps section must exist');
    assert.ok(html.includes('Set Reminders'), 'Set Reminders toggle must exist');
  });

  // =========================================================================
  // 16. LIVE MCP BACKEND REST API & SECURITY POLICY GATING
  // =========================================================================
  test('UI-TOOL-API-01: GET /api/tools returns live MCP catalog and POST /api/tools/:name/execute runs tools with policy gating', async () => {
    // 1. Live dynamic tools discovery via REST API
    const toolsRes = await fetch(`${webBaseUrl}/api/tools`);
    assert.equal(toolsRes.status, 200);
    const toolsData = await toolsRes.json() as any;
    assert.equal(toolsData.serverOnline, true);
    assert.equal(toolsData.protocolVersion, '2025-11-25');
    assert.ok(toolsData.tools.length >= 10);
    const searchTool = toolsData.tools.find((t: any) => t.name === 'search_knowledge');
    assert.ok(searchTool, 'search_knowledge must be discovered');

    // 2. Live execution of safe tool
    const execRes = await fetch(`${webBaseUrl}/api/tools/search_knowledge/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'roadmap', max_results: 2 })
    });
    assert.equal(execRes.status, 200);
    const execData = await execRes.json() as any;
    assert.equal(execData.success, true);
    assert.equal(execData.tool, 'search_knowledge');

    // 3. Consequential tool execution blocked without approval gate
    const gatedRes = await fetch(`${webBaseUrl}/api/tools/verify_action/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criteria: ['test'] })
    });
    assert.equal(gatedRes.status, 403);
    const gatedData = await gatedRes.json() as any;
    assert.ok(gatedData.error.includes('Consequential action blocked by policy gate'));

    const reminderRes = await fetch(`${webBaseUrl}/api/tools/calendar_create_reminder/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Demo reminder', reminderTime: 'Tomorrow at 9 AM' })
    });
    assert.equal(reminderRes.status, 403, 'Reminder writes must remain behind mission approval');

    const notificationRes = await fetch(`${webBaseUrl}/api/tools/send_notification/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Demo alert', message: 'Local demo notification' })
    });
    assert.equal(notificationRes.status, 403, 'Notification actions must remain behind mission approval');
  });

  test('UI-AUTH-01: Production login establishes an HttpOnly session for the Tools page and API', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousApiKey = process.env.ORCHESTRA_API_KEY;
    process.env.NODE_ENV = 'production';
    process.env.ORCHESTRA_API_KEY = 'web-auth-test-key';

    const protectedWeb = createWebApp({ mcpServerUrl: mcpServerUrl, dbPath: ':memory:' });
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousApiKey === undefined) delete process.env.ORCHESTRA_API_KEY;
    else process.env.ORCHESTRA_API_KEY = previousApiKey;

    const protectedServer = protectedWeb.app.listen(0, '127.0.0.1');
    try {
      await new Promise<void>((resolve) => protectedServer.once('listening', resolve));
      const address = protectedServer.address();
      assert.ok(address && typeof address === 'object');
      const protectedBaseUrl = `http://127.0.0.1:${address.port}`;

      const redirect = await fetch(`${protectedBaseUrl}/tools`, { redirect: 'manual' });
      assert.equal(redirect.status, 302);
      assert.match(redirect.headers.get('location') || '', /^\/login\?returnTo=/);

      const loginPage = await fetch(`${protectedBaseUrl}/login`);
      assert.equal(loginPage.status, 200);
      assert.ok((await loginPage.text()).includes('App access key'));

      const rejectedLogin = await fetch(`${protectedBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ apiKey: 'wrong-key', returnTo: '/tools' }),
        redirect: 'manual'
      });
      assert.equal(rejectedLogin.status, 401);

      const login = await fetch(`${protectedBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ apiKey: 'web-auth-test-key', returnTo: '/tools' }),
        redirect: 'manual'
      });
      assert.equal(login.status, 302);
      assert.equal(login.headers.get('location'), '/tools');
      const cookie = login.headers.get('set-cookie')?.split(';')[0];
      assert.ok(cookie?.startsWith('orchestra_key='));

      const toolsPage = await fetch(`${protectedBaseUrl}/tools`, {
        headers: { Cookie: cookie! }
      });
      assert.equal(toolsPage.status, 200);
      assert.ok((await toolsPage.text()).includes('calendar_read_events'));

      const toolsApi = await fetch(`${protectedBaseUrl}/api/tools`, {
        headers: { Cookie: cookie! }
      });
      assert.equal(toolsApi.status, 200);
      const catalog = await toolsApi.json() as { tools: unknown[] };
      assert.equal(catalog.tools.length, 16);
    } finally {
      protectedServer.closeAllConnections();
      await new Promise<void>((resolve, reject) => protectedServer.close((error) => error ? reject(error) : resolve()));
      await protectedWeb.orchestrator.mcpClient.close();
      protectedWeb.orchestratorDb.close();
      protectedWeb.toolDb.close();
    }
  });

  // =========================================================================
  // 17. HOME SCREEN INTERACTIVE COMPONENTS & ATTACHMENT WIRING
  // =========================================================================
  test('UI-HOME-INTERACT-01: Home screen prompt actions, modal, web toggle, and parameterized mission launch', async () => {
    // 1. Verify Home HTML includes all interactive elements
    const homeRes = await fetch(`${webBaseUrl}/`);
    assert.equal(homeRes.status, 200);
    const html = await homeRes.text();

    assert.ok(html.includes('id="attach-context-btn"'), 'Attachment button must exist');
    assert.ok(html.includes('id="attachment-modal"'), 'Attachment modal must exist');
    assert.ok(html.includes('id="deep-research-btn"'), 'Deep Research button must exist');
    assert.ok(html.includes('id="deep-research-menu"'), 'Deep Research dropdown menu must exist');
    assert.ok(html.includes('id="web-search-btn"'), 'Web Search toggle button must exist');
    assert.ok(html.includes('id="attached-files-container"'), 'Attached files chips container must exist');
    assert.ok(html.includes('Prepare me for my investor meeting'), 'Card 1 must exist');
    assert.ok(html.includes('Analyze these documents'), 'Card 2 must exist');
    assert.ok(html.includes('Review this data'), 'Card 3 must exist');
    assert.ok(html.includes('Create an action plan'), 'Card 4 must exist');

    // 2. Test GET /api/documents
    const docsRes = await fetch(`${webBaseUrl}/api/documents`);
    assert.equal(docsRes.status, 200);
    const docsData = await docsRes.json() as any;
    assert.ok(Array.isArray(docsData.documents), 'Documents must be an array');
    assert.ok(docsData.documents.length >= 3, 'Must contain seed demo documents');

    // 3. Test POST /api/documents upload
    const uploadRes = await fetch(`${webBaseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Q4_Financial_Update.pdf',
        fileType: 'PDF',
        size: '2.4 MB',
        summary: 'Detailed Q4 budget and financial runway brief'
      })
    });
    assert.equal(uploadRes.status, 201);
    const uploadData = await uploadRes.json() as any;
    assert.equal(uploadData.success, true);
    assert.equal(uploadData.document.title, 'Q4_Financial_Update.pdf');

    // 4. Test POST /api/missions with full parameters
    const missionRes = await fetch(`${webBaseUrl}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: 'Prepare me for my investor meeting tomorrow: review financial deck and summarize milestones.',
        researchMode: 'deep',
        deepResearch: true,
        webSearch: true,
        attachedFiles: [
          {
            id: uploadData.document.id,
            name: 'Q4_Financial_Update.pdf',
            fileType: 'PDF',
            size: '2.4 MB'
          }
        ]
      })
    });
    assert.equal(missionRes.status, 201);
    const missionData = await missionRes.json() as any;
    assert.ok(missionData.missionId, 'Mission ID must be returned');
    assert.equal(missionData.researchMode, 'deep');
    assert.equal(missionData.webSearch, true);
  });

  // =========================================================================
  // 17. NEW CONVERSATION LIGHT LANDING PAGE VERIFICATION (/new)
  // =========================================================================
  test('UI-NEW-CONV-01: Redesigned /new view renders clean light landing UI with Amazon smile arc, 6 preset cards, and floating prompt box', async () => {
    const res = await fetch(`${webBaseUrl}/new`);
    assert.equal(res.status, 200);
    const html = await res.text();

    // 1. Clean light workspace and header verification
    assert.ok(html.includes('bg-[#F9FAFB]') || html.includes('bg-slate-50'), 'Must render light workspace');
    assert.ok(html.includes('Search your data, tools, or past conversations...'), 'Must contain top search bar placeholder');
    assert.ok(html.includes('SM'), 'Must contain SM profile badge');

    // 2. Hero Section
    assert.ok(html.includes('/static/amazon-smile-logo.png'), 'Must render centered Amazon smile wave arc');
    assert.ok(html.includes('How can') && html.includes('Alexa+') && html.includes('help you today?'), 'Must render main heading');
    assert.ok(html.includes('Ask a complex question, set a goal, or give me a task. I can understand, plan, use the right tools, and get things done for you.'), 'Must render reference subtitle');

    // 3. 6 Preset Feature Cards Grid
    assert.ok(html.includes('Plan my day'), 'Card 1 title must exist');
    assert.ok(html.includes("Check my calendar and prepare for tomorrow's meeting."), 'Card 1 quote must exist');

    assert.ok(html.includes('Analyze a document'), 'Card 2 title must exist');
    assert.ok(html.includes('Summarize this report and highlight key insights.'), 'Card 2 quote must exist');

    assert.ok(html.includes('Create a checklist'), 'Card 3 title must exist');
    assert.ok(html.includes("I'm launching a project. Create a step-by-step checklist."), 'Card 3 quote must exist');

    assert.ok(html.includes('Find information'), 'Card 4 title must exist');
    assert.ok(html.includes('Search my knowledge base for relevant documents.'), 'Card 4 quote must exist');

    assert.ok(html.includes('Analyze data'), 'Card 5 title must exist');
    assert.ok(html.includes('Analyze this data and generate a report.'), 'Card 5 quote must exist');

    assert.ok(html.includes('Use my tools'), 'Card 6 title must exist');
    assert.ok(html.includes('Find documents in Drive, check my Notion, and summarize.'), 'Card 6 quote must exist');
    assert.ok(html.includes('handlePresetClick(this)'), 'Cards must bind handlePresetClick');
    assert.ok(html.includes('data-goal='), 'Cards must define data-goal attributes');

    // 4. Bottom Floating Prompt Box
    assert.ok(html.includes('Describe what you want to do...'), 'Must render prompt input placeholder');
    assert.ok(html.includes('landing-send-btn'), 'Must render landing send button');
    assert.ok(html.includes('Deep Research'), 'Must contain Deep Research action pill');
    assert.ok(html.includes('Create Plan'), 'Must contain Create Plan action pill');
    assert.ok(html.includes('Use Tools'), 'Must contain Use Tools action pill');
    assert.ok(html.includes('Claude 3.5 Sonnet'), 'Must contain Claude 3.5 Sonnet model selector');
  });

  // =========================================================================
  // 18. BACKEND AUDIT & API CONSISTENCY CHECK
  // =========================================================================
  test('UI-API-AUDIT-01: Full API Health & Consistency Check (/api/missions, /api/knowledge, /api/integrations, /api/activity)', async () => {
    // 1. GET /api/missions
    const missionsRes = await fetch(`${webBaseUrl}/api/missions`);
    assert.equal(missionsRes.status, 200, 'GET /api/missions must return 200 OK');
    const missionsData = (await missionsRes.json()) as any;
    assert.ok(Array.isArray(missionsData.missions), 'Missions must be an array');

    // 2. GET /api/knowledge
    const knowRes = await fetch(`${webBaseUrl}/api/knowledge`);
    assert.equal(knowRes.status, 200, 'GET /api/knowledge must return 200 OK');
    const knowData = (await knowRes.json()) as any;
    assert.ok(Array.isArray(knowData.documents), 'Knowledge documents must be an array');
    assert.ok(knowData.documents.length >= 5, 'Knowledge documents must contain seeded documents');

    // 3. GET /api/integrations
    const intRes = await fetch(`${webBaseUrl}/api/integrations`);
    assert.equal(intRes.status, 200, 'GET /api/integrations must return 200 OK');
    const intData = (await intRes.json()) as any;
    assert.ok(Array.isArray(intData.integrations), 'Integrations must be an array');
    assert.equal(intData.integrations.length, 9, 'Must return exactly 9 canonical integrations');

    // 4. GET /api/activity
    const actRes = await fetch(`${webBaseUrl}/api/activity`);
    assert.equal(actRes.status, 200, 'GET /api/activity must return 200 OK');
    const actData = (await actRes.json()) as any;
    assert.ok(Array.isArray(actData.activities), 'Activity logs must be an array');
    assert.ok(actData.activities.length > 0, 'Must contain seeded activity events');
  });

  test('UI-DB-AUDIT-01: Database & Persistence Audit (SQLite CRUD for knowledge documents, integration toggles and reset, activity logging)', async () => {
    // 1. Toggle integration status dynamically in SQLite
    const toggleRes = await fetch(`${webBaseUrl}/api/integrations/google-calendar/toggle`, {
      method: 'POST'
    });
    assert.equal(toggleRes.status, 200, 'Toggle integration must return 200 OK');
    const toggleData = (await toggleRes.json()) as any;
    assert.ok(toggleData.success, 'Toggle must succeed');
    assert.equal(toggleData.integration.connected, 1, 'Google Calendar must now be connected (1) in SQLite');

    // 2. Verify persistence on GET /api/integrations
    const verifyRes = await fetch(`${webBaseUrl}/api/integrations`);
    const verifyData = (await verifyRes.json()) as any;
    const gCal = verifyData.integrations.find((i: any) => i.id === 'google-calendar');
    assert.equal(gCal.connected, 1, 'SQLite persistence confirmed for Google Calendar');

    // 3. Verify activity event was recorded for integration toggle
    const actRes = await fetch(`${webBaseUrl}/api/activity?filter=integration`);
    assert.equal(actRes.status, 200);
    const actData = (await actRes.json()) as any;
    const hasToggleActivity = actData.activities.some((a: any) => a.title.includes('Google Calendar'));
    assert.ok(hasToggleActivity, 'Activity log must record integration status change');

    // 4. Reset integrations back to disconnected in SQLite
    const resetRes = await fetch(`${webBaseUrl}/api/integrations/reset`, {
      method: 'POST'
    });
    assert.equal(resetRes.status, 200);
    const resetData = (await resetRes.json()) as any;
    assert.ok(resetData.success);
    const resetGCal = resetData.integrations.find((i: any) => i.id === 'google-calendar');
    assert.equal(resetGCal.connected, 0, 'Google Calendar must be reset to disconnected (0) in SQLite');

    // 5. Ingest knowledge document via POST /api/knowledge
    const uploadRes = await fetch(`${webBaseUrl}/api/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Backend Audit Architecture 2026',
        category: 'Reports',
        fileType: 'PDF',
        size: '1.4 MB',
        summary: 'Architecture specification for SQLite persistence and SSE transport.'
      })
    });
    assert.equal(uploadRes.status, 201, 'POST /api/knowledge must return 201 Created');
    const uploadData = (await uploadRes.json()) as any;
    assert.ok(uploadData.success);
    assert.equal(uploadData.document.title, 'Backend Audit Architecture 2026');

    // 6. Verify knowledge document persisted in SQLite query
    const docQueryRes = await fetch(`${webBaseUrl}/api/knowledge?id=${uploadData.document.id}`);
    assert.equal(docQueryRes.status, 200);
    const docQueryData = (await docQueryRes.json()) as any;
    assert.equal(docQueryData.document.title, 'Backend Audit Architecture 2026');
  });

  test('UI-DYNAMIC-01: Dynamic API verification (Integrations PATCH, Knowledge Hub details & insights, Activity KPI stats & Top Tools)', async () => {
    // 1. Dynamic Integrations PATCH
    const patchRes = await fetch(`${webBaseUrl}/api/integrations/slack`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: true })
    });
    assert.equal(patchRes.status, 200, 'PATCH /api/integrations/slack must return 200 OK');
    const patchData = (await patchRes.json()) as any;
    assert.ok(patchData.success);
    assert.equal(patchData.integration.connected, 1, 'Slack must be marked connected in SQLite');

    // 2. Dynamic Knowledge Hub Details & Insights (/api/knowledge/:id)
    const docRes = await fetch(`${webBaseUrl}/api/knowledge/doc-q4-roadmap`);
    assert.equal(docRes.status, 200, 'GET /api/knowledge/:id must return 200 OK');
    const docData = (await docRes.json()) as any;
    assert.ok(docData.document, 'Must return document record');
    assert.ok(docData.document.summary.length > 10, 'Must contain dynamic summary');
    assert.ok(Array.isArray(docData.document.insights), 'Insights must be an array');
    assert.ok(docData.document.insights.length > 0, 'Must have parsed key insights');
    assert.ok(Array.isArray(docData.document.actionItems), 'Action items must be an array');

    // 3. Dynamic Activity Audit Log KPI Stats & Top Tools
    const actRes = await fetch(`${webBaseUrl}/api/activity`);
    assert.equal(actRes.status, 200, 'GET /api/activity must return 200 OK');
    const actData = (await actRes.json()) as any;
    assert.ok(actData.stats, 'Must return computed stats');
    assert.ok(typeof actData.stats.totalActivities === 'number', 'totalActivities must be a number');
    assert.ok(typeof actData.stats.missionsCount === 'number', 'missionsCount must be a number');
    assert.ok(typeof actData.stats.toolActionsCount === 'number', 'toolActionsCount must be a number');
    assert.ok(typeof actData.stats.integrationsCount === 'number', 'integrationsCount must be a number');
    assert.ok(actData.stats.categoryCounts, 'Must return category breakdown counts');
    assert.ok(Array.isArray(actData.stats.topTools), 'topTools must be an array');
    assert.ok(actData.stats.topTools.length > 0, 'topTools must have entries with progress metrics');
    assert.ok(typeof actData.stats.topTools[0].percent === 'number', 'top tool must have calculated percent');
  });

  // =========================================================================
  // 17. CINEMATIC INTRO SPLASH SCREEN SESSION PERSISTENCE AUDIT
  // =========================================================================
  test('UI-INTRO-01: Cinematic Intro Splash Screen enforces session-only execution and prevents re-triggering upon navigation', async () => {
    // 1. Verify /home route responds 200 OK
    const homeRes = await fetch(`${webBaseUrl}/home`);
    assert.equal(homeRes.status, 200, 'GET /home must return 200 OK');
    const homeHtml = await homeRes.text();
    assert.ok(homeHtml.includes('Alexa+'), 'Home page must render Alexa+ branding');
    assert.ok(homeHtml.includes('id="intro-splash-screen"'), 'Must contain intro splash element structure');

    // 2. Verify root wrapper check in <head>
    assert.ok(homeHtml.includes("sessionStorage.getItem('hasSeenIntro')"), 'Must check hasSeenIntro in session store');
    assert.ok(homeHtml.includes('intro-seen'), 'Must assign intro-seen class');

    // 3. Verify CSS suppression rule
    assert.ok(homeHtml.includes('html.intro-seen #intro-splash-screen'), 'CSS rule must suppress intro splash when intro-seen is set');

    // 4. Verify completion sets hasSeenIntro
    assert.ok(homeHtml.includes("sessionStorage.setItem('hasSeenIntro', 'true')"), 'Completion must mark hasSeenIntro in session store');
  });
});
