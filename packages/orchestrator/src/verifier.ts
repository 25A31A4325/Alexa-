import { OrchestratorDatabase } from './db.js';
import { ObjectiveUnderstanding } from './understanding.js';
import { MissionTaskRow, TaskVerificationStatus, ApprovalRow } from './types.js';

export interface VerificationEvaluation {
  isValid: boolean;
  confidenceScore: number;
  satisfiedRequirements: string[];
  unsatisfiedRequirements: string[];
  evidence: Record<string, unknown>;
  summary: string;
}

export interface TaskVerificationEvaluation {
  isVerified: boolean;
  status: TaskVerificationStatus;
  expectedOutcome: string;
  actualOutcome: string;
  evidence: Record<string, unknown>;
  failureReason: string | null;
  canRetry: boolean;
}

export class TaskVerifier {
  constructor(public db: OrchestratorDatabase) {}

  public verifyTask(
    task: MissionTaskRow,
    rawResult: unknown,
    inputArgs?: Record<string, any>,
    approvalRow?: ApprovalRow
  ): TaskVerificationEvaluation {
    let resolvedArgs: Record<string, any> = {};
    if (inputArgs && Object.keys(inputArgs).length > 0) {
      resolvedArgs = inputArgs;
    } else if (task.tool_input_template) {
      try {
        resolvedArgs = JSON.parse(task.tool_input_template);
      } catch {
        resolvedArgs = {};
      }
    }
    // 1. Guard against null, undefined, or explicit tool execution errors
    if (rawResult === null || rawResult === undefined) {
      return {
        isVerified: false,
        status: 'inconclusive',
        expectedOutcome: `Execution of ${task.tool_name} produces structured, non-empty evidence`,
        actualOutcome: 'Null or undefined payload returned by tool',
        evidence: {},
        failureReason: 'Insufficient evidence: tool returned no output',
        canRetry: true
      };
    }

    if (typeof rawResult === 'object' && rawResult !== null) {
      const errObj = rawResult as Record<string, any>;
      if (errObj.error || errObj.isError === true) {
        return {
          isVerified: false,
          status: 'failed',
          expectedOutcome: `Successful execution of ${task.tool_name}`,
          actualOutcome: `Tool reported error: ${errObj.error || 'Execution failure'}`,
          evidence: { rawResult },
          failureReason: String(errObj.error || 'Tool execution resulted in an error'),
          canRetry: true
        };
      }
    }

    // 2. Sensitive / Consequential Action Policy Verification
    if (task.requires_approval === 1) {
      if (!approvalRow) {
        return {
          isVerified: false,
          status: 'awaiting_approval',
          expectedOutcome: `Consequential action '${task.tool_name}' verified against authorized human approval signature`,
          actualOutcome: 'Missing approval record for consequential action',
          evidence: { requiresApproval: true },
          failureReason: 'Human approval is mandatory before this task can be verified and executed',
          canRetry: false
        };
      }

      if (approvalRow.status !== 'approved') {
        return {
          isVerified: false,
          status: approvalRow.status === 'pending' ? 'awaiting_approval' : 'failed',
          expectedOutcome: `Human approval with status 'approved'`,
          actualOutcome: `Approval status is '${approvalRow.status}'`,
          evidence: { approvalId: approvalRow.id, status: approvalRow.status },
          failureReason: `Approval has not been granted (status: ${approvalRow.status})`,
          canRetry: false
        };
      }
    }

    const res = (typeof rawResult === 'object' && rawResult !== null ? rawResult : {}) as Record<string, any>;

    // 3. Tool-specific evidence validation
    switch (task.tool_name) {
      case 'retrieve_document': {
        const expectedDocId = resolvedArgs.documentId || resolvedArgs.document_id;
        const hasContent = typeof res.content === 'string' && res.content.trim().length > 0;
        const hasId = typeof res.id === 'string' && res.id.length > 0;
        const idMatches = !expectedDocId || res.id === expectedDocId;

        if (!hasId || !hasContent) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: `Document '${expectedDocId || 'requested'}' with non-empty content and identifier`,
            actualOutcome: `Retrieved id: '${res.id || 'none'}', content length: ${typeof res.content === 'string' ? res.content.length : 0}`,
            evidence: { id: res.id, hasContent },
            failureReason: 'Document retrieval returned empty content or missing identifier',
            canRetry: true
          };
        }

        if (!idMatches) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: `Document with identifier '${expectedDocId}'`,
            actualOutcome: `Received document with mismatched identifier '${res.id}'`,
            evidence: { requestedId: expectedDocId, receivedId: res.id },
            failureReason: `Retrieved document ID '${res.id}' does not match requested ID '${expectedDocId}'`,
            canRetry: false
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Document '${res.id}' retrieved with complete text content`,
          actualOutcome: `Document successfully retrieved (${res.pages || 1} pages, ${res.content.length} characters)`,
          evidence: {
            documentId: res.id,
            title: res.title,
            pages: res.pages,
            contentLength: res.content.length,
            fileType: res.fileType
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'search_knowledge': {
        const hasResults = Array.isArray(res.results);
        if (!hasResults) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: 'Structured search results with results array and totalCount',
            actualOutcome: 'Missing results array in knowledge search response',
            evidence: { res },
            failureReason: 'Knowledge search response missing structured results array',
            canRetry: true
          };
        }

        const validItems = (res.results as any[]).every(item => item && typeof item.id === 'string' && typeof item.title === 'string');
        if (!validItems && res.results.length > 0) {
          return {
            isVerified: false,
            status: 'inconclusive',
            expectedOutcome: 'Each search result item has valid identifier and title',
            actualOutcome: 'Search results contained malformed document items',
            evidence: { count: res.results.length },
            failureReason: 'Search result items lacked required id or title fields',
            canRetry: true
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Knowledge search returns matching documents (found ${res.results.length})`,
          actualOutcome: `Found ${res.results.length} relevant knowledge documents`,
          evidence: {
            totalCount: res.totalCount ?? res.results.length,
            matchedDocIds: res.results.map((r: any) => r.id),
            relevanceDistribution: res.results.map((r: any) => ({ id: r.id, relevance: r.relevance }))
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'analyze_document': {
        const hasTopics = Array.isArray(res.key_topics) && res.key_topics.length > 0;
        const hasActionItems = Array.isArray(res.action_items) && res.action_items.length > 0;
        const hasSummary = typeof res.summary === 'string' && res.summary.trim().length >= 10;
        const hasAnalysisObj = res.analysis !== undefined && res.analysis !== null;
        const hasAnalyzedDocs = typeof res.documents_analyzed === 'number' && res.documents_analyzed > 0;

        if (!hasTopics && !hasActionItems && !hasSummary && !hasAnalysisObj && !hasAnalyzedDocs) {
          return {
            isVerified: false,
            status: 'inconclusive',
            expectedOutcome: 'Document analysis synthesizes key topics, action items, or executive summary',
            actualOutcome: 'Analysis payload contains no extracted topics, action items, or summary',
            evidence: { res },
            failureReason: 'Insufficient evidence: analysis output is empty or lacks substantive findings',
            canRetry: true
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: 'Document synthesis with extracted insights and actionable items',
          actualOutcome: `Synthesized analysis with ${(res.key_topics || []).length} topics and ${(res.action_items || []).length} action items`,
          evidence: {
            keyTopicsCount: (res.key_topics || []).length,
            actionItemsCount: (res.action_items || []).length,
            risksCount: (res.risks || []).length,
            summaryLength: typeof res.summary === 'string' ? res.summary.length : 0
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'create_task': {
        const hasTaskId = typeof res.taskId === 'string' && res.taskId.length > 0;
        if (!hasTaskId) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: 'Created task persisted with unique identifier (taskId)',
            actualOutcome: 'Task creation response missing valid taskId',
            evidence: { res },
            failureReason: 'Task was not persisted in database or returned no taskId',
            canRetry: false // Non-idempotent task creation: do not blindly retry without check
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Task persisted with taskId '${res.taskId}' and title '${res.title || resolvedArgs.title || ''}'`,
          actualOutcome: `Task successfully created and stored with ID ${res.taskId}`,
          evidence: {
            taskId: res.taskId,
            title: res.title,
            priority: res.priority,
            createdAt: res.createdAt
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'update_task': {
        const hasTaskId = typeof res.taskId === 'string' && res.taskId.length > 0;
        const idMatches = !resolvedArgs.taskId || res.taskId === resolvedArgs.taskId;
        const statusMatches = !resolvedArgs.status || res.updatedStatus === resolvedArgs.status;

        if (!hasTaskId || !idMatches || !statusMatches) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: `Task '${resolvedArgs.taskId}' updated to status '${resolvedArgs.status}'`,
            actualOutcome: `Updated task '${res.taskId}' status is '${res.updatedStatus}'`,
            evidence: { res, resolvedArgs },
            failureReason: 'Updated task record does not match requested taskId or status',
            canRetry: true
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Task '${res.taskId}' status confirmed as '${res.updatedStatus}'`,
          actualOutcome: `Task updated successfully to status '${res.updatedStatus}'`,
          evidence: {
            taskId: res.taskId,
            updatedStatus: res.updatedStatus,
            updatedAt: res.updatedAt
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'get_task_status': {
        const hasTotal = typeof res.totalTasks === 'number';
        const hasTasksList = Array.isArray(res.tasks);

        if (!hasTotal || !hasTasksList) {
          return {
            isVerified: false,
            status: 'inconclusive',
            expectedOutcome: 'Task status inspection returns totalTasks count and tasks array',
            actualOutcome: 'Missing totalTasks or tasks list in response',
            evidence: { res },
            failureReason: 'Task status response does not satisfy expected schema',
            canRetry: true
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Read-back confirmed ${res.totalTasks} mission tasks (${res.completedTasks || 0} completed)`,
          actualOutcome: `Retrieved status for ${res.tasks.length} tasks`,
          evidence: {
            missionId: res.missionId,
            totalTasks: res.totalTasks,
            completedTasks: res.completedTasks,
            taskStatuses: res.tasks.map((t: any) => ({ id: t.taskId, status: t.status }))
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'detect_conflict': {
        const hasConflictsField = typeof res.hasConflicts === 'boolean' || Array.isArray(res.conflicts);
        if (!hasConflictsField) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: 'Conflict evaluation returns boolean hasConflicts and conflicts array',
            actualOutcome: 'Response missing conflict assessment fields',
            evidence: { res },
            failureReason: 'Conflict detection returned invalid structure',
            canRetry: true
          };
        }

        const conflictCount = Array.isArray(res.conflicts) ? res.conflicts.length : 0;
        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: 'Schedule and prerequisite conflicts assessed',
          actualOutcome: `Conflict check completed (${conflictCount} conflicts identified)`,
          evidence: {
            hasConflicts: res.hasConflicts ?? (conflictCount > 0),
            conflictCount,
            conflicts: res.conflicts || []
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'verify_action': {
        const isValid = res.isValid === true;
        const hasFingerprint = typeof res.actionFingerprint === 'string' && res.actionFingerprint.length === 64;

        if (!isValid || !hasFingerprint) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: 'Action validity verified with 64-character SHA-256 fingerprint',
            actualOutcome: `isValid: ${res.isValid}, fingerprint: ${res.actionFingerprint || 'none'}`,
            evidence: { res },
            failureReason: 'Action verification failed policy constraints or lacked cryptographic fingerprint',
            canRetry: false
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Action '${res.actionType}' validated with fingerprint ${res.actionFingerprint.substring(0, 12)}...`,
          actualOutcome: `Security gate verified action (approvalRequired: ${!!res.approvalRequired})`,
          evidence: {
            actionType: res.actionType,
            actionFingerprint: res.actionFingerprint,
            approvalRequired: res.approvalRequired,
            policyEnforcedBy: res.policyEnforcedBy
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'validate_result': {
        const isComplete = res.isComplete === true || res.isValid === true;
        const score = typeof res.confidenceScore === 'number' ? res.confidenceScore : 0;

        if (!isComplete || score < 0.8) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: 'Holistic result validation complete with confidence score >= 0.80',
            actualOutcome: `isComplete: ${isComplete}, confidenceScore: ${score}`,
            evidence: { res },
            failureReason: `Result validation below acceptable confidence threshold (${score} < 0.80)`,
            canRetry: false
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Deliverables verified against goal with confidence ${(score * 100).toFixed(0)}%`,
          actualOutcome: `Validation passed (confidence score: ${score})`,
          evidence: {
            confidenceScore: score,
            satisfiedCount: (res.satisfiedRequirements || []).length,
            unsatisfiedCount: (res.unsatisfiedRequirements || []).length
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'get_conversation_context': {
        const hasContext = res.context && typeof res.context === 'object';
        if (!hasContext) {
          return {
            isVerified: false,
            status: 'inconclusive',
            expectedOutcome: 'Conversation and meeting context retrieved',
            actualOutcome: 'Missing context object in response',
            evidence: { res },
            failureReason: 'Context retrieval returned empty or malformed context object',
            canRetry: true
          };
        }

        const keys = Object.keys(res.context);
        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Context memory retrieved for ${keys.length} keys`,
          actualOutcome: `Retrieved context keys: ${keys.join(', ')}`,
          evidence: { contextKeys: keys },
          failureReason: null,
          canRetry: false
        };
      }

      case 'save_context': {
        const hasKey = typeof res.savedKey === 'string' && res.savedKey.length > 0;
        const keyMatches = !resolvedArgs.key || res.savedKey === resolvedArgs.key;

        if (!hasKey || !keyMatches) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: `Context entity saved under key '${resolvedArgs.key}'`,
            actualOutcome: `Saved key was '${res.savedKey}'`,
            evidence: { res },
            failureReason: 'Saved context entity did not match target key',
            canRetry: true
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Context saved under key '${res.savedKey}'`,
          actualOutcome: `Context entity persisted at ${res.timestamp}`,
          evidence: { savedKey: res.savedKey, timestamp: res.timestamp },
          failureReason: null,
          canRetry: false
        };
      }

      case 'calendar_read_events': {
        const hasEventsList = Array.isArray(res.events) || res.event || res.eventsCount !== undefined || res.is_local_demo;
        if (!hasEventsList) {
          return {
            isVerified: false,
            status: 'inconclusive',
            expectedOutcome: 'Calendar schedule events read from calendar store',
            actualOutcome: 'No events list or calendar record found',
            evidence: { res },
            failureReason: 'Calendar events read returned empty or invalid structure',
            canRetry: true
          };
        }

        const count = Array.isArray(res.events) ? res.events.length : 1;
        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Calendar events retrieved for requested timeframe (found ${count})`,
          actualOutcome: `Calendar events identified: ${count} event(s)`,
          evidence: {
            eventCount: count,
            events: res.events || (res.event ? [res.event] : [])
          },
          failureReason: null,
          canRetry: false
        };
      }

      case 'calendar_create_reminder': {
        const hasConfirmation = res.reminderCreated === true || res.reminderId || res.status === 'confirmed' || res.reminder;
        if (!hasConfirmation) {
          return {
            isVerified: false,
            status: 'failed',
            expectedOutcome: 'Reminder scheduled with confirmed reminder ID or confirmation status',
            actualOutcome: 'Missing reminder confirmation in response',
            evidence: { res },
            failureReason: 'Calendar reminder was not confirmed by the calendar service',
            canRetry: false // Consequential: avoid duplicate reminders without verification
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: 'Meeting reminder scheduled and confirmed',
          actualOutcome: `Reminder successfully confirmed (ID: ${res.reminderId || 'confirmed'})`,
          evidence: {
            reminderId: res.reminderId || 'confirmed',
            scheduledTime: res.scheduledTime || res.time,
            approvalVerified: !!approvalRow
          },
          failureReason: null,
          canRetry: false
        };
      }

      default: {
        // External provider tools or general MCP tools
        const isProvider = /^(gmail_|google_calendar_|google_drive_|github_)/.test(task.tool_name);
        if (isProvider) {
          if (res.providerResponseReceived === true || res.success === true || (res.id && !res.error)) {
            return {
              isVerified: true,
              status: 'verified',
              expectedOutcome: `Authoritative external provider response from ${task.tool_name}`,
              actualOutcome: `Provider responded successfully and securely`,
              evidence: { providerVerified: true, toolName: task.tool_name },
              failureReason: null,
              canRetry: false
            };
          } else {
            return {
              isVerified: false,
              status: 'failed',
              expectedOutcome: `Successful response from external provider ${task.tool_name}`,
              actualOutcome: 'Provider response indicates failure or unauthenticated state',
              evidence: { res },
              failureReason: `External provider call failed: ${res.error || 'Provider rejected request'}`,
              canRetry: true
            };
          }
        }

        // Generic tool check: ensure non-empty object with at least one key
        const keys = Object.keys(res);
        if (keys.length === 0) {
          return {
            isVerified: false,
            status: 'inconclusive',
            expectedOutcome: `Execution of ${task.tool_name} produces structured output fields`,
            actualOutcome: 'Tool returned empty object',
            evidence: {},
            failureReason: 'Insufficient evidence: tool returned an empty payload',
            canRetry: true
          };
        }

        return {
          isVerified: true,
          status: 'verified',
          expectedOutcome: `Execution of ${task.tool_name} produces structured output fields`,
          actualOutcome: `Tool executed returning fields: ${keys.slice(0, 5).join(', ')}`,
          evidence: { fields: keys },
          failureReason: null,
          canRetry: false
        };
      }
    }
  }
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
