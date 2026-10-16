import { OrchestratorDatabase } from './db.js';
import { ObjectiveUnderstanding } from './understanding.js';

export interface VerificationEvaluation {
  isValid: boolean;
  confidenceScore: number;
  satisfiedRequirements: string[];
  unsatisfiedRequirements: string[];
  evidence: Record<string, unknown>;
  summary: string;
}

export class MissionVerifier {
  constructor(private db: OrchestratorDatabase) {}

  public verifyMission(missionId: string, understanding: ObjectiveUnderstanding): VerificationEvaluation {
    const tasks = this.db.getTasksForMission(missionId);
    const invocations = this.db.getToolInvocationsForMission(missionId);
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const satisfiedRequirements: string[] = [];
    const unsatisfiedRequirements: string[] = [];
    const evidence: Record<string, unknown> = {
      originalGoal: understanding.originalObjective,
      totalTasks: tasks.length,
      completedTaskCount: completedTasks.length,
      invocationCount: invocations.length,
      toolsUsed: [...new Set(invocations.map(i => i.tool_name))]
    };

    // 1. Task Execution Integrity
    if (completedTasks.length === tasks.length && tasks.length > 0) {
      satisfiedRequirements.push(`All ${tasks.length} planned workflow tasks executed to completion`);
    } else {
      unsatisfiedRequirements.push(`${tasks.length - completedTasks.length} workflow tasks incomplete or failed`);
    }

    // 2. Check calendar & context requirement (if planned or executed)
    const plannedContext = tasks.some(t => t.tool_name === 'get_conversation_context');
    const hasContext = invocations.some(i => i.tool_name === 'get_conversation_context' && i.status === 'success');
    if (hasContext) {
      satisfiedRequirements.push('Meeting and calendar context retrieved');
    } else if (plannedContext) {
      unsatisfiedRequirements.push('Missing calendar and meeting context');
    }

    // 3. Check knowledge & document retrieval requirement (if planned or executed)
    const plannedDocs = tasks.some(t => t.tool_name === 'retrieve_document');
    const hasDocs = invocations.some(i => i.tool_name === 'retrieve_document' && i.status === 'success');
    if (hasDocs) {
      satisfiedRequirements.push('Relevant demonstration roadmap documents retrieved');
    } else if (plannedDocs) {
      unsatisfiedRequirements.push('Missing document retrieval');
    }

    // 4. Check document analysis requirement (if planned or executed)
    const plannedAnalysis = tasks.some(t => t.tool_name === 'analyze_document');
    const hasAnalysis = invocations.some(i => i.tool_name === 'analyze_document' && i.status === 'success');
    if (hasAnalysis) {
      satisfiedRequirements.push('Document analyzed and gap analysis synthesized');
    } else if (plannedAnalysis) {
      unsatisfiedRequirements.push('Missing document analysis');
    }

    // 5. Check checklist task creation requirement (if planned or executed)
    const plannedChecklist = tasks.some(t => t.tool_name === 'create_task');
    const hasChecklist = invocations.some(i => i.tool_name === 'create_task' && i.status === 'success');
    if (hasChecklist) {
      satisfiedRequirements.push('Prioritized preparation checklist created and persisted');
    } else if (plannedChecklist) {
      unsatisfiedRequirements.push('Missing preparation checklist');
    }

    // 6. Check conflict detection (if planned or executed)
    const plannedConflict = tasks.some(t => t.tool_name === 'detect_conflict');
    const hasConflictCheck = invocations.some(i => i.tool_name === 'detect_conflict' && i.status === 'success');
    if (hasConflictCheck) {
      satisfiedRequirements.push('Schedule and prerequisite conflicts assessed');
    } else if (plannedConflict) {
      unsatisfiedRequirements.push('Missing conflict assessment');
    }

    // 7. Check approval policy requirement
    const approvals = tasks.filter(t => t.requires_approval === 1);
    let approvalHonored = true;
    for (const a of approvals) {
      if (!a.approval_id) {
        approvalHonored = false;
        unsatisfiedRequirements.push(`Consequential task '${a.title}' lacked approval record`);
      } else {
        const appRow = this.db.getApproval(a.approval_id);
        if (appRow && appRow.status === 'approved') {
          satisfiedRequirements.push(`Human approval verified for consequential action: ${appRow.action_type}`);
        } else if (appRow && appRow.status === 'rejected') {
          satisfiedRequirements.push(`Action was safely rejected by human reviewer`);
        } else {
          approvalHonored = false;
          unsatisfiedRequirements.push(`Approval for '${a.title}' pending or invalid`);
        }
      }
    }

    const isValid = unsatisfiedRequirements.length === 0 && approvalHonored && completedTasks.length >= tasks.length && tasks.length > 0;
    const confidenceScore = isValid ? 0.95 : Math.max(0.2, satisfiedRequirements.length / Math.max(1, (satisfiedRequirements.length + unsatisfiedRequirements.length)));

    const summary = isValid
      ? `All ${satisfiedRequirements.length} mission objectives and constraints were independently verified with supporting MCP invocation evidence.`
      : `Verification incomplete. ${unsatisfiedRequirements.length} requirements unsatisfied: ${unsatisfiedRequirements.join(', ')}`;

    const result: VerificationEvaluation = {
      isValid,
      confidenceScore,
      satisfiedRequirements,
      unsatisfiedRequirements,
      evidence,
      summary
    };

    // Save to database
    this.db.saveVerificationResult({
      id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      missionId,
      isValid,
      confidenceScore,
      satisfiedRequirements,
      unsatisfiedRequirements,
      evidence,
      summary
    });

    return result;
  }
}
