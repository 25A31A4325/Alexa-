import { OrchestraMcpClient } from '@orchestra/mcp-client';
import { OrchestratorDatabase } from './db.js';
import { MissionStateMachine } from './state-machine.js';
import { ObjectiveUnderstandingEngine, ObjectiveUnderstanding } from './understanding.js';
import { MissionPlanner } from './planner.js';
import { ApprovalService } from './approvals.js';
import { MissionVerifier } from './verifier.js';
import { MissionRow, MissionTaskRow } from './types.js';
import { withMcpRequestContext } from '@orchestra/mcp-client';

export interface OrchestratorOptions {
  workerId?: string;
  leaseDurationMs?: number;
  serverUrl?: string;
  dbPath?: string;
  db?: OrchestratorDatabase;
}

export class MissionOrchestrator {
  public db: OrchestratorDatabase;
  public stateMachine: MissionStateMachine;
  public understandingEngine: ObjectiveUnderstandingEngine;
  public planner: MissionPlanner;
  public approvalService: ApprovalService;
  public verifier: MissionVerifier;
  public mcpClient: OrchestraMcpClient;

  public workerId: string;
  public leaseDurationMs: number;

  public onTaskUpdated?: (missionId: string, task: MissionTaskRow, tasks: MissionTaskRow[]) => void;
  public onStateTransition?: (missionId: string, status: string, mission: MissionRow) => void;
  public onApprovalRequired?: (missionId: string, approval: any, mission: MissionRow) => void;

  constructor(options: OrchestratorOptions = {}) {
    this.workerId = options.workerId || `worker-${process.pid}-${Math.random().toString(36).substring(2, 6)}`;
    this.leaseDurationMs = options.leaseDurationMs || 15000;
    this.db = options.db || new OrchestratorDatabase(options.dbPath || ':memory:');
    this.stateMachine = new MissionStateMachine(this.db);
    this.understandingEngine = new ObjectiveUnderstandingEngine();
    this.planner = new MissionPlanner();
    this.approvalService = new ApprovalService(this.db);
    this.verifier = new MissionVerifier(this.db);
    this.mcpClient = new OrchestraMcpClient({ serverUrl: options.serverUrl });
  }

  public async connect(): Promise<void> {
    await this.mcpClient.connect();
  }

  public async close(): Promise<void> {
    await this.mcpClient.close();
    this.db.close();
  }

