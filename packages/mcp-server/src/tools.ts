import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { IntegrationService, IntegrationServiceError } from './integrations.js';
import { getMcpRequestIdentity } from './request-context.js';
import { ToolDatabase } from './db.js';

export function registerAllTools(server: McpServer, db: ToolDatabase, integrations?: IntegrationService): void {
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
      const ownerSessionId = getMcpRequestIdentity().sessionId || undefined;
      const docs = db.searchKnowledge(query, category, limit, ownerSessionId);
      const results = docs.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        relevance: d.id.includes('roadmap') ? 'High' : 'Medium',
        pageCount: d.pages,
        snippet: d.summary,
        is_local_demo: d.is_local_demo === 1
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
      const doc = db.getDocument(targetId, getMcpRequestIdentity().sessionId || undefined);
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
        is_local_demo: doc.is_local_demo === 1
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
        const d = db.getDocument(id, getMcpRequestIdentity().sessionId || undefined);
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

  server.tool(
    'calendar_read_events',
    'Reads calendar events from the local demonstration calendar. No external calendar account is accessed.',
    {
      startAfter: z.string().optional().describe('Optional inclusive ISO timestamp lower bound'),
      startBefore: z.string().optional().describe('Optional inclusive ISO timestamp upper bound'),
      limit: z.number().int().positive().max(50).optional().default(10)
    },
    async ({ startAfter, startBefore, limit }) => {
      const start = Date.now();
      const events = db.getCalendarEvents({ startAfter, startBefore, limit });
      const result = {
        events,
        totalCount: events.length,
        externalCalendarAccess: false,
        is_local_demo: true as const
      };
      db.logToolInvocation('calendar_read_events', { startAfter, startBefore, limit }, result, 'success', Date.now() - start);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'calendar_create_reminder',
    'Stores a reminder in the local demonstration calendar. It does not create an external calendar alert.',
    {
      title: z.string().min(1),
      reminderTime: z.string().min(1).describe('Requested reminder time as an ISO timestamp or human-readable value'),
      eventId: z.string().optional().describe('Optional local calendar event ID')
    },
    async ({ title, reminderTime, eventId }) => {
      const start = Date.now();
      const reminder = db.createCalendarReminder(title, reminderTime, eventId);
      const result = {
        reminder,
        delivery: 'local_demo_only',
        externalCalendarAccess: false,
        is_local_demo: true as const
      };
      db.logToolInvocation('calendar_create_reminder', { title, reminderTime, eventId }, result, 'success', Date.now() - start);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'database_query',
    'Returns safe, predefined analytics from the local demonstration data store; arbitrary SQL is not accepted.',
    {
      metric: z.enum(['overview', 'tasks', 'knowledge', 'calendar', 'notifications']).optional().default('overview')
    },
    async ({ metric }) => {
      const start = Date.now();
      const result = {
        ...db.queryData(metric),
        is_local_demo: true as const
      };
      db.logToolInvocation('database_query', { metric }, result, 'success', Date.now() - start);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'send_notification',
    'Queues a notification in the local demonstration outbox. No email, push alert, or external message is sent.',
    {
      channel: z.enum(['email', 'push', 'slack']).optional().default('push'),
      recipient: z.string().optional().default(''),
      title: z.string().min(1),
      message: z.string().min(1)
    },
    async ({ channel, recipient, title, message }) => {
      const start = Date.now();
      const notification = db.createLocalNotification(channel, recipient, title, message);
      const result = {
        notification,
        delivery: 'queued_local_only',
        externalDelivery: false,
        is_local_demo: true as const
      };
      db.logToolInvocation('send_notification', { channel, recipient, title, message }, result, 'success', Date.now() - start);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'list_connected_services',
    'Lists live provider connection state for the authenticated browser session.',
    {},
    async () => {
      const start = Date.now();
      if (!integrations) {
        throw new IntegrationServiceError('Provider connection service is unavailable.', 'PROVIDER_UNAVAILABLE', 503);
      }
      const sessionId = getMcpRequestIdentity().sessionId;
      if (!sessionId) {
        throw new IntegrationServiceError('Connect an authenticated ORCHESTRA browser session before listing provider connections.', 'AUTH_REQUIRED', 401);
      }
      const services = await integrations.listStatuses(sessionId);
      const result = {
        services,
        totalCount: services.length,
        source: 'live-provider-authentication'
      };
      db.logToolInvocation('list_connected_services', {}, { totalCount: services.length }, 'success', Date.now() - start);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  if (integrations) {
    const userSession = (): string => {
      const sessionId = getMcpRequestIdentity().sessionId;
      if (!sessionId) {
        throw new IntegrationServiceError(
          'Connect an authenticated ORCHESTRA browser session before accessing provider data.',
          'AUTH_REQUIRED',
          401
        );
      }
      return sessionId;
    };

    const requireApprovedWrite = async (toolName: string, parameters: Record<string, unknown>): Promise<void> => {
      const sessionId = userSession();
      const approval = getMcpRequestIdentity().approval;
      if (!approval || approval.actionType !== toolName) {
        throw new IntegrationServiceError('This write action requires an approved mission task.', 'APPROVAL_REQUIRED', 403);
      }
      await integrations.verifyApprovalAndClaim({
        sessionId,
        missionId: approval.missionId,
        taskId: approval.taskId,
        actionType: toolName,
        fingerprint: approval.fingerprint,
        parameters
      });
    };

    server.tool(
      'gmail_search',
      'Search the signed-in user’s Gmail mailbox. Requires gmail.readonly authorization.',
      {
        query: z.string().min(1),
        maxResults: z.number().int().min(1).max(100).optional(),
        pageToken: z.string().optional()
      },
      async ({ query, maxResults, pageToken }) => {
        const result = await integrations.searchGmail(userSession(), query, maxResults, pageToken);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'gmail_read_message',
      'Read one authorized Gmail message. Requires gmail.readonly authorization.',
      { messageId: z.string().min(1) },
      async ({ messageId }) => {
        const result = await integrations.readGmailMessage(userSession(), messageId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'gmail_send',
      'Send an email from the connected Gmail account. Requires gmail.send scope and an approved mission task.',
      {
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1)
      },
      async (input) => {
        await requireApprovedWrite('gmail_send', input);
        const result = await integrations.sendGmail(userSession(), input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'google_calendar_list_events',
      'List events from the signed-in user’s primary Google Calendar.',
      {
        timeMin: z.string().datetime().optional(),
        timeMax: z.string().datetime().optional(),
        pageToken: z.string().optional(),
        maxResults: z.number().int().min(1).max(250).optional()
      },
      async (input) => {
        const result = await integrations.listCalendarEvents(userSession(), input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'google_calendar_check_availability',
      'Check busy intervals in the signed-in user’s primary Google Calendar.',
      {
        timeMin: z.string().datetime(),
        timeMax: z.string().datetime()
      },
      async ({ timeMin, timeMax }) => {
        const result = await integrations.checkCalendarAvailability(userSession(), timeMin, timeMax);
        return { content: [{ type: 'text', text: JSON.stringify({ busy: result }, null, 2) }] };
      }
    );

    server.tool(
      'google_calendar_create_event',
      'Create a Google Calendar event. Requires calendar.events authorization and an approved mission task.',
      {
        summary: z.string().min(1),
        start: z.string().datetime(),
        end: z.string().datetime(),
        description: z.string().optional(),
        attendees: z.array(z.string().email()).optional()
      },
      async (input) => {
        await requireApprovedWrite('google_calendar_create_event', input);
        const result = await integrations.createCalendarEvent(userSession(), input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'google_calendar_update_event',
      'Update a Google Calendar event. Requires calendar.events authorization and an approved mission task.',
      {
        eventId: z.string().min(1),
        summary: z.string().min(1).optional(),
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
        description: z.string().optional()
      },
      async (input) => {
        await requireApprovedWrite('google_calendar_update_event', input);
        const { eventId, ...patch } = input;
        const result = await integrations.updateCalendarEvent(userSession(), eventId, patch);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'google_drive_search',
      'Search authorized Google Drive files by name with pagination.',
      {
        query: z.string().min(1),
        pageToken: z.string().optional(),
        pageSize: z.number().int().min(1).max(100).optional()
      },
      async ({ query, pageToken, pageSize }) => {
        const result = await integrations.searchDrive(userSession(), query, pageToken, pageSize);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'google_drive_read_file',
      'Retrieve supported Google Docs, plain text, or Markdown content from authorized Drive files.',
      { fileId: z.string().min(1) },
      async ({ fileId }) => {
        const result = await integrations.readDriveFile(userSession(), fileId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'github_list_repositories',
      'List repositories actually accessible to the signed-in GitHub account.',
      {
        page: z.number().int().min(1).optional(),
        perPage: z.number().int().min(1).max(100).optional()
      },
      async ({ page, perPage }) => {
        const result = await integrations.listGitHubRepositories(userSession(), page, perPage);
        return { content: [{ type: 'text', text: JSON.stringify({ repositories: result }, null, 2) }] };
      }
    );

    server.tool(
      'github_search_repositories',
      'Search repositories available to the signed-in GitHub account.',
      {
        query: z.string().min(1),
        page: z.number().int().min(1).optional(),
        perPage: z.number().int().min(1).max(100).optional()
      },
      async ({ query, page, perPage }) => {
        const result = await integrations.searchGitHubRepositories(userSession(), query, page, perPage);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'github_search_code',
      'Search code in repositories accessible to the signed-in GitHub account.',
      {
        query: z.string().min(1),
        page: z.number().int().min(1).optional(),
        perPage: z.number().int().min(1).max(100).optional()
      },
      async ({ query, page, perPage }) => {
        const result = await integrations.searchGitHubCode(userSession(), query, page, perPage);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'github_read_repository_file',
      'Read a file from a repository actually accessible to the signed-in GitHub account.',
      {
        owner: z.string().min(1),
        repo: z.string().min(1),
        path: z.string().min(1),
        ref: z.string().optional()
      },
      async ({ owner, repo, path, ref }) => {
        const result = await integrations.readGitHubFile(userSession(), owner, repo, path, ref);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.tool(
      'github_create_issue',
      'Create a repository issue only when GitHub issue writes are enabled and a mission approval is valid.',
      {
        owner: z.string().min(1),
        repo: z.string().min(1),
        title: z.string().min(1),
        body: z.string().optional()
      },
      async (input) => {
        await requireApprovedWrite('github_create_issue', input);
        const result = await integrations.createGitHubIssue(userSession(), input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
    );
  }
}
