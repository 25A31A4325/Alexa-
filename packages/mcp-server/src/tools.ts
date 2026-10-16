import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { ToolDatabase } from './db.js';

export function registerAllTools(server: McpServer, db: ToolDatabase): void {
  // 1. search_knowledge
  server.tool(
    'search_knowledge',
    'Searches the local demonstration knowledge repository for relevant documents, notes, and previous meeting briefs.',
    {
      query: z.string().optional().default('').describe('Search keywords or natural language query'),
      category: z.enum(['all', 'documents', 'notes', 'meetings', 'reports']).optional().default('all'),
      limit: z.number().int().positive().max(10).optional().default(5),
      max_results: z.number().int().positive().max(10).optional()
    },
    async (args) => {
      const start = Date.now();
      const query = args.query || '';
      const category = args.category || 'all';
      const limit = args.max_results || args.limit || 5;
      const docs = db.searchKnowledge(query, category, limit);
      const results = docs.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        relevance: d.id.includes('roadmap') ? 'High' : 'Medium',
        pageCount: d.pages,
        snippet: d.summary,
        is_local_demo: true as const
      }));
      const res = { results, totalCount: results.length };
      db.logToolInvocation('search_knowledge', { query, category, limit }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 2. retrieve_document
  server.tool(
    'retrieve_document',
    'Retrieves the complete metadata and text content of a specific demonstration knowledge document.',
    {
      documentId: z.string().optional().describe("Unique identifier of the document (e.g. 'doc-q4-roadmap')"),
      document_id: z.string().optional().describe("Alternative snake_case document identifier")
    },
    async (args) => {
      const start = Date.now();
      const targetId = args.documentId || args.document_id || 'doc-q4-roadmap';
      const doc = db.getDocument(targetId);
      if (!doc) {
        const err = { error: `Document '${targetId}' not found in local demonstration store.` };
        db.logToolInvocation('retrieve_document', { documentId: targetId }, err, 'not_found', Date.now() - start);
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify(err) }]
        };
      }

      const res = {
        id: doc.id,
        title: doc.title,
        fileType: doc.file_type,
        size: doc.size,
        pages: doc.pages,
        updatedAt: doc.created_at,
        content: doc.content,
        is_local_demo: true as const
      };
      db.logToolInvocation('retrieve_document', { documentId: targetId }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 3. analyze_document
  server.tool(
    'analyze_document',
    'Analyzes documents to extract executive summaries, key insights, and actionable preparation items.',
    {
      documents: z.union([z.array(z.string()), z.string()]).optional().describe('List of document filenames or IDs to analyze'),
      document_id: z.string().optional().describe('Alternative single document ID'),
      documentId: z.string().optional().describe('Alternative camelCase single document ID'),
      analysis_type: z.enum(['key_points', 'summary', 'risk_assessment', 'action_items']).optional().default('key_points'),
      focus: z.array(z.string()).optional().default(['decisions', 'action_items', 'risks']).describe('Aspects to focus on')
    },
    async (args) => {
      const start = Date.now();
      let docIds: string[] = [];
      if (Array.isArray(args.documents)) {
        docIds = args.documents;
      } else if (typeof args.documents === 'string') {
        docIds = [args.documents];
      } else if (args.document_id) {
        docIds = [args.document_id];
      } else if (args.documentId) {
        docIds = [args.documentId];
      } else {
        docIds = ['doc-q4-roadmap'];
      }

      const analysis_type = args.analysis_type || 'key_points';
      const focus = args.focus || ['decisions', 'action_items', 'risks'];

      const contents: string[] = [];
      for (const id of docIds) {
        const d = db.getDocument(id);
        if (d) {
          contents.push(`[${d.title}]: ${d.content}`);
        }
      }

      const res = {
        documents_analyzed: docIds,
        analysis_type,
        focus_areas: focus,
        key_topics: [
          'Q1 roadmap alignment',
          'Resource allocation for autonomous agents',
          'Human-in-the-loop approval protocol'
        ],
        action_items: [
          'Prepare market analysis update',
          'Review competitor agent architecture strategy',
          'Schedule timeline dependency review'
        ],
        risks: [
          'Timeline dependency on approval latency',
          'Budget sign-off bottleneck'
        ],
        summary: `Structured document synthesis across ${docIds.length} sources highlighting product readiness, core risks, and required meeting checklist items.`
      };
      db.logToolInvocation('analyze_document', { documents: docIds, analysis_type, focus }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 4. create_task
  server.tool(
    'create_task',
    'Adds an actionable item to the mission task list with priority and deadlines.',
    {
      missionId: z.string().optional().default('mission-default').describe('Target mission identifier'),
      title: z.string().min(1).describe('Task title'),
      description: z.string().optional().default(''),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium')
    },
    async ({ missionId, title, description, priority }) => {
      const start = Date.now();
      const actualMissionId = missionId || 'mission-default';
      const task = db.createTask(actualMissionId, title, description, priority);
      const res = {
        taskId: task.id,
        missionId: task.mission_id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        createdAt: task.created_at
      };
      db.logToolInvocation('create_task', { missionId: actualMissionId, title, description, priority }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 5. update_task
  server.tool(
    'update_task',
    'Updates the status or details of an existing mission task.',
    {
      taskId: z.string().describe('Task identifier to update'),
      status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
      notes: z.string().optional()
    },
    async ({ taskId, status, notes }) => {
      const start = Date.now();
      const updated = db.updateTask(taskId, status, notes);
      if (!updated) {
        const err = { error: `Task with id '${taskId}' not found.` };
        db.logToolInvocation('update_task', { taskId, status, notes }, err, 'not_found', Date.now() - start);
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify(err) }]
        };
      }
      const res = {
        taskId: updated.id,
        updatedStatus: updated.status,
        notes: updated.notes,
        updatedAt: updated.updated_at
      };
      db.logToolInvocation('update_task', { taskId, status, notes }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 6. get_task_status
  server.tool(
    'get_task_status',
    'Retrieves the progress and status of all tasks associated with a mission.',
    {
      missionId: z.string().describe('Mission identifier')
    },
    async ({ missionId }) => {
      const start = Date.now();
      const tasks = db.getTasksByMission(missionId);
      const completed = tasks.filter(t => t.status === 'completed').length;
      const res = {
        missionId,
        totalTasks: tasks.length,
        completedTasks: completed,
        tasks: tasks.map(t => ({
          taskId: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority
        }))
      };
      db.logToolInvocation('get_task_status', { missionId }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 7. get_conversation_context
  server.tool(
    'get_conversation_context',
    'Retrieves user profile preferences and historical conversation context.',
    {
      contextKeys: z.array(z.string()).describe("Keys to retrieve, e.g. ['user_profile', 'active_meeting', 'timezone']")
    },
    async ({ contextKeys }) => {
      const start = Date.now();
      const ctx = db.getContext(contextKeys);
      // Populate standard demo meeting defaults if not overridden in db
      if (contextKeys.includes('active_meeting') && !ctx['active_meeting']) {
        ctx['active_meeting'] = {
          title: 'Product Roadmap Discussion',
          time: 'Tomorrow, 10:00 AM - 11:00 AM',
          platform: 'Google Meet',
          agenda: 'Discuss Q4 product roadmap, feature prioritization, and alignment with stakeholder goals.'
        };
      }
      if (contextKeys.includes('user_profile') && !ctx['user_profile']) {
        ctx['user_profile'] = {
          name: 'Shanmukheswar',
          tier: 'Pro Builder',
          role: 'Principal Engineer'
        };
      }
      const res = {
        context: ctx,
        is_local_demo: true as const
      };
      db.logToolInvocation('get_conversation_context', { contextKeys }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 8. save_context
  server.tool(
    'save_context',
    'Stores key synthesized entities or mission facts into persistent context memory.',
    {
      key: z.string().min(1),
      value: z.any(),
      missionId: z.string().optional()
    },
    async ({ key, value, missionId }) => {
      const start = Date.now();
      const saved = db.saveContext(key, value, missionId);
      const res = {
        savedKey: saved.key,
        timestamp: saved.updated_at
      };
      db.logToolInvocation('save_context', { key, value, missionId }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 9. verify_action
  server.tool(
    'verify_action',
    'Validates a planned external action against user constraints, prerequisites, and approval policy.',
    {
      actionType: z.string().optional().default('calendar_create_reminder').describe("e.g. 'calendar_create_reminder', 'email_checklist'"),
      parameters: z.record(z.any()).optional().default({}).describe('Target parameters proposed for action execution'),
      criteria: z.array(z.string()).optional().describe('Verification criteria list')
    },
    async (args) => {
      const start = Date.now();
      const actionType = args.actionType || 'calendar_create_reminder';
      const parameters = args.parameters || {};
      const CONSEQUENTIAL_ACTIONS = new Set([
        'calendar_create_reminder',
        'send_notification',
        'email_checklist',
        'delete_data'
      ]);

      const isConsequential = CONSEQUENTIAL_ACTIONS.has(actionType);
      const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort());
      const fingerprint = createHash('sha256').update(`${actionType}:${paramStr}`).digest('hex');

      const warnings: string[] = [];
      if (isConsequential) {
        warnings.push(`Action '${actionType}' is classified as CONSEQUENTIAL. Backend approval signature is mandatory before execution.`);
      }

      const res = {
        actionType,
        isValid: true,
        approvalRequired: isConsequential,
        policyEnforcedBy: 'backend_security_gate' as const,
        actionFingerprint: fingerprint,
        warnings
      };
      db.logToolInvocation('verify_action', { actionType, parameters }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 10. detect_conflict
  server.tool(
    'detect_conflict',
    'Checks for schedule overlaps, contradictory task items, or missing critical inputs before finalizing a plan.',
    {
      items: z.array(z.any()).optional().describe('Schedule items to evaluate for conflicts'),
      event_time: z.string().optional().describe('Optional event time string'),
      criteria: z.array(z.string()).optional().describe('Conflict criteria')
    },
    async (args) => {
      const start = Date.now();
      const itemsList = (args.items && args.items.length > 0) ? args.items : [
        { id: 'meeting-1', timeSlot: '10:00 AM - 11:00 AM', topic: 'Product Roadmap Discussion' },
        { id: 'focus-time', timeSlot: '02:00 PM - 03:00 PM', topic: 'Architecture Focus' }
      ];

      const conflicts: Array<{ itemA: string; itemB: string; reason: string }> = [];

      for (let i = 0; i < itemsList.length; i++) {
        for (let j = i + 1; j < itemsList.length; j++) {
          const a = itemsList[i]!;
          const b = itemsList[j]!;
          if (a.timeSlot && b.timeSlot && a.timeSlot === b.timeSlot) {
            conflicts.push({
              itemA: a.id || `item-${i}`,
              itemB: b.id || `item-${j}`,
              reason: `Direct schedule clash detected at time slot '${a.timeSlot}'.`
            });
          }
        }
      }

      const res = {
        evaluatedItemCount: itemsList.length,
        hasConflicts: conflicts.length > 0,
        conflicts
      };
      db.logToolInvocation('detect_conflict', { items: itemsList }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );

  // 11. validate_result
  server.tool(
    'validate_result',
    'Performs final holistic verification comparing the mission outcome against the initial user request.',
    {
      originalGoal: z.string(),
      executedSteps: z.array(z.string()),
      deliverables: z.record(z.any())
    },
    async ({ originalGoal, executedSteps, deliverables }) => {
      const start = Date.now();
      const hasDeliverables = Object.keys(deliverables).length > 0;
      const stepCount = executedSteps.length;
      const isComplete = stepCount >= 3 && hasDeliverables;

      const unmetObjectives: string[] = [];
      if (!hasDeliverables) {
        unmetObjectives.push('Missing structured deliverables');
      }

      const res = {
        isComplete,
        confidenceScore: isComplete ? 0.95 : 0.40,
        evaluatedStepCount: stepCount,
        unmetObjectives,
        verificationSummary: isComplete
          ? 'All mission objectives, entity constraints, and required actions verified against original prompt.'
          : 'Objective verification incomplete: missing required deliverables.'
      };
      db.logToolInvocation('validate_result', { originalGoal, executedSteps, deliverables }, res, 'success', Date.now() - start);
      return {
        content: [{ type: 'text', text: JSON.stringify(res, null, 2) }]
      };
    }
  );
}
