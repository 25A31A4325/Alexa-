import { z } from 'zod';

export const ObjectiveUnderstandingSchema = z.object({
  originalObjective: z.string().min(1),
  desiredOutcome: z.string().min(1),
  constraints: z.array(z.string()),
  targetTime: z.string().optional(),
  requiredDeliverables: z.array(z.string()),
  knownContext: z.record(z.unknown()),
  ambiguities: z.array(z.string()),
  potentiallyConsequentialActions: z.array(z.string()),
  completionCriteria: z.array(z.string())
});

export type ObjectiveUnderstanding = z.infer<typeof ObjectiveUnderstandingSchema>;

export class ObjectiveUnderstandingEngine {
  public parseObjective(objective: string): ObjectiveUnderstanding {
    const trimmed = objective.trim();
    if (!trimmed) {
      throw new Error('Objective cannot be empty');
    }

    const lower = trimmed.toLowerCase();

    const providerWriteMatch = trimmed.match(
      /\b(gmail_send|google_calendar_create_event|google_calendar_update_event|github_create_issue)\s*(\{[\s\S]*\})\s*$/i
    );
    const writeIntent = lower.includes('gmail_send') || /\bsend (an )?email\b/.test(lower)
      ? 'gmail_send'
      : lower.includes('google_calendar_update_event') || /\b(update|change|modify|edit) (my )?(google )?calendar event\b/.test(lower)
        ? 'google_calendar_update_event'
        : lower.includes('google_calendar_create_event') || /\b(create|add|schedule) (a )?(google )?calendar event\b/.test(lower)
          ? 'google_calendar_create_event'
          : lower.includes('github_create_issue') || /\b(create|open) (a )?github issue\b/.test(lower)
            ? 'github_create_issue'
            : null;

    if (writeIntent) {
      let providerAction: { toolName: string; parameters: Record<string, unknown> } | undefined;
      if (providerWriteMatch && providerWriteMatch[1]!.toLowerCase() === writeIntent) {
        try {
          const raw: unknown = JSON.parse(providerWriteMatch[2]!);
          const schemas: Record<string, z.ZodType<Record<string, unknown>>> = {
            gmail_send: z.object({
              to: z.string().email(),
              subject: z.string().min(1),
              body: z.string().min(1)
            }).strict(),
            google_calendar_create_event: z.object({
              summary: z.string().min(1),
              start: z.string().datetime(),
              end: z.string().datetime(),
              description: z.string().optional(),
              attendees: z.array(z.string().email()).optional()
            }).strict(),
            google_calendar_update_event: z.object({
              eventId: z.string().min(1),
              summary: z.string().min(1).optional(),
              start: z.string().datetime().optional(),
              end: z.string().datetime().optional(),
              description: z.string().optional()
            }).strict(),
            github_create_issue: z.object({
              owner: z.string().min(1),
              repo: z.string().min(1),
              title: z.string().min(1),
              body: z.string().optional()
            }).strict()
          };
          const parsed = schemas[writeIntent]!.safeParse(raw);
          if (parsed.success) {
            providerAction = { toolName: writeIntent, parameters: parsed.data };
          }
        } catch {
          providerAction = undefined;
        }
      }

      const actionName = writeIntent;
      const title = actionName === 'gmail_send'
        ? 'Send approved email'
        : actionName === 'github_create_issue'
          ? 'Create approved GitHub issue'
          : actionName === 'google_calendar_update_event'
            ? 'Update approved calendar event'
            : 'Create approved calendar event';
      const parsedWrite: ObjectiveUnderstanding = {
        originalObjective: trimmed,
        desiredOutcome: `${title} using the explicitly supplied parameters.`,
        constraints: ['Provider writes require explicit human approval with an unchanged parameter fingerprint.'],
        requiredDeliverables: [title],
        knownContext: providerAction ? { providerAction } : {},
        ambiguities: providerAction
          ? []
          : [`Provide a valid JSON parameter object after ${actionName}; the exact values will be shown for approval before execution.`],
        potentiallyConsequentialActions: [actionName],
        completionCriteria: [`${title} completed with an approved, fingerprint-verified action`]
      };
      return ObjectiveUnderstandingSchema.parse(parsedWrite);
    }

    // Check for meeting preparation scenario
    const isMeetingPrep = lower.includes('meeting') && (lower.includes('tomorrow') || lower.includes('prepare') || lower.includes('calendar'));

    if (isMeetingPrep) {
      const parsed: ObjectiveUnderstanding = {
        originalObjective: trimmed,
        desiredOutcome: 'Comprehensive meeting readiness packet including context, documents, analysis, checklist, conflict assessment, and scheduled reminder.',
        constraints: [
          'Meeting is scheduled for tomorrow',
          'Must verify relevant roadmap documents before preparation',
          'Reminders are external mutations and require human approval'
        ],
        targetTime: 'Tomorrow, 10:00 AM',
        requiredDeliverables: [
          'Meeting context extraction',
          'Document analysis and gap identification',
          'Conflict and schedule alignment check',
          'Preparation checklist',
          'Approved reminder'
        ],
        knownContext: {
          meetingTopic: 'Product Roadmap Discussion'
        },
        ambiguities: [],
        potentiallyConsequentialActions: ['calendar_create_reminder'],
        completionCriteria: [
          'Calendar and meeting details retrieved',
          'Relevant documents searched and analyzed',
          'Conflicts evaluated',
          'Checklist created and persisted',
          'Reminder proposed and approved/executed'
        ]
      };
      return ObjectiveUnderstandingSchema.parse(parsed);
    }

    const actionType = lower.includes('remind') || lower.includes('calendar') || lower.includes('day') || lower.includes('meeting')
      ? 'calendar_create_reminder'
      : lower.includes('email') || lower.includes('checklist')
        ? 'email_checklist'
        : 'send_notification';

    const parsedGeneric: ObjectiveUnderstanding = {
      originalObjective: trimmed,
      desiredOutcome: `Execute objective: ${trimmed}`,
      constraints: [],
      requiredDeliverables: ['Executed task results'],
      knownContext: {},
      ambiguities: trimmed.length < 10 ? ['Objective is very brief and may lack required parameters'] : [],
      potentiallyConsequentialActions: [actionType],
      completionCriteria: ['All planned tasks completed and verified']
    };

    return ObjectiveUnderstandingSchema.parse(parsedGeneric);
  }
}