  public submitMission(id: string, goal: string): MissionRow {
    const row = this.db.createMission(id, goal);
    this.db.recordActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      missionId: id,
      eventType: 'Mission',
      title: 'Mission Submitted',
      description: `Objective received: ${goal.substring(0, 80)}...`
    });
    return row;
  }

  public async executeMissionUntilPause(missionId: string): Promise<MissionRow> {
    let mission = this.db.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission '${missionId}' not found`);
    }

    // Acquire lease
    const acquired = this.db.acquireWorkerLease(missionId, this.workerId, this.leaseDurationMs);
    if (!acquired) {
      throw new Error(`Concurrent execution lock held by another worker on mission '${missionId}'`);
    }

    try {
      while (
        mission.status !== 'COMPLETED' &&
        mission.status !== 'FAILED' &&
        mission.status !== 'CANCELLED' &&
        mission.status !== 'AWAITING_APPROVAL' &&
        mission.status !== 'NEEDS_CLARIFICATION'
      ) {
        switch (mission.status) {
          case 'SUBMITTED': {
            this.stateMachine.transition(missionId, 'UNDERSTANDING');
            break;
          }

          case 'UNDERSTANDING': {
            const understanding = this.understandingEngine.parseObjective(mission.goal);
            this.db.setMissionUnderstanding(missionId, JSON.stringify(understanding));

            if (understanding.ambiguities.length > 0) {
              const prompt = `Clarification needed: ${understanding.ambiguities.join('; ')}`;
              this.db.setClarificationPrompt(missionId, prompt);
              this.stateMachine.transition(missionId, 'NEEDS_CLARIFICATION', prompt);
            } else {
              this.stateMachine.transition(missionId, 'PLANNING');
            }
            break;
          }

          case 'PLANNING': {
            const understandingJson = mission.understanding_json;
            const understanding: ObjectiveUnderstanding = understandingJson
              ? JSON.parse(understandingJson)
              : this.understandingEngine.parseObjective(mission.goal);

            const plan = this.planner.createPlan(missionId, understanding);
            this.db.createPlan(plan.planId, missionId);

            for (const t of plan.tasks) {
              this.db.createTask({
                id: t.id,
                missionId,
                planId: plan.planId,
                stepIndex: t.stepIndex,
                title: t.title,
                description: t.description,
                toolName: t.toolName,
                toolInputTemplate: JSON.stringify(t.toolInputTemplate),
                requiresApproval: t.requiresApproval,
                maxRetries: t.maxRetries
              });

              for (const dep of t.dependsOn) {
                this.db.addTaskDependency(t.id, dep);
              }
            }

            this.stateMachine.transition(missionId, 'DISCOVERING_TOOLS');
            break;
          }

          case 'DISCOVERING_TOOLS': {
            // Real discovery through MCP client
            if (!this.mcpClient.isConnected()) {
              await this.mcpClient.connect();
            }
            const discovered = await this.mcpClient.listTools();
            if (!discovered || discovered.length === 0) {
              this.stateMachine.transition(missionId, 'RECOVERING', 'No tools discovered over MCP boundary');
            } else {
              this.db.recordActivity({
                id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                missionId,
                eventType: 'Tool',
                title: 'MCP Tools Discovered',
                description: `Discovered ${discovered.length} tools over Streamable HTTP: ${discovered.map(d => d.name).join(', ')}`
              });
              this.stateMachine.transition(missionId, 'EXECUTING');
            }
            break;
          }

          case 'EXECUTING':
          case 'EXECUTING_APPROVED': {
            const nextTask = this.selectNextEligibleTask(missionId);
            if (!nextTask) {
              // Check if all tasks completed
              const allTasks = this.db.getTasksForMission(missionId);
              const allCompleted = allTasks.every(t => t.status === 'completed');
              if (allCompleted) {
                this.stateMachine.transition(missionId, 'VERIFYING');
              } else {
                const anyFailed = allTasks.some(t => t.status === 'failed');
                if (anyFailed) {
                  this.stateMachine.transition(missionId, 'FAILED', 'One or more tasks failed');
                } else {
                  // Deadlock or waiting
                  this.stateMachine.transition(missionId, 'FAILED', 'Deadlock detected: remaining tasks blocked');
                }
              }
              break;
            }

            // Check if task requires approval and hasn't been approved yet
            if (nextTask.requires_approval === 1) {
              const pendingApp = this.db.getPendingApprovalForTask(nextTask.id);
              if (!pendingApp && !nextTask.approval_id) {
                // Parse tool parameters to create approval request
                const params = JSON.parse(nextTask.tool_input_template);
                const actionType = (params.actionType as string) || nextTask.tool_name;
                const actionParams = (params.parameters as Record<string, unknown>) || params;

                const appRecord = this.approvalService.requestApproval(missionId, nextTask.id, actionType, actionParams);
                this.stateMachine.transition(missionId, 'AWAITING_APPROVAL', `Approval requested for task '${nextTask.title}'`);
                const updatedM = this.db.getMission(missionId)!;
                this.onStateTransition?.(missionId, 'AWAITING_APPROVAL', updatedM);
                this.onApprovalRequired?.(missionId, appRecord, updatedM);
                break; // Pause loop
              }

              // If approved, check authorization gate
              if (nextTask.approval_id) {
                const app = this.db.getApproval(nextTask.approval_id);
                if (app && app.status === 'approved') {
                  // Approved! Proceed to execute through MCP
                } else if (app && (app.status === 'rejected' || app.status === 'cancelled')) {
                  this.db.updateTaskStatus(nextTask.id, 'cancelled', null, `Action was rejected (${app.status})`);
                  this.stateMachine.transition(missionId, 'CANCELLED', `Action rejected by user`);
                  break;
                } else {
                  this.stateMachine.transition(missionId, 'AWAITING_APPROVAL', `Waiting on approval ${nextTask.approval_id}`);
                  break;
                }
              }
            }

            // Execute the task via MCP client
            await this.executeTaskStep(nextTask, missionId);
            break;
          }

          case 'RECOVERING': {
            const retryCount = this.db.incrementMissionRetry(missionId);
            if (retryCount > mission.max_retries) {
              this.stateMachine.transition(missionId, 'FAILED', `Exceeded maximum mission retry limit (${mission.max_retries})`);
            } else {
              // Fallback to EXECUTING
              this.stateMachine.transition(missionId, 'EXECUTING', `Retrying execution (attempt ${retryCount})`);
            }
            break;
          }

          case 'VERIFYING': {
            const understandingJson = mission.understanding_json;
            const understanding: ObjectiveUnderstanding = understandingJson
              ? JSON.parse(understandingJson)
              : this.understandingEngine.parseObjective(mission.goal);

            const verification = this.verifier.verifyMission(missionId, understanding);
            if (verification.isValid) {
              this.stateMachine.transition(missionId, 'COMPLETED', verification.summary);
            } else {
              this.stateMachine.transition(missionId, 'FAILED', verification.summary);
            }
            break;
          }
        }

        // Refresh mission state for next iteration
        mission = this.db.getMission(missionId)!;
      }
    } finally {
      this.db.releaseWorkerLease(missionId, this.workerId);
    }

    return this.db.getMission(missionId)!;
  }

  private selectNextEligibleTask(missionId: string): MissionTaskRow | null {
    const tasks = this.db.getTasksForMission(missionId);
    const deps = this.db.getTaskDependencies(missionId);

    const completedIds = new Set(tasks.filter(t => t.status === 'completed').map(t => t.id));

    for (const t of tasks) {
      if (t.status === 'pending') {
        const taskDeps = deps.filter(d => d.task_id === t.id).map(d => d.depends_on_task_id);
        const allDepsSatisfied = taskDeps.every(dId => completedIds.has(dId));
        if (allDepsSatisfied) {
          return t;
        }
      }
    }
    return null;
  }

  private async executeTaskStep(task: MissionTaskRow, missionId: string): Promise<void> {
    this.db.updateTaskStatus(task.id, 'in_progress');
    const runningTask = this.db.getTask(task.id);
    if (runningTask) {
      this.onTaskUpdated?.(missionId, runningTask, this.db.getTasksForMission(missionId));
    }
    const start = Date.now();

    try {
      const inputArgs = JSON.parse(task.tool_input_template);

      // Verify approval enforcement if consequential
      if (task.requires_approval === 1) {
        const check = this.approvalService.verifyExecutionAllowed(task.id, inputArgs.actionType || task.tool_name, inputArgs.parameters || inputArgs);
        if (!check.allowed) {
          throw new Error(`Security policy blocked execution: ${check.reason}`);
        }
      }

      // Call MCP Tool through the real client
      let rawResult: unknown;
      if (task.requires_approval === 1 && task.approval_id) {
        const approval = this.db.getApproval(task.approval_id);
        if (!approval) {
          throw new Error('Security policy blocked execution: approval record is missing.');
        }
        rawResult = await withMcpRequestContext({
          approval: {
            missionId,
            taskId: task.id,
            actionType: inputArgs.actionType || task.tool_name,
            fingerprint: approval.canonical_fingerprint,
            parameters: inputArgs.parameters || inputArgs
          }
        }, () => this.mcpClient.callTool(task.tool_name, inputArgs));
      } else {
        rawResult = await this.mcpClient.callTool(task.tool_name, inputArgs);
      }
      const durationMs = Date.now() - start;

      const isProviderTool = /^(gmail_|google_calendar_|google_drive_|github_)/.test(task.tool_name);
      const persistedResult = isProviderTool
        ? { providerResponseReceived: true, privateDataOmitted: true }
        : rawResult;
      const resultJson = JSON.stringify(persistedResult);

      this.db.updateTaskStatus(task.id, 'completed', resultJson, null, durationMs);
      const completedTask = this.db.getTask(task.id);
      if (completedTask) {
        this.onTaskUpdated?.(missionId, completedTask, this.db.getTasksForMission(missionId));
      }

      // Record tool invocation
      this.db.recordToolInvocation({
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        mission_id: missionId,
        task_id: task.id,
        tool_name: task.tool_name,
        status: 'success',
        input_json: isProviderTool
          ? JSON.stringify({ redacted: true, fields: Object.keys(inputArgs).sort() })
          : task.tool_input_template,
        output_json: resultJson,
        duration_ms: durationMs,
        invoked_at: new Date().toISOString()
      });

      this.db.recordActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        missionId,
        taskId: task.id,
        eventType: 'Tool',
        title: `Executed ${task.tool_name}`,
        description: `Task '${task.title}' completed in ${durationMs}ms`,
        metadata: { toolName: task.tool_name, durationMs }
      });
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const errMsg = err instanceof Error ? err.message : String(err);

      const retries = this.db.incrementTaskRetry(task.id);
      if (retries <= task.max_retries) {
        this.db.updateTaskStatus(task.id, 'pending', null, `Retryable failure (${retries}/${task.max_retries}): ${errMsg}`, durationMs);
      } else {
        this.db.updateTaskStatus(task.id, 'failed', null, errMsg, durationMs);
      }
      const finishedTask = this.db.getTask(task.id);
      if (finishedTask) {
        this.onTaskUpdated?.(missionId, finishedTask, this.db.getTasksForMission(missionId));
      }

      this.db.recordToolInvocation({
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        mission_id: missionId,
        task_id: task.id,
        tool_name: task.tool_name,
        status: 'failure',
        input_json: task.tool_input_template,
        output_json: JSON.stringify({ error: errMsg }),
        duration_ms: durationMs,
        invoked_at: new Date().toISOString()
      });
    }
  }

  public resumeWithApproval(missionId: string, approvalId: string, fingerprint: string, decision: 'approved' | 'rejected', note?: string): Promise<MissionRow> {
    const res = this.approvalService.resolveApproval(approvalId, fingerprint, decision, note);
    if (!res.success) {
      throw new Error(`Failed to resolve approval: ${res.error}`);
    }

    if (decision === 'approved') {
      this.stateMachine.transition(missionId, 'EXECUTING_APPROVED', `Resuming with human approval token ${approvalId}`);
    } else {
      this.stateMachine.transition(missionId, 'RECOVERING', `Action rejected by human reviewer`);
    }

    return this.executeMissionUntilPause(missionId);
  }

  public resumeWithClarification(missionId: string, additionalContext: string): Promise<MissionRow> {
    const mission = this.db.getMission(missionId);
    if (!mission || mission.status !== 'NEEDS_CLARIFICATION') {
      throw new Error(`Mission '${missionId}' is not awaiting clarification`);
    }

    const updatedGoal = `${mission.goal}\nClarification: ${additionalContext}`;
    this.db.updateMissionGoal(missionId, updatedGoal);
    this.stateMachine.transition(missionId, 'UNDERSTANDING', 'Resuming with user clarification');
    return this.executeMissionUntilPause(missionId);
  }
}
