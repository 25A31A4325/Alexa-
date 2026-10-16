export type MissionStatus =
  | 'SUBMITTED'
  | 'UNDERSTANDING'
  | 'NEEDS_CLARIFICATION'
  | 'PLANNING'
  | 'DISCOVERING_TOOLS'
  | 'EXECUTING'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING_APPROVED'
  | 'RECOVERING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled' | 'superseded';

export interface MissionRow {
  id: string;
  goal: string;
  status: MissionStatus;
  understanding_json: string | null;
  clarification_prompt: string | null;
  lock_worker_id: string | null;
  lock_expires_at: number | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface ExecutionPlanRow {
  id: string;
  mission_id: string;
  version: number;
  created_at: string;
}

export interface MissionTaskRow {
  id: string;
  mission_id: string;
  plan_id: string;
  step_index: number;
  title: string;
  description: string;
  tool_name: string;
  tool_input_template: string;
  status: TaskStatus;
  retry_count: number;
  max_retries: number;
  requires_approval: number; // 0 or 1
  approval_id: string | null;
  result_json: string | null;
  error_message: string | null;
  duration_ms: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDependencyRow {
  task_id: string;
  depends_on_task_id: string;
}

export interface ApprovalRow {
  id: string;
  mission_id: string;
  task_id: string;
  action_type: string;
  parameters_json: string;
  canonical_fingerprint: string;
  status: ApprovalStatus;
  requested_by: string;
  resolution_note: string | null;
  expires_at: number;
  created_at: string;
  resolved_at: string | null;
}

export interface VerificationResultRow {
  id: string;
  mission_id: string;
  is_valid: number; // 0 or 1
  confidence_score: number;
  satisfied_requirements_json: string;
  unsatisfied_requirements_json: string;
  evidence_json: string;
  summary: string;
  verified_at: string;
}

export interface ActivityEventRow {
  id: string;
  mission_id: string | null;
  task_id: string | null;
  event_type: 'Mission' | 'Tool' | 'Approval' | 'Verification' | 'Recovery' | 'Conversation' | 'Integration' | 'Knowledge' | string;
  title: string;
  description: string;
  metadata_json: string | null;
  created_at: string;
}

export interface ToolInvocationRecord {
  id: string;
  mission_id: string;
  task_id: string;
  tool_name: string;
  status: 'success' | 'failure' | 'timeout';
  input_json: string;
  output_json: string;
  duration_ms: number;
  invoked_at: string;
}

export interface IntegrationRow {
  id: string;
  name: string;
  category: string;
  connected: number; // 0 or 1
  is_local_demo: number; // 0 or 1
  config_json: string;
  updated_at: string;
}

