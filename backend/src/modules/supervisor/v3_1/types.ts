export type AgentIdV31 =
  | 'supervisor'
  | 'gestao'
  | 'icp'
  | 'account_intel'
  | 'prospeccao'
  | 'intencao'
  | 'outbound'
  | 'sdr'
  | 'solucoes'
  | 'negociacao'
  | 'deal_desk'
  | 'deal_health'
  | 'forecast'
  | 'growth_analytics'
  | 'coaching'
  | 'crm'
  | 'expansao'
  | 'parcerias'
  | 'winloss';

export const ALL_AGENT_IDS_V31: AgentIdV31[] = [
  'supervisor',
  'gestao',
  'icp',
  'account_intel',
  'prospeccao',
  'intencao',
  'outbound',
  'sdr',
  'solucoes',
  'negociacao',
  'deal_desk',
  'deal_health',
  'forecast',
  'growth_analytics',
  'coaching',
  'crm',
  'expansao',
  'parcerias',
  'winloss',
];

export type AgentStatusV31 =
  | 'COMPLETED'
  | 'PARTIAL'
  | 'BLOCKED'
  | 'APPROVAL_REQUIRED'
  | 'NEEDS_INFO';

export type AgentModeV31 =
  | 'CONSULTIVO'
  | 'OPERACIONAL'
  | 'BLOQUEADO';

export type ArtifactTypeV31 =
  | 'CADENCE_DRAFT'
  | 'MESSAGE_DRAFT'
  | 'CALL_SCRIPT'
  | 'VOICEMAIL_DRAFT'
  | 'FOLLOWUP_PLAN'
  | 'REPLY_TRIAGE'
  | 'PERFORMANCE_REVIEW'
  | 'HANDOFF_PROPOSAL'
  | 'EVENT_OUTREACH_PLAN'
  | 'OTHER'
  | 'ANALYSIS'
  | 'PLAN'
  | 'MATRIX'
  | 'REPORT'
  | 'SCORECARD'
  | 'SCENARIO'
  | 'QUOTE_DRAFT'
  | 'DEMO_DRAFT'
  | 'CRM_CHANGESET'
  | 'RISK_REGISTER'
  | 'QUALIFICATION_BRIEF'
  | 'ROUTING_PLAN'
  | 'TRAINING_PLAN'
  | 'OTHER_DOCUMENT';

export type ArtifactStateV31 =
  | 'DRAFT_NOT_SENT'
  | 'PREPARED_NOT_EXECUTED'
  | 'PERSISTED_VERIFIED'
  | 'EXECUTED_VERIFIED';

export interface ArtifactV31 {
  artifactType: ArtifactTypeV31;
  name: string;
  payload: Record<string, any>;
  state: ArtifactStateV31;
}

export type EvidenceSourceTypeV31 =
  | 'USER_INPUT'
  | 'DOCUMENT'
  | 'CRM'
  | 'TOOL_EXECUTION'
  | 'PROVIDER_EVENT'
  | 'POLICY'
  | 'OTHER';

export type EvidenceVerificationV31 =
  | 'USER_REPORTED'
  | 'TOOL_VERIFIED'
  | 'POLICY_REFERENCE'
  | 'UNVERIFIED';

export interface EvidenceV31 {
  sourceType: EvidenceSourceTypeV31;
  reference: string;
  claim: string;
  verification: EvidenceVerificationV31;
  observedAt: string | null;
}

export type GateStatusV31 = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE';

export interface ComplianceCheckV31 {
  check:
    | 'LEGAL_BASIS'
    | 'PURPOSE'
    | 'OPT_OUT'
    | 'ORIGIN'
    | 'CHANNEL_POLICY'
    | 'WHATSAPP_OPT_IN'
    | 'TEMPLATE'
    | 'WINDOW_24H'
    | 'FREQUENCY'
    | 'BUSINESS_HOURS'
    | 'DUPLICATE'
    | 'OWNER'
    | 'HUMAN_APPROVAL'
    | 'AUTHORIZATION';
  state: GateStatusV31;
  reason: string;
  evidenceRef: string | null;
}

