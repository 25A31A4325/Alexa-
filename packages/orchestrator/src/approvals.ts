import { createHash } from 'node:crypto';
import { OrchestratorDatabase } from './db.js';
import { ApprovalRow } from './types.js';

export const CONSEQUENTIAL_ACTIONS = new Set<string>([
  'calendar_create_reminder',
  'calendar_create_event',
  'send_notification',
  'email_checklist',
  'delete_data'
]);

export class ApprovalService {
  constructor(private db: OrchestratorDatabase) {}

  public isActionConsequential(actionType: string): boolean {
    return CONSEQUENTIAL_ACTIONS.has(actionType);
  }

  public canonicalizeParameters(params: Record<string, unknown>): string {
    const keys = Object.keys(params).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const k of keys) {
      sortedObj[k] = params[k];
    }
    return JSON.stringify(sortedObj);
  }

  public computeFingerprint(missionId: string, taskId: string, actionType: string, canonicalParams: string): string {
    return createHash('sha256')
      .update(`${missionId}:${taskId}:${actionType}:${canonicalParams}`)
      .digest('hex');
  }

  public requestApproval(missionId: string, taskId: string, actionType: string, parameters: Record<string, unknown>, ttlMs: number = 900000): ApprovalRow {
    // Invalidate any prior pending approvals for this task
    this.db.invalidateApprovalsForTask(taskId, 'superseded_by_new_request');

    const canonicalParams = this.canonicalizeParameters(parameters);
    const fingerprint = this.computeFingerprint(missionId, taskId, actionType, canonicalParams);
    const approvalId = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = Date.now() + ttlMs;

    const row = this.db.createApproval({
      id: approvalId,
      missionId,
      taskId,
      actionType,
      parametersJson: canonicalParams,
      canonicalFingerprint: fingerprint,
      expiresAt
    });

    this.db.setTaskApprovalId(taskId, approvalId);

    this.db.recordActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      missionId,
      taskId,
      eventType: 'Approval',
      title: `Approval Requested: ${actionType}`,
      description: `Action requires human confirmation. Fingerprint: ${fingerprint.substring(0, 12)}...`,
      metadata: { approvalId, actionType, expiresAt }
    });

    return row;
  }

  public resolveApproval(
    approvalId: string,
    providedFingerprint: string,
    decision: 'approved' | 'rejected',
    note: string = ''
  ): { success: boolean; error?: string } {
    const res = this.db.resolveApprovalAtomic(approvalId, providedFingerprint, decision, note);
    const app = this.db.getApproval(approvalId);
    if (app) {
      this.db.recordActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        missionId: app.mission_id,
        taskId: app.task_id,
        eventType: 'Approval',
        title: `Approval ${decision.toUpperCase()}`,
        description: res.success
          ? `Human decision recorded: ${decision}`
          : `Approval resolution failed: ${res.error}`,
        metadata: { approvalId, decision, success: res.success }
      });
    }
    return res;
  }

  public verifyExecutionAllowed(taskId: string, actionType: string, parameters: Record<string, unknown>): { allowed: boolean; reason?: string } {
    if (!this.isActionConsequential(actionType)) {
      return { allowed: true }; // Autonomous action permitted
    }

    const task = this.db.getTask(taskId);
    if (!task || !task.approval_id) {
      return { allowed: false, reason: 'Consequential action lacks an approval record' };
    }

    const app = this.db.getApproval(task.approval_id);
    if (!app) {
      return { allowed: false, reason: 'Referenced approval record does not exist' };
    }

    if (app.status !== 'approved') {
      return { allowed: false, reason: `Action is not approved (current status: '${app.status}')` };
    }

    // Verify parameters match the approved fingerprint
    const canonicalParams = this.canonicalizeParameters(parameters);
    const currentFingerprint = this.computeFingerprint(app.mission_id, taskId, actionType, canonicalParams);

    if (currentFingerprint !== app.canonical_fingerprint) {
      return { allowed: false, reason: 'Parameters altered after approval was granted' };
    }

    return { allowed: true };
  }
}
