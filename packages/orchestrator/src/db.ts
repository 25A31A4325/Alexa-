import { DatabaseSync } from 'node:sqlite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  MissionStatus,
  TaskStatus,
  MissionRow,
  ExecutionPlanRow,
  MissionTaskRow,
  ApprovalRow,
  VerificationResultRow,
  ActivityEventRow,
  ToolInvocationRecord,
  IntegrationRow
} from './types.js';

export class OrchestratorDatabase {
  private db: DatabaseSync;

  constructor(dbPath: string = ':memory:') {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.initSchema();
    this.seedDefaultActivityEvents();
    this.seedIntegrations();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        goal TEXT NOT NULL,
        status TEXT NOT NULL,
        understanding_json TEXT,
        clarification_prompt TEXT,
        lock_worker_id TEXT,
        lock_expires_at INTEGER,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS execution_plans (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS mission_tasks (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        step_index INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        tool_name TEXT NOT NULL,
        tool_input_template TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 2,
        requires_approval INTEGER NOT NULL DEFAULT 0,
        approval_id TEXT,
        result_json TEXT,
        error_message TEXT,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
        FOREIGN KEY (plan_id) REFERENCES execution_plans(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS task_dependencies (
        task_id TEXT NOT NULL,
        depends_on_task_id TEXT NOT NULL,
        PRIMARY KEY (task_id, depends_on_task_id),
        FOREIGN KEY (task_id) REFERENCES mission_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (depends_on_task_id) REFERENCES mission_tasks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        canonical_fingerprint TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_by TEXT NOT NULL DEFAULT 'orchestrator',
        resolution_note TEXT,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES mission_tasks(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS verification_results (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        is_valid INTEGER NOT NULL,
        confidence_score REAL NOT NULL,
        satisfied_requirements_json TEXT NOT NULL,
        unsatisfied_requirements_json TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        summary TEXT NOT NULL,
        verified_at TEXT NOT NULL,
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_events (
        id TEXT PRIMARY KEY,
        mission_id TEXT,
        task_id TEXT,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tool_invocation_records (
        id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        status TEXT NOT NULL,
        input_json TEXT NOT NULL,
        output_json TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        invoked_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        connected INTEGER NOT NULL DEFAULT 0,
        is_local_demo INTEGER NOT NULL DEFAULT 0,
        config_json TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL
      );
    `);
  }

  // --- Mission Operations ---
  public createMission(id: string, goal: string, maxRetries: number = 3): MissionRow {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO missions (id, goal, status, retry_count, max_retries, created_at, updated_at)
      VALUES (?, ?, 'SUBMITTED', 0, ?, ?, ?)
    `).run(id, goal, maxRetries, now, now);

    return this.getMission(id)!;
  }

  public getMission(id: string): MissionRow | undefined {
    return this.db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as unknown as MissionRow | undefined;
  }

  public updateMissionGoal(id: string, goal: string): void {
    const now = new Date().toISOString();
    this.db.prepare('UPDATE missions SET goal = ?, updated_at = ? WHERE id = ?').run(goal, now, id);
  }

  public updateMissionStatus(id: string, status: MissionStatus, errorMessage: string | null = null): void {
    const now = new Date().toISOString();
    const completedAt = status === 'COMPLETED' ? now : null;

    this.db.prepare(`
      UPDATE missions 
      SET status = ?, error_message = ?, completed_at = COALESCE(?, completed_at), updated_at = ?
      WHERE id = ?
    `).run(status, errorMessage, completedAt, now, id);
  }

  public setMissionUnderstanding(id: string, understandingJson: string): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE missions SET understanding_json = ?, updated_at = ? WHERE id = ?
    `).run(understandingJson, now, id);
  }

  public setClarificationPrompt(id: string, prompt: string): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE missions SET clarification_prompt = ?, updated_at = ? WHERE id = ?
    `).run(prompt, now, id);
  }

  public incrementMissionRetry(id: string): number {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE missions SET retry_count = retry_count + 1, updated_at = ? WHERE id = ?
    `).run(now, id);
    const m = this.getMission(id);
    return m ? m.retry_count : 0;
  }

  // --- Concurrency Worker Leasing ---
  public acquireWorkerLease(missionId: string, workerId: string, leaseDurationMs: number = 10000): boolean {
    const now = Date.now();
    const expiresAt = now + leaseDurationMs;

    const result = this.db.prepare(`
      UPDATE missions
      SET lock_worker_id = ?, lock_expires_at = ?
      WHERE id = ? AND (lock_worker_id IS NULL OR lock_expires_at < ? OR lock_worker_id = ?)
    `).run(workerId, expiresAt, missionId, now, workerId);

    return Number(result.changes) > 0;
  }

  public releaseWorkerLease(missionId: string, workerId: string): void {
    this.db.prepare(`
      UPDATE missions SET lock_worker_id = NULL, lock_expires_at = NULL
      WHERE id = ? AND lock_worker_id = ?
    `).run(missionId, workerId);
  }

  // --- Plan & Task Operations ---
  public createPlan(planId: string, missionId: string, version: number = 1): ExecutionPlanRow {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO execution_plans (id, mission_id, version, created_at)
      VALUES (?, ?, ?, ?)
    `).run(planId, missionId, version, now);
    return { id: planId, mission_id: missionId, version, created_at: now };
  }

  public createTask(task: {
    id: string;
    missionId: string;
    planId: string;
    stepIndex: number;
    title: string;
    description?: string;
    toolName: string;
    toolInputTemplate?: string;
    requiresApproval?: boolean;
    maxRetries?: number;
  }): MissionTaskRow {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO mission_tasks 
      (id, mission_id, plan_id, step_index, title, description, tool_name, tool_input_template, status, retry_count, max_retries, requires_approval, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?)
    `).run(
      task.id,
      task.missionId,
      task.planId,
      task.stepIndex,
      task.title,
      task.description || '',
      task.toolName,
      task.toolInputTemplate || '{}',
      task.maxRetries || 2,
      task.requiresApproval ? 1 : 0,
      now,
      now
    );
    return this.getTask(task.id)!;
  }

  public addTaskDependency(taskId: string, dependsOnTaskId: string): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_task_id)
      VALUES (?, ?)
    `).run(taskId, dependsOnTaskId);
  }

  public getTask(id: string): MissionTaskRow | undefined {
    return this.db.prepare('SELECT * FROM mission_tasks WHERE id = ?').get(id) as unknown as MissionTaskRow | undefined;
  }

  public getTasksForMission(missionId: string): MissionTaskRow[] {
    return this.db.prepare(`
      SELECT * FROM mission_tasks WHERE mission_id = ? ORDER BY step_index ASC
    `).all(missionId) as unknown as MissionTaskRow[];
  }

  public getTaskDependencies(missionId: string): Array<{ task_id: string; depends_on_task_id: string }> {
    return this.db.prepare(`
      SELECT td.task_id, td.depends_on_task_id 
      FROM task_dependencies td
      JOIN mission_tasks mt ON td.task_id = mt.id
      WHERE mt.mission_id = ?
    `).all(missionId) as unknown as Array<{ task_id: string; depends_on_task_id: string }>;
  }

  public updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    resultJson: string | null = null,
    errorMessage: string | null = null,
    durationMs: number = 0
  ): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE mission_tasks 
      SET status = ?, result_json = COALESCE(?, result_json), error_message = ?, duration_ms = ?, updated_at = ?
      WHERE id = ?
    `).run(status, resultJson, errorMessage, durationMs, now, taskId);
  }

  public incrementTaskRetry(taskId: string): number {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE mission_tasks SET retry_count = retry_count + 1, updated_at = ? WHERE id = ?
    `).run(now, taskId);
    const t = this.getTask(taskId);
    return t ? t.retry_count : 0;
  }

  public setTaskApprovalId(taskId: string, approvalId: string): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE mission_tasks SET approval_id = ?, updated_at = ? WHERE id = ?
    `).run(approvalId, now, taskId);
  }

  // --- Approvals ---
  public createApproval(approval: {
    id: string;
    missionId: string;
    taskId: string;
    actionType: string;
    parametersJson: string;
    canonicalFingerprint: string;
    expiresAt: number;
  }): ApprovalRow {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO approvals 
      (id, mission_id, task_id, action_type, parameters_json, canonical_fingerprint, status, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      approval.id,
      approval.missionId,
      approval.taskId,
      approval.actionType,
      approval.parametersJson,
      approval.canonicalFingerprint,
      approval.expiresAt,
      now
    );
    return this.getApproval(approval.id)!;
  }

  public getApproval(id: string): ApprovalRow | undefined {
    return this.db.prepare('SELECT * FROM approvals WHERE id = ?').get(id) as unknown as ApprovalRow | undefined;
  }

  public getPendingApprovalForTask(taskId: string): ApprovalRow | undefined {
    return this.db.prepare(`
      SELECT * FROM approvals WHERE task_id = ? AND status = 'pending'
    `).get(taskId) as unknown as ApprovalRow | undefined;
  }

  public resolveApprovalAtomic(
    id: string,
    expectedFingerprint: string,
    decision: 'approved' | 'rejected',
    note: string = ''
  ): { success: boolean; error?: string } {
    const now = Date.now();
    const app = this.getApproval(id);
    if (!app) {
      return { success: false, error: 'Approval record not found' };
    }
    if (app.status !== 'pending') {
      return { success: false, error: `Approval is already in status '${app.status}'` };
    }
    if (now > app.expires_at) {
      this.db.prepare("UPDATE approvals SET status = 'expired', resolution_note = 'TTL expired' WHERE id = ?").run(id);
      return { success: false, error: 'Approval has expired' };
    }
    if (app.canonical_fingerprint !== expectedFingerprint) {
      return { success: false, error: 'Cryptographic fingerprint mismatch: action parameters were altered' };
    }

    const isoNow = new Date().toISOString();
    const res = this.db.prepare(`
      UPDATE approvals 
      SET status = ?, resolution_note = ?, resolved_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(decision, note, isoNow, id);

    if (Number(res.changes) === 0) {
      return { success: false, error: 'Concurrent resolution conflict' };
    }
    return { success: true };
  }

  public invalidateApprovalsForTask(taskId: string, reason: string): void {
    this.db.prepare(`
      UPDATE approvals SET status = 'superseded', resolution_note = ? WHERE task_id = ? AND status = 'pending'
    `).run(reason, taskId);
  }

  // --- Verifications ---
  public saveVerificationResult(res: {
    id: string;
    missionId: string;
    isValid: boolean;
    confidenceScore: number;
    satisfiedRequirements: string[];
    unsatisfiedRequirements: string[];
    evidence: Record<string, unknown>;
    summary: string;
  }): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO verification_results 
      (id, mission_id, is_valid, confidence_score, satisfied_requirements_json, unsatisfied_requirements_json, evidence_json, summary, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      res.id,
      res.missionId,
      res.isValid ? 1 : 0,
      res.confidenceScore,
      JSON.stringify(res.satisfiedRequirements),
      JSON.stringify(res.unsatisfiedRequirements),
      JSON.stringify(res.evidence),
      res.summary,
      now
    );
  }

  public getVerificationResult(missionId: string): VerificationResultRow | undefined {
    return this.db.prepare(`
      SELECT * FROM verification_results WHERE mission_id = ? ORDER BY verified_at DESC LIMIT 1
    `).get(missionId) as unknown as VerificationResultRow | undefined;
  }

  // --- Activity & Invocations ---
  private seedDefaultActivityEvents(): void {
    try {
      const count = (this.db.prepare('SELECT COUNT(*) as count FROM activity_events').get() as any)?.count || 0;
      if (count > 0) return;

      const defaultEvents = [
        {
          id: 'act-seed-1',
          eventType: 'Conversation',
          title: 'Meeting Preparation',
          description: 'Created a new conversation',
          createdAt: '2026-10-10T22:12:00.000Z'
        },
        {
          id: 'act-seed-2',
          eventType: 'Tool',
          title: 'Document Analysis',
          description: 'Analyzed Q4 Product Roadmap.pdf',
          createdAt: '2026-10-10T22:14:00.000Z'
        },
        {
          id: 'act-seed-3',
          eventType: 'Integration',
          title: 'Google Calendar',
          description: 'Fetched upcoming meetings',
          createdAt: '2026-10-10T22:14:30.000Z'
        },
        {
          id: 'act-seed-4',
          eventType: 'Mission',
          title: 'Created Checklist',
          description: 'Generated a prioritized preparation checklist',
          createdAt: '2026-10-10T22:16:00.000Z'
        },
        {
          id: 'act-seed-5',
          eventType: 'Knowledge',
          title: 'Saved to Knowledge',
          description: 'Added meeting insights to knowledge base',
          createdAt: '2026-10-10T22:17:00.000Z'
        },
        {
          id: 'act-seed-5b',
          eventType: 'Knowledge',
          title: 'Product Requirements',
          description: 'Reviewed PRD specifications and architectural requirements',
          createdAt: '2026-10-10T22:18:00.000Z'
        },
        {
          id: 'act-seed-6',
          eventType: 'Tool',
          title: 'Data Analysis',
          description: 'Analyzed market trends for Q4 2026',
          createdAt: '2026-10-10T22:20:00.000Z'
        },
        {
          id: 'act-seed-7',
          eventType: 'Tool',
          title: 'Set Reminders',
          description: 'Created 3 reminders for preparation tasks',
          createdAt: '2026-10-10T22:21:00.000Z'
        },
        {
          id: 'act-seed-8',
          eventType: 'Mission',
          title: 'Mission Completed',
          description: 'Meeting Preparation completed successfully',
          createdAt: '2026-10-10T22:22:00.000Z'
        }
      ];

      const insertStmt = this.db.prepare(`
        INSERT INTO activity_events (id, mission_id, task_id, event_type, title, description, metadata_json, created_at)
        VALUES (?, null, null, ?, ?, ?, null, ?)
      `);

      for (const ev of defaultEvents) {
        insertStmt.run(ev.id, ev.eventType, ev.title, ev.description, ev.createdAt);
      }
    } catch {
      // Ignored if schema not ready or table exists
    }
  }

  public recordActivity(event: {
    id: string;
    missionId?: string;
    taskId?: string;
    eventType: 'Mission' | 'Tool' | 'Approval' | 'Verification' | 'Recovery' | 'Conversation' | 'Integration' | 'Knowledge' | string;
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      INSERT INTO activity_events (id, mission_id, task_id, event_type, title, description, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.missionId || null,
      event.taskId || null,
      event.eventType,
      event.title,
      event.description,
      event.metadata ? JSON.stringify(event.metadata) : null,
      now
    );
  }

  public getActivitiesForMission(missionId: string): ActivityEventRow[] {
    return this.db.prepare(`
      SELECT * FROM activity_events WHERE mission_id = ? ORDER BY created_at ASC
    `).all(missionId) as unknown as ActivityEventRow[];
  }

  public recordToolInvocation(record: ToolInvocationRecord): void {
    this.db.prepare(`
      INSERT INTO tool_invocation_records 
      (id, mission_id, task_id, tool_name, status, input_json, output_json, duration_ms, invoked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.mission_id,
      record.task_id,
      record.tool_name,
      record.status,
      record.input_json,
      record.output_json,
      record.duration_ms,
      record.invoked_at
    );
  }

  public getToolInvocationsForMission(missionId: string): ToolInvocationRecord[] {
    return this.db.prepare(`
      SELECT * FROM tool_invocation_records WHERE mission_id = ? ORDER BY invoked_at ASC
    `).all(missionId) as unknown as ToolInvocationRecord[];
  }

  // --- Integrations Persistence ---
  public seedIntegrations(): void {
    try {
      const existing = this.db.prepare('SELECT COUNT(*) as cnt FROM integrations').get() as { cnt: number };
      if (existing && existing.cnt > 0) {
        return;
      }

      const defaultIntegrations = [
        { id: 'google-calendar', name: 'Google Calendar', category: 'Productivity', isDemo: 1 },
        { id: 'google-drive', name: 'Google Drive', category: 'Knowledge', isDemo: 0 },
        { id: 'gmail', name: 'Gmail', category: 'Communication', isDemo: 0 },
        { id: 'notion', name: 'Notion', category: 'Knowledge', isDemo: 0 },
        { id: 'slack', name: 'Slack', category: 'Communication', isDemo: 1 },
        { id: 'github', name: 'GitHub', category: 'Development', isDemo: 0 },
        { id: 'google-maps', name: 'Google Maps', category: 'Data', isDemo: 0 },
        { id: 'microsoft-outlook', name: 'Microsoft Outlook', category: 'Productivity', isDemo: 0 },
        { id: 'figma', name: 'Figma', category: 'Development', isDemo: 0 }
      ];

      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        INSERT INTO integrations (id, name, category, connected, is_local_demo, config_json, updated_at)
        VALUES (?, ?, ?, 0, ?, '{}', ?)
      `);

      for (const item of defaultIntegrations) {
        stmt.run(item.id, item.name, item.category, item.isDemo, now);
      }
    } catch {
      // Ignored if table not created yet
    }
  }

  public getIntegrations(): IntegrationRow[] {
    return this.db.prepare(`
      SELECT * FROM integrations ORDER BY id ASC
    `).all() as unknown as IntegrationRow[];
  }

  public getIntegration(id: string): IntegrationRow | undefined {
    return this.db.prepare(`
      SELECT * FROM integrations WHERE id = ?
    `).get(id) as unknown as IntegrationRow | undefined;
  }

  public updateIntegrationStatus(id: string, connected: boolean): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE integrations SET connected = ?, updated_at = ? WHERE id = ?
    `).run(connected ? 1 : 0, now, id);
  }

  public resetIntegrations(): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE integrations SET connected = 0, updated_at = ?
    `).run(now);
  }

  public close(): void {
    this.db.close();
  }
}
