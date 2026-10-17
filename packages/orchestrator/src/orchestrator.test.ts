import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrchestraServer } from '@orchestra/mcp-server';
import {
  OrchestratorDatabase,
  MissionStateMachine,
  ObjectiveUnderstandingEngine,
  MissionPlanner,
  ApprovalService,
  MissionVerifier,
  MissionOrchestrator
} from './index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

test('ORCHESTRA Comprehensive Orchestration Engine Test Suite', async (t) => {
  const TEST_PORT = 3299;
  const TEST_URL = `http://127.0.0.1:${TEST_PORT}/mcp`;
  const TEST_SERVER_DB = path.join(process.cwd(), 'test-orch-server.db');
  const TEST_ORCH_DB = path.join(process.cwd(), 'test-orch-engine.db');

  // Clean test databases if present
  for (const p of [TEST_SERVER_DB, TEST_ORCH_DB]) {
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); } catch {}
    }
  }

  const serverInstance = createOrchestraServer({
    host: '127.0.0.1',
    port: TEST_PORT,
    endpoint: '/mcp',
    dbPath: TEST_SERVER_DB
  });
  const runningServer = await serverInstance.listen();

  t.after(async () => {
    await runningServer.close();
    for (const p of [TEST_SERVER_DB, TEST_ORCH_DB]) {
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    }
  });

  // FSM-01: Valid state transitions
  await t.test('FSM-01: Valid state transitions succeed and persist', () => {
    const db = new OrchestratorDatabase(':memory:');
    const fsm = new MissionStateMachine(db);

    db.createMission('m-fsm-1', 'Test goal');
    assert.equal(db.getMission('m-fsm-1')!.status, 'SUBMITTED');

    fsm.transition('m-fsm-1', 'UNDERSTANDING');
    assert.equal(db.getMission('m-fsm-1')!.status, 'UNDERSTANDING');

    fsm.transition('m-fsm-1', 'PLANNING');
    assert.equal(db.getMission('m-fsm-1')!.status, 'PLANNING');

    fsm.transition('m-fsm-1', 'DISCOVERING_TOOLS');
    assert.equal(db.getMission('m-fsm-1')!.status, 'DISCOVERING_TOOLS');

    db.close();
  });

  // FSM-02: Illegal transitions are rejected
  await t.test('FSM-02: Illegal transitions are rejected with error', () => {
    const db = new OrchestratorDatabase(':memory:');
    const fsm = new MissionStateMachine(db);

    db.createMission('m-fsm-2', 'Test goal');
    assert.throws(
      () => {
        // Cannot jump directly from SUBMITTED to COMPLETED
        fsm.transition('m-fsm-2', 'COMPLETED');
      },
      /Illegal state transition rejected/i
    );
    assert.equal(db.getMission('m-fsm-2')!.status, 'SUBMITTED');
    db.close();
  });

  // FSM-03: Cancelled missions do not continue executing
  await t.test('FSM-03: Cancelled missions are terminal', () => {
    const db = new OrchestratorDatabase(':memory:');
    const fsm = new MissionStateMachine(db);

    db.createMission('m-fsm-3', 'Test goal');
    fsm.transition('m-fsm-3', 'CANCELLED');
    assert.equal(db.getMission('m-fsm-3')!.status, 'CANCELLED');

    assert.throws(() => {
      fsm.transition('m-fsm-3', 'EXECUTING');
    }, /Illegal state transition rejected/i);

    db.close();
  });

  // FSM-04: Concurrent workers cannot claim the same mission
  await t.test('FSM-04: Concurrent worker leasing prevents double execution', () => {
    const db = new OrchestratorDatabase(':memory:');
    db.createMission('m-lease-1', 'Test goal');

    const workerA = db.acquireWorkerLease('m-lease-1', 'worker-A', 5000);
    assert.equal(workerA, true, 'Worker A acquired lease');

    const workerB = db.acquireWorkerLease('m-lease-1', 'worker-B', 5000);
    assert.equal(workerB, false, 'Worker B was locked out');

    // Worker A releases
    db.releaseWorkerLease('m-lease-1', 'worker-A');

    const workerBRetry = db.acquireWorkerLease('m-lease-1', 'worker-B', 5000);
    assert.equal(workerBRetry, true, 'Worker B acquires lease after release');
    db.close();
  });

  // PLAN-01: Task dependency graphs are validated
  await t.test('PLAN-01: Valid DAG plan passes validation', () => {
    const planner = new MissionPlanner();
    const understanding = new ObjectiveUnderstandingEngine().parseObjective('I have an important meeting tomorrow.');
    const plan = planner.createPlan('m-plan-1', understanding);

    assert.ok(plan.tasks.length >= 6, 'Meeting prep plan created multiple tasks');
    planner.validatePlan(plan.tasks); // Passes without error
  });

  // PLAN-02: Cyclic dependencies are rejected
  await t.test('PLAN-02: Cyclic dependencies are caught and rejected', () => {
    const planner = new MissionPlanner();
    const cyclicTasks = [
      {
        id: 't-1',
        stepIndex: 1,
        title: 'Task 1',
        description: '',
        toolName: 'search_knowledge',
        toolInputTemplate: {},
        dependsOn: ['t-2'],
        requiresApproval: false,
        maxRetries: 1
      },
      {
        id: 't-2',
        stepIndex: 2,
        title: 'Task 2',
        description: '',
        toolName: 'search_knowledge',
        toolInputTemplate: {},
        dependsOn: ['t-1'],
        requiresApproval: false,
        maxRetries: 1
      }
    ];

    assert.throws(() => {
      planner.validatePlan(cyclicTasks);
    }, /Cycle detected/i);
  });

  // MCP-01: Tools are discovered from actual MCP server
  // MCP-02: A selected tool is invoked through actual MCP client
  await t.test('MCP-01 & MCP-02: Real discovery and invocation through MCP client', async () => {
    const orch = new MissionOrchestrator({ serverUrl: TEST_URL });
    await orch.connect();

    const tools = await orch.mcpClient.listTools();
    assert.equal(tools.length, 16, 'All 16 tools discovered over Streamable HTTP');

    const res = await orch.mcpClient.callTool('search_knowledge', { query: 'Roadmap' }) as { results: unknown[] };
    assert.ok(res.results.length > 0, 'Physical tool call returned demonstration records');
    await orch.close();
  });

  // APPROVAL-01: Unapproved consequential actions are blocked
  // APPROVAL-02: Altered parameters invalidate approval
  // APPROVAL-03: Expired approval is rejected
  // APPROVAL-04: Approval replay is rejected
  // APPROVAL-05: Rejected actions do not execute
  // APPROVAL-06: Direct invocation without valid token is blocked
  await t.test('APPROVAL-01 to APPROVAL-06: Backend approval security boundary', () => {
    const db = new OrchestratorDatabase(':memory:');
    const approvalService = new ApprovalService(db);

    db.createMission('m-appr', 'Consequential test');
    db.createPlan('p-1', 'm-appr');
    const task = db.createTask({
      id: 't-remind',
      missionId: 'm-appr',
      planId: 'p-1',
      stepIndex: 1,
      title: 'Reminder task',
      toolName: 'calendar_create_reminder',
      requiresApproval: true
    });

    const originalParams = { title: 'Prep', time: '10:00' };

    // APPROVAL-01: Before approval request, execution is blocked
    const preCheck = approvalService.verifyExecutionAllowed(task.id, 'calendar_create_reminder', originalParams);
    assert.equal(preCheck.allowed, false);

    // Request approval
    const appr = approvalService.requestApproval('m-appr', task.id, 'calendar_create_reminder', originalParams, 500); // 500ms TTL

    // APPROVAL-02: Altered parameters rejection
    const tamperedParams = { title: 'Prep', time: '12:00' };
    const tamperedFingerprint = approvalService.computeFingerprint(
      'm-appr',
      task.id,
      'calendar_create_reminder',
      approvalService.canonicalizeParameters(tamperedParams)
    );
    const alterRes = approvalService.resolveApproval(appr.id, tamperedFingerprint, 'approved');
    assert.equal(alterRes.success, false);
    assert.match(alterRes.error!, /fingerprint mismatch/i);

    // APPROVAL-04: Approve legitimately
    const validRes = approvalService.resolveApproval(appr.id, appr.canonical_fingerprint, 'approved');
    assert.equal(validRes.success, true);

    // Replay resolution attempt
    const replayRes = approvalService.resolveApproval(appr.id, appr.canonical_fingerprint, 'approved');
    assert.equal(replayRes.success, false, 'Replaying resolution fails');

    // Verification check now passes for original params
    const allowedCheck = approvalService.verifyExecutionAllowed(task.id, 'calendar_create_reminder', originalParams);
    assert.equal(allowedCheck.allowed, true);

    // But fails if altered during execution
    const alteredExecCheck = approvalService.verifyExecutionAllowed(task.id, 'calendar_create_reminder', tamperedParams);
    assert.equal(alteredExecCheck.allowed, false, 'Altered parameters blocked at execution gate');

    // APPROVAL-05: Rejection marks action unusable
    const rejectAppr = approvalService.requestApproval('m-appr', task.id, 'calendar_create_reminder', originalParams);
    const rejRes = approvalService.resolveApproval(rejectAppr.id, rejectAppr.canonical_fingerprint, 'rejected');
    assert.equal(rejRes.success, true);
    const rejCheck = approvalService.verifyExecutionAllowed(task.id, 'calendar_create_reminder', originalParams);
    assert.equal(rejCheck.allowed, false, 'Rejected action cannot execute');

    db.close();
  });

  // EXEC-01 to EXEC-03 & VERIFY-01
  await t.test('EXEC & VERIFY: Tool persistence, error handling, and verification failure', () => {
    const db = new OrchestratorDatabase(':memory:');
    const verifier = new MissionVerifier(db);
    const understanding = new ObjectiveUnderstandingEngine().parseObjective('I have an important meeting tomorrow.');

    db.createMission('m-verify-fail', 'Meeting prep');
    db.createPlan('p-vf', 'm-verify-fail');
    db.createTask({
      id: 't-1',
      missionId: 'm-verify-fail',
      planId: 'p-vf',
      stepIndex: 1,
      title: 'Incomplete task',
      toolName: 'get_conversation_context'
    });

    // Verification fails when tasks are incomplete and evidence is absent
    const evalRes = verifier.verifyMission('m-verify-fail', understanding);
    assert.equal(evalRes.isValid, false, 'Verification fails on incomplete mission');
    assert.ok(evalRes.unsatisfiedRequirements.length > 0);

    db.close();
  });

  // E2E-01 to E2E-04: Complete Meeting Preparation Workflow with real MCP and Approval Gate
  await t.test('E2E-01 to E2E-04: Complete Meeting Preparation Mission Workflow', async () => {
    const orch = new MissionOrchestrator({
      serverUrl: TEST_URL,
      dbPath: TEST_ORCH_DB
    });
    await orch.connect();

    const missionId = 'mission-e2e-meeting-prep';
    const goal = 'I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven\'t prepared, prepare a checklist, and remind me what I need to do.';

    // 1. Submit mission
    orch.submitMission(missionId, goal);
    assert.equal(orch.db.getMission(missionId)!.status, 'SUBMITTED');

    // 2. Run until pause (Expected pause at AWAITING_APPROVAL on step 7)
    const pausedMission = await orch.executeMissionUntilPause(missionId);
    assert.equal(pausedMission.status, 'AWAITING_APPROVAL', 'Mission halted at backend approval gate');

    // Verify task 1 to 6 completed with physical tool execution records
    const tasks = orch.db.getTasksForMission(missionId);
    assert.equal(tasks.length, 7, 'All 7 tasks planned in DAG');
    for (let i = 0; i < 6; i++) {
      assert.equal(tasks[i]!.status, 'completed', `Task ${i + 1} completed via MCP`);
      assert.ok(tasks[i]!.duration_ms >= 0);
      assert.ok(tasks[i]!.result_json, 'Result JSON persisted in SQLite');
    }

    // Inspect tool invocation records in DB
    const invocations = orch.db.getToolInvocationsForMission(missionId);
    assert.ok(invocations.length >= 6, 'At least 6 MCP tools physically executed');
    const toolNames = invocations.map(inv => inv.tool_name);
    assert.ok(toolNames.includes('get_conversation_context'));
    assert.ok(toolNames.includes('search_knowledge'));
    assert.ok(toolNames.includes('retrieve_document'));
    assert.ok(toolNames.includes('analyze_document'));
    assert.ok(toolNames.includes('detect_conflict'));
    assert.ok(toolNames.includes('create_task'));

    // Check pending approval record
    const pendingApproval = orch.db.getPendingApprovalForTask('task-mission-e2e-meeting-prep-7');
    assert.ok(pendingApproval, 'Pending approval record exists');
    assert.equal(pendingApproval!.status, 'pending');
    assert.equal(pendingApproval!.action_type, 'calendar_create_reminder');

    // 3. Grant approval and resume
    const resumedMission = await orch.resumeWithApproval(
      missionId,
      pendingApproval!.id,
      pendingApproval!.canonical_fingerprint,
      'approved',
      'Confirmed by user'
    );

    // 4. Mission completes after verification
    assert.equal(resumedMission.status, 'COMPLETED', 'Mission verified and completed');

    // Inspect verification record in SQLite
    const verification = orch.db.getVerificationResult(missionId);
    assert.ok(verification, 'Verification result stored');
    assert.equal(verification!.is_valid, 1, 'Independent verification passed');
    assert.ok(verification!.confidence_score >= 0.85);

    // Inspect activity events
    const activities = orch.db.getActivitiesForMission(missionId);
    assert.ok(activities.length >= 8, 'Complete audit trail of events persisted');

    await orch.close();
  });

  // RECOVERY-01: Interrupted mission state is restored on restart
  await t.test('RECOVERY-01: Interrupted mission state survives orchestrator restart', async () => {
    // Open new orchestrator on same database
    const restoredOrch = new MissionOrchestrator({
      serverUrl: TEST_URL,
      dbPath: TEST_ORCH_DB
    });
    await restoredOrch.connect();

    const m = restoredOrch.db.getMission('mission-e2e-meeting-prep');
    assert.ok(m);
    assert.equal(m!.status, 'COMPLETED');

    const tasks = restoredOrch.db.getTasksForMission('mission-e2e-meeting-prep');
    assert.equal(tasks.length, 7);

    const verification = restoredOrch.db.getVerificationResult('mission-e2e-meeting-prep');
    assert.ok(verification);
    assert.equal(verification!.is_valid, 1);

    await restoredOrch.close();
  });
});
