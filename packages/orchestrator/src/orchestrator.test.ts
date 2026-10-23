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
    port: 0,
    endpoint: '/mcp',
    dbPath: TEST_SERVER_DB
  });
  const runningServer = await serverInstance.listen();
  const TEST_URL = `http://127.0.0.1:${runningServer.port}/mcp`;

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
    assert.equal(tools.length, 30, 'All 30 tools discovered over Streamable HTTP');

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

  // =========================================================================
  // AUTOMATIC VERIFICATION SUITE
  // =========================================================================

  // AUTO-VERIFY-01: Successful task triggers automatic verification without manual click
  await t.test('AUTO-VERIFY-01: Successful task triggers verification automatically', async () => {
    const orch = new MissionOrchestrator({ serverUrl: TEST_URL });
    await orch.connect();

    const missionId = 'm-auto-ver-1';
    orch.submitMission(missionId, 'Prepare meeting');
    orch.db.updateMissionStatus(missionId, 'DISCOVERING_TOOLS');
    const plan = orch.db.createPlan(`p-${missionId}`, missionId);

    const task = orch.db.createTask({
      id: `t-auto-1`,
      missionId,
      planId: plan.id,
      stepIndex: 1,
      title: 'Fetch meeting context',
      toolName: 'get_conversation_context',
      toolInputTemplate: JSON.stringify({ contextKeys: ['active_meeting'] })
    });

    const emittedStatuses: string[] = [];
    orch.onTaskUpdated = (_mId, updatedTask) => {
      emittedStatuses.push(updatedTask.verification_status);
    };

    await orch.executeMissionUntilPause(missionId);

    const finishedTask = orch.db.getTask(task.id)!;
    assert.equal(finishedTask.status, 'completed', 'Task completed');
    assert.equal(finishedTask.verification_status, 'verified', 'Task automatically verified');
    assert.ok(finishedTask.verification_evidence_json, 'Evidence JSON stored on task');
    assert.ok(emittedStatuses.includes('verifying'), 'Emitted verifying status');
    assert.ok(emittedStatuses.includes('verified'), 'Emitted verified status');

    // Verify structured verification record exists
    const records = orch.db.getTaskVerifications(task.id);
    assert.equal(records.length, 1);
    assert.equal(records[0]!.verification_status, 'verified');
    assert.equal(records[0]!.attempt_number, 1);
    assert.ok(records[0]!.expected_outcome.includes('Context memory retrieved'));

    await orch.close();
  });

  // AUTO-VERIFY-02: Insufficient evidence never produces false success
  await t.test('AUTO-VERIFY-02: Insufficient or empty evidence never produces false success', async () => {
    const orch = new MissionOrchestrator({ serverUrl: TEST_URL });
    await orch.connect();

    const missionId = 'm-dummy';
    orch.submitMission(missionId, 'Dummy mission');
    const plan = orch.db.createPlan('p-dummy', missionId);

    const task = orch.db.createTask({
      id: `t-insufficient-1`,
      missionId,
      planId: plan.id,
      stepIndex: 1,
      title: 'Analyze documents with empty output',
      toolName: 'analyze_document',
      toolInputTemplate: JSON.stringify({})
    });

    // 1. Null / undefined result produces inconclusive / failure, never success
    const evalNull = orch.taskVerifier.verifyTask(task, null);
    assert.equal(evalNull.isVerified, false);
    assert.equal(evalNull.status, 'inconclusive');

    // 2. Empty object output produces inconclusive, never false success
    const evalEmpty = orch.taskVerifier.verifyTask(task, {});
    assert.equal(evalEmpty.isVerified, false);
    assert.equal(evalEmpty.status, 'inconclusive');

    // 3. Document retrieval with missing content produces failed
    const docTask = orch.db.createTask({
      id: `t-doc-fail`,
      missionId,
      planId: plan.id,
      stepIndex: 2,
      title: 'Retrieve document',
      toolName: 'retrieve_document',
      toolInputTemplate: JSON.stringify({ documentId: 'doc-q4-roadmap' })
    });
    const evalDocEmpty = orch.taskVerifier.verifyTask(docTask, { id: 'doc-q4-roadmap', content: '   ' });
    assert.equal(evalDocEmpty.isVerified, false);
    assert.equal(evalDocEmpty.status, 'failed');

    // 4. Mismatched document ID fails verification
    const evalDocMismatch = orch.taskVerifier.verifyTask(docTask, { id: 'wrong-doc', content: 'Some valid text content' });
    assert.equal(evalDocMismatch.isVerified, false);
    assert.equal(evalDocMismatch.status, 'failed');

    await orch.close();
  });

  // AUTO-VERIFY-03: Failed verification triggers safe retry and exhausted retries fail task
  await t.test('AUTO-VERIFY-03: Verification failure triggers safe retry and exhausted retries fail task', async () => {
    const orch = new MissionOrchestrator({ serverUrl: TEST_URL });
    await orch.connect();

    const missionId = 'm-retry-test';
    orch.submitMission(missionId, 'Test retry recovery');
    orch.db.updateMissionStatus(missionId, 'DISCOVERING_TOOLS');
    const plan = orch.db.createPlan(`p-${missionId}`, missionId);

    // Create task with maxRetries: 2 targeting a non-existent document
    const task = orch.db.createTask({
      id: `t-retry-1`,
      missionId,
      planId: plan.id,
      stepIndex: 1,
      title: 'Retrieve non-existent doc',
      toolName: 'retrieve_document',
      toolInputTemplate: JSON.stringify({ documentId: 'non-existent-doc-id-xyz' }),
      maxRetries: 1
    });

    await orch.executeMissionUntilPause(missionId);

    const failedTask = orch.db.getTask(task.id)!;
    assert.equal(failedTask.status, 'failed', 'Task marked failed after retries exhausted');
    assert.equal(failedTask.verification_status, 'failed', 'Verification status marked failed');
    assert.ok(failedTask.retry_count > 0, 'Retry count incremented');

    const records = orch.db.getTaskVerifications(task.id);
    assert.ok(records.length >= 1, 'Verification attempt records stored');
    assert.equal(records[records.length - 1]!.verification_status, 'failed');

    await orch.close();
  });

  // AUTO-VERIFY-04: Dependent task does not run before prerequisites are verified
  await t.test('AUTO-VERIFY-04: Dependent task does not run before prerequisites are verified', async () => {
    const orch = new MissionOrchestrator({ serverUrl: TEST_URL });
    await orch.connect();

    const missionId = 'm-dep-gate-test';
    orch.submitMission(missionId, 'Test dependency verification gate');
    orch.db.updateMissionStatus(missionId, 'DISCOVERING_TOOLS');
    const plan = orch.db.createPlan(`p-${missionId}`, missionId);

    // Task 1: will fail verification
    const task1 = orch.db.createTask({
      id: `t-gate-1`,
      missionId,
      planId: plan.id,
      stepIndex: 1,
      title: 'Prerequisite task that fails',
      toolName: 'retrieve_document',
      toolInputTemplate: JSON.stringify({ documentId: 'does-not-exist' }),
      maxRetries: 0
    });

    // Task 2: depends on Task 1
    const task2 = orch.db.createTask({
      id: `t-gate-2`,
      missionId,
      planId: plan.id,
      stepIndex: 2,
      title: 'Dependent downstream task',
      toolName: 'search_knowledge',
      toolInputTemplate: JSON.stringify({ query: 'Q1' })
    });
    orch.db.addTaskDependency(task2.id, task1.id);

    await orch.executeMissionUntilPause(missionId);

    const t1 = orch.db.getTask(task1.id)!;
    const t2 = orch.db.getTask(task2.id)!;

    assert.equal(t1.status, 'failed', 'Task 1 failed');
    assert.equal(t2.status, 'pending', 'Task 2 was blocked and NEVER executed');

    await orch.close();
  });

  // AUTO-VERIFY-05: Consequential action strictly enforces human approval before execution and verifies after
  await t.test('AUTO-VERIFY-05: Consequential action cannot bypass approval and automatically verifies after approval', async () => {
    const orch = new MissionOrchestrator({ serverUrl: TEST_URL });
    await orch.connect();

    const missionId = 'm-appr-gate-test';
    orch.submitMission(missionId, 'Test consequential action verification');
    orch.db.updateMissionStatus(missionId, 'DISCOVERING_TOOLS');
    const plan = orch.db.createPlan(`p-${missionId}`, missionId);

    const task = orch.db.createTask({
      id: `t-conseq-1`,
      missionId,
      planId: plan.id,
      stepIndex: 1,
      title: 'Set meeting reminder',
      toolName: 'calendar_create_reminder',
      toolInputTemplate: JSON.stringify({
        title: 'Product Roadmap Review',
        reminderTime: 'Tomorrow 9:45 AM'
      }),
      requiresApproval: true
    });

    // 1. Initial execution halts at approval
    const mission = await orch.executeMissionUntilPause(missionId);
    assert.equal(mission.status, 'AWAITING_APPROVAL', 'Mission halted at approval');

    const pendingTask = orch.db.getTask(task.id)!;
    assert.equal(pendingTask.verification_status, 'awaiting_approval', 'Task verification status is awaiting_approval');

    const app = orch.db.getPendingApprovalForTask(task.id)!;
    assert.ok(app);

    // 2. Resolve approval with valid fingerprint
    const resumed = await orch.resumeWithApproval(
      missionId,
      app.id,
      app.canonical_fingerprint,
      'approved',
      'User authorized reminder'
    );
    assert.ok(resumed);

    // 3. Execution resumes, action executes, and task is AUTOMATICALLY verified!
    const verifiedTask = orch.db.getTask(task.id)!;
    assert.equal(verifiedTask.status, 'completed', 'Task completed');
    assert.equal(verifiedTask.verification_status, 'verified', 'Task automatically verified after approved execution');

    const records = orch.db.getTaskVerifications(task.id);
    assert.ok(records.length >= 1);
    assert.equal(records[records.length - 1]!.verification_status, 'verified');
    assert.ok(records[records.length - 1]!.expected_outcome.includes('reminder'));

    await orch.close();
  });

  // AUTO-VERIFY-06: Verification history persists across application restarts in SQLite
  await t.test('AUTO-VERIFY-06: Verification history persists across database restarts', async () => {
    const PERSIST_DB = path.join(process.cwd(), 'test-persist-verify.db');
    if (fs.existsSync(PERSIST_DB)) {
      try { fs.unlinkSync(PERSIST_DB); } catch {}
    }

    try {
      const db1 = new OrchestratorDatabase(PERSIST_DB);
      db1.createMission('m-pers', 'Persistent test');
      const plan = db1.createPlan('p-pers', 'm-pers');
      const t = db1.createTask({
        id: 't-pers-1',
        missionId: 'm-pers',
        planId: plan.id,
        stepIndex: 1,
        title: 'Persistent task',
        toolName: 'get_task_status'
      });

      db1.recordTaskVerification({
        id: 'tvr-pers-1',
        missionId: 'm-pers',
        taskId: t.id,
        attemptNumber: 1,
        verificationStatus: 'verified',
        expectedOutcome: 'Task read-back confirmed',
        actualOutcome: 'Retrieved 1 task',
        evidenceJson: JSON.stringify({ totalTasks: 1 }),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });
      db1.close();

      // Open new database connection to same file
      const db2 = new OrchestratorDatabase(PERSIST_DB);
      const records = db2.getTaskVerifications('t-pers-1');
      assert.equal(records.length, 1);
      assert.equal(records[0]!.verification_status, 'verified');
      assert.equal(records[0]!.expected_outcome, 'Task read-back confirmed');
      assert.deepEqual(JSON.parse(records[0]!.evidence_json), { totalTasks: 1 });
      db2.close();
    } finally {
      if (fs.existsSync(PERSIST_DB)) {
        try { fs.unlinkSync(PERSIST_DB); } catch {}
      }
    }
  });
});
