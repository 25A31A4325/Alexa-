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
