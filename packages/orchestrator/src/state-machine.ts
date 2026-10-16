import { MissionStatus } from './types.js';
import { OrchestratorDatabase } from './db.js';

const VALID_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  SUBMITTED: ['UNDERSTANDING', 'FAILED', 'CANCELLED'],
  UNDERSTANDING: ['PLANNING', 'NEEDS_CLARIFICATION', 'FAILED', 'CANCELLED'],
  NEEDS_CLARIFICATION: ['UNDERSTANDING', 'CANCELLED', 'FAILED'],
  PLANNING: ['DISCOVERING_TOOLS', 'NEEDS_CLARIFICATION', 'FAILED', 'CANCELLED'],
  DISCOVERING_TOOLS: ['EXECUTING', 'RECOVERING', 'FAILED', 'CANCELLED'],
  EXECUTING: ['EXECUTING', 'AWAITING_APPROVAL', 'RECOVERING', 'VERIFYING', 'FAILED', 'CANCELLED'],
  AWAITING_APPROVAL: ['EXECUTING_APPROVED', 'RECOVERING', 'CANCELLED', 'FAILED'],
  EXECUTING_APPROVED: ['EXECUTING', 'VERIFYING', 'RECOVERING', 'FAILED', 'CANCELLED'],
  RECOVERING: ['EXECUTING', 'PLANNING', 'FAILED', 'CANCELLED'],
  VERIFYING: ['COMPLETED', 'FAILED', 'RECOVERING', 'CANCELLED'],
  COMPLETED: [], // Terminal
  FAILED: [], // Terminal
  CANCELLED: [] // Terminal
};

export class MissionStateMachine {
  constructor(private db: OrchestratorDatabase) {}

  public canTransition(current: MissionStatus, target: MissionStatus): boolean {
    const allowed = VALID_TRANSITIONS[current];
    return allowed ? allowed.includes(target) : false;
  }

  public transition(missionId: string, target: MissionStatus, reason?: string): void {
    const mission = this.db.getMission(missionId);
    if (!mission) {
      throw new Error(`Cannot transition: mission '${missionId}' not found.`);
    }

    if (mission.status === target) {
      return; // Idempotent same-state update
    }

    if (!this.canTransition(mission.status, target)) {
      throw new Error(`Illegal state transition rejected: from '${mission.status}' to '${target}'.`);
    }

    // Persist transition
    this.db.updateMissionStatus(missionId, target, reason || null);

    this.db.recordActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      missionId,
      eventType: 'Mission',
      title: `Mission ${target}`,
      description: `Transitioned from ${mission.status} to ${target}${reason ? `: ${reason}` : ''}`,
      metadata: { from: mission.status, to: target }
    });
  }
}
