import { ObjectiveUnderstanding } from './understanding.js';

export interface PlannedTask {
  id: string;
  stepIndex: number;
  title: string;
  description: string;
  toolName: string;
  toolInputTemplate: Record<string, unknown>;
  dependsOn: string[];
  requiresApproval: boolean;
  maxRetries: number;
}

export interface ExecutionPlan {
  planId: string;
  missionId: string;
  tasks: PlannedTask[];
}

export class MissionPlanner {
  public createPlan(missionId: string, understanding: ObjectiveUnderstanding): ExecutionPlan {
    const planId = `plan-${missionId}-${Date.now()}`;
    const tasks: PlannedTask[] = [];

    const isMeetingPrep = understanding.originalObjective.toLowerCase().includes('meeting');

    if (isMeetingPrep) {
      // 1. Context retrieval
      tasks.push({
        id: `task-${missionId}-1`,
        stepIndex: 1,
        title: 'Check calendar and meeting details',
        description: 'Retrieve scheduled meeting metadata from context store',
        toolName: 'get_conversation_context',
        toolInputTemplate: { contextKeys: ['active_meeting', 'user_profile'] },
        dependsOn: [],
        requiresApproval: false,
        maxRetries: 2
      });

      // 2. Search knowledge
      tasks.push({
        id: `task-${missionId}-2`,
        stepIndex: 2,
        title: 'Identify attendee profiles and agenda requirements',
        description: 'Search demonstration knowledge base for meeting roadmap docs',
        toolName: 'search_knowledge',
        toolInputTemplate: { query: 'Roadmap', limit: 3 },
        dependsOn: [`task-${missionId}-1`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 3. Retrieve document
      tasks.push({
        id: `task-${missionId}-3`,
        stepIndex: 3,
        title: 'Search knowledge base for Q4 Product Roadmap',
        description: 'Fetch complete content of Q4 Product Roadmap brief',
        toolName: 'retrieve_document',
        toolInputTemplate: { documentId: 'doc-q4-roadmap' },
        dependsOn: [`task-${missionId}-2`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 4. Analyze document
      tasks.push({
        id: `task-${missionId}-4`,
        stepIndex: 4,
        title: 'Analyze document content, decisions, and risk items',
        description: 'Synthesize document key topics, action items, and risks',
        toolName: 'analyze_document',
        toolInputTemplate: {
          documents: ['doc-q4-roadmap'],
          analysis_type: 'key_points',
          focus: ['decisions', 'action_items', 'risks']
        },
        dependsOn: [`task-${missionId}-3`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 5. Detect conflicts
      tasks.push({
        id: `task-${missionId}-5`,
        stepIndex: 5,
        title: 'Run conflict detection',
        description: 'Verify meeting time slot and schedule alignment',
        toolName: 'detect_conflict',
        toolInputTemplate: {
          items: [
            { id: 'meeting-1', timeSlot: '10:00 AM - 11:00 AM', topic: 'Product Roadmap Discussion' },
            { id: 'focus-time', timeSlot: '02:00 PM - 03:00 PM', topic: 'Architecture Focus' }
          ]
        },
        dependsOn: [`task-${missionId}-1`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 6. Create preparation checklist task
      tasks.push({
        id: `task-${missionId}-6`,
        stepIndex: 6,
        title: 'Create prioritized preparation checklist',
        description: 'Persist action items as formal tasks for meeting readiness',
        toolName: 'create_task',
        toolInputTemplate: {
          missionId,
          title: 'Review Q4 Feature Specs and APAC Strategy',
          description: 'Preparation items extracted from roadmap analysis',
          priority: 'high'
        },
        dependsOn: [`task-${missionId}-4`, `task-${missionId}-5`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 7. Verify proposed consequential reminder action
      tasks.push({
        id: `task-${missionId}-7`,
        stepIndex: 7,
        title: 'Propose meeting reminder action',
        description: 'Evaluate policy and request human approval for scheduled reminder',
        toolName: 'verify_action',
        toolInputTemplate: {
          actionType: 'calendar_create_reminder',
          parameters: {
            title: 'Prep for Product Roadmap Discussion',
            reminderTime: 'Tomorrow at 09:30 AM'
          }
        },
        dependsOn: [`task-${missionId}-6`],
        requiresApproval: true,
        maxRetries: 1
      });
    } else {
      const lower = understanding.originalObjective.toLowerCase();
      const docId = lower.includes('trend') || lower.includes('data')
        ? 'doc-market-trends'
        : lower.includes('competitor')
          ? 'doc-competitor-analysis'
          : 'doc-q4-roadmap';

      // 1. Context retrieval
      tasks.push({
        id: `task-${missionId}-1`,
        stepIndex: 1,
        title: 'Retrieve mission and user context',
        description: 'Load user profile and relevant active memory context',
        toolName: 'get_conversation_context',
        toolInputTemplate: { contextKeys: ['user_profile', 'active_meeting'] },
        dependsOn: [],
        requiresApproval: false,
        maxRetries: 2
      });

      // 2. Search knowledge
      tasks.push({
        id: `task-${missionId}-2`,
        stepIndex: 2,
        title: 'Search knowledge repository',
        description: 'Locate relevant documents, briefs, and historical data',
        toolName: 'search_knowledge',
        toolInputTemplate: { query: understanding.originalObjective.substring(0, 40), limit: 3 },
        dependsOn: [`task-${missionId}-1`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 3. Retrieve document
      tasks.push({
        id: `task-${missionId}-3`,
        stepIndex: 3,
        title: 'Retrieve document content',
        description: `Fetch complete text and structure of ${docId}`,
        toolName: 'retrieve_document',
        toolInputTemplate: { documentId: docId },
        dependsOn: [`task-${missionId}-2`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 4. Analyze document
      tasks.push({
        id: `task-${missionId}-4`,
        stepIndex: 4,
        title: 'Analyze content, risks, and findings',
        description: 'Extract key points, insights, and actionable items',
        toolName: 'analyze_document',
        toolInputTemplate: {
          documents: [docId],
          analysis_type: 'key_points',
          focus: ['decisions', 'action_items', 'risks']
        },
        dependsOn: [`task-${missionId}-3`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 5. Detect conflicts
      tasks.push({
        id: `task-${missionId}-5`,
        stepIndex: 5,
        title: 'Assess schedule & prerequisite conflicts',
        description: 'Verify timeline alignment and check prerequisite constraints',
        toolName: 'detect_conflict',
        toolInputTemplate: {
          items: [
            { id: 'agenda-item-1', timeSlot: '10:00 AM - 11:00 AM', topic: 'Roadmap Execution' },
            { id: 'agenda-item-2', timeSlot: '02:00 PM - 03:00 PM', topic: 'Strategy Session' }
          ]
        },
        dependsOn: [`task-${missionId}-1`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 6. Create task
      tasks.push({
        id: `task-${missionId}-6`,
        stepIndex: 6,
        title: 'Create prioritized action plan tasks',
        description: 'Persist synthesized action items into task registry',
        toolName: 'create_task',
        toolInputTemplate: {
          missionId,
          title: `Action Plan: ${understanding.originalObjective.substring(0, 50)}`,
          description: 'Synthesized deliverables from autonomous analysis',
          priority: 'high'
        },
        dependsOn: [`task-${missionId}-4`, `task-${missionId}-5`],
        requiresApproval: false,
        maxRetries: 2
      });

      // 7. Verify proposed consequential action / notification
      const actionType = lower.includes('remind') || lower.includes('calendar') || lower.includes('day') || lower.includes('meeting')
        ? 'calendar_create_reminder'
        : lower.includes('email') || lower.includes('checklist')
          ? 'email_checklist'
          : 'send_notification';

      tasks.push({
        id: `task-${missionId}-7`,
        stepIndex: 7,
        title: actionType === 'calendar_create_reminder'
          ? 'Propose calendar reminder action'
          : actionType === 'email_checklist'
            ? 'Propose email checklist delivery'
            : 'Propose deliverable notification & export',
        description: `Evaluate policy and request human approval for ${actionType}`,
        toolName: 'verify_action',
        toolInputTemplate: {
          actionType,
          parameters: {
            title: `${understanding.originalObjective.substring(0, 45)}`,
            notificationTime: 'Immediately upon approval',
            targetChannel: 'Alexa+ Workspace Dashboard'
          }
        },
        dependsOn: [`task-${missionId}-6`],
        requiresApproval: true,
        maxRetries: 1
      });
    }

    this.validatePlan(tasks);

    return {
      planId,
      missionId,
      tasks
    };
  }

  public validatePlan(tasks: PlannedTask[]): void {
    const taskMap = new Map<string, PlannedTask>();
    for (const t of tasks) {
      taskMap.set(t.id, t);
    }

    // Verify all dependencies exist
    for (const t of tasks) {
      for (const depId of t.dependsOn) {
        if (!taskMap.has(depId)) {
          throw new Error(`Plan validation error: Task '${t.id}' depends on missing task '${depId}'.`);
        }
      }
    }

    // Detect cycles using DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (taskId: string) => {
      visited.add(taskId);
      recStack.add(taskId);

      const task = taskMap.get(taskId)!;
      for (const depId of task.dependsOn) {
        if (!visited.has(depId)) {
          dfs(depId);
        } else if (recStack.has(depId)) {
          throw new Error(`Plan validation error: Cycle detected involving task '${taskId}' and '${depId}'.`);
        }
      }

      recStack.delete(taskId);
    };

    for (const t of tasks) {
      if (!visited.has(t.id)) {
        dfs(t.id);
      }
    }
  }
}