export interface ComplianceSignalsV31 {
  whatsappOptIn: 'CONFIRMED' | 'NOT_CONFIRMED' | 'UNKNOWN' | 'NOT_APPLICABLE';
  optOutSuppression: 'CLEAR' | 'SUPPRESSED' | 'UNKNOWN';
  touchHistory: 'NO_CONFLICT' | 'CONFLICT' | 'UNKNOWN';
  businessHours: 'WITHIN_WINDOW' | 'OUTSIDE_WINDOW' | 'UNKNOWN' | 'NOT_APPLICABLE';
  timezone: string | null;
}

export interface ComplianceV31 {
  channel: 'EMAIL' | 'WHATSAPP' | 'PHONE' | 'LINKEDIN' | 'MULTICHANNEL' | 'NONE';
  sendEligible: boolean;
  reason: string;
  checks: ComplianceCheckV31[];
  signals: ComplianceSignalsV31;
}

export interface ApprovalPendingV31 {
  required: boolean;
  status: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  action: string | null;
  approverRole: string | null;
  requestId: string | null;
  reason: string;
}

export interface HandoffV31 {
  to: AgentIdV31;
  reason: string;
  payloadRef: string | null;
  viaSupervisor: true;
}

export interface ExecutionToolCallV31 {
  toolCode: string;
  status: 'SUCCESS' | 'FAILURE';
  reference: string;
}

export interface ExecutionRecordV31 {
  actionType:
    | 'ASSIGN_OWNER'
    | 'CREATE_TASK'
    | 'DRAFT_ONLY'
    | 'ENQUEUE_SEND'
    | 'GENERATE_DOCUMENT'
    | 'GENERATE_REPORT'
    | 'NONE'
    | 'READ_DATA'
    | 'SAVE_DRAFT'
    | 'SCHEDULE_MEETING'
    | 'SCHEDULE_TASK'
    | 'SEND_MESSAGE'
    | 'SUBMIT_FOR_APPROVAL'
    | 'UPDATE_CRM'
    | 'UPDATE_RESOURCE'
    | 'UPDATE_SUPPRESSION';
  performed: boolean;
  state: 'NONE' | 'PREPARED' | 'PERSISTED_VERIFIED' | 'EXECUTED_VERIFIED' | 'DENIED' | 'FAILED';
  executionId: string | null;
  idempotencyKey: string | null;
  toolCalls: ExecutionToolCallV31[];
}

export interface MetricsV31 {
  tokensPrompt?: number;
  tokensCompletion?: number;
  executionTimeMs?: number;
  costEstimateUsd?: number;
}

export interface AgentResultV31 {
  schemaVersion: '3.1';
  agentId: AgentIdV31;
  missionId: string | null;
  correlationId: string | null;
  status: AgentStatusV31;
  mode: AgentModeV31;
  skillIds: string[];
  summary: string;
  resumo_humano: string;
  artifacts: ArtifactV31[];
  evidence: EvidenceV31[];
  hypotheses: string[];
  missingData: string[];
  compliance: ComplianceV31;
  approvalPending: ApprovalPendingV31;
  handoffs: HandoffV31[];
  execution: ExecutionRecordV31;
  metrics: MetricsV31;
  nextStep: string;
}

export interface SkillSummaryV31 {
  id: string;
  name: string;
  playbookId: string;
  catalogStage: string;
  number: number;
  agentId: AgentIdV31;
}

export interface AgentMetadataV31 {
  id: AgentIdV31;
  name: string;
  prompt: string;
  index: string;
  skills: number;
  playbooks: number;
}

export interface PlaybookMetaV31 {
  id: string;
  title?: string;
  path: string;
  agentId: AgentIdV31;
}

export interface ContextAssemblerFlags {
  agentId: AgentIdV31;
  indexInjected: boolean;
  schemaReady: boolean;
  loadedPlaybooks: string[];
  missingPlaybooks: string[];
  operationalAllowedByBootstrap: boolean;
}

export interface ContextAssemblerResult {
  fullPrompt: string;
  flags: ContextAssemblerFlags;
}

export interface ExecutionPolicyLimitsV31 {
  maxSupervisorStepsPerMission: number;
  maxHandoffDepth: number;
  maxHandoffsPerMission: number;
  maxParallelTasks: number;
  missionTimeoutSeconds: number;
  stepTimeoutSeconds: number;
  maxRetriesPerIdempotentAction: number;
  tokenBudgetPerMission: number;
  maxHandoffsPerSpecialist: number;
}
