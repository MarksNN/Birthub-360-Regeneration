import { z } from 'zod';
import { AgentResultV31, ALL_AGENT_IDS_V31 } from './types';

const AgentIdEnum = z.enum([
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
  'winloss'
]);

const AgentStatusEnum = z.enum([
  'COMPLETED',
  'PARTIAL',
  'BLOCKED',
  'APPROVAL_REQUIRED',
  'NEEDS_INFO'
]);

const AgentModeEnum = z.enum([
  'CONSULTIVO',
  'OPERACIONAL',
  'BLOQUEADO'
]);

const ArtifactTypeEnum = z.enum([
  'CADENCE_DRAFT',
  'MESSAGE_DRAFT',
  'CALL_SCRIPT',
  'VOICEMAIL_DRAFT',
  'FOLLOWUP_PLAN',
  'REPLY_TRIAGE',
  'PERFORMANCE_REVIEW',
  'HANDOFF_PROPOSAL',
  'EVENT_OUTREACH_PLAN',
  'OTHER',
  'ANALYSIS',
  'PLAN',
  'MATRIX',
  'REPORT',
  'SCORECARD',
  'SCENARIO',
  'QUOTE_DRAFT',
  'DEMO_DRAFT',
  'CRM_CHANGESET',
  'RISK_REGISTER',
  'QUALIFICATION_BRIEF',
  'ROUTING_PLAN',
  'TRAINING_PLAN',
  'OTHER_DOCUMENT'
]);

const ArtifactStateEnum = z.enum([
  'DRAFT_NOT_SENT',
  'PREPARED_NOT_EXECUTED',
  'PERSISTED_VERIFIED',
  'EXECUTED_VERIFIED'
]);

const ArtifactSchema = z.object({
  artifactType: ArtifactTypeEnum,
  name: z.string(),
  payload: z.record(z.any()),
  state: ArtifactStateEnum
});

const EvidenceSourceTypeEnum = z.enum([
  'USER_INPUT',
  'DOCUMENT',
  'CRM',
  'TOOL_EXECUTION',
  'PROVIDER_EVENT',
  'POLICY',
  'OTHER'
]);

const EvidenceVerificationEnum = z.enum([
  'USER_REPORTED',
  'TOOL_VERIFIED',
  'POLICY_REFERENCE',
  'UNVERIFIED'
]);

const EvidenceSchema = z.object({
  sourceType: EvidenceSourceTypeEnum,
  reference: z.string(),
  claim: z.string(),
  verification: EvidenceVerificationEnum,
  observedAt: z.string().nullable().optional()
});

const GateCheckEnum = z.enum([
  'LEGAL_BASIS',
  'PURPOSE',
  'OPT_OUT',
  'ORIGIN',
  'CHANNEL_POLICY',
  'WHATSAPP_OPT_IN',
  'TEMPLATE',
  'WINDOW_24H',
  'FREQUENCY',
  'BUSINESS_HOURS',
  'DUPLICATE',
  'OWNER',
  'HUMAN_APPROVAL',
  'AUTHORIZATION'
]);

const GateStateEnum = z.enum(['PASS', 'FAIL', 'UNKNOWN', 'NOT_APPLICABLE']);

const ComplianceCheckSchema = z.object({
  check: GateCheckEnum,
  state: GateStateEnum,
  reason: z.string(),
  evidenceRef: z.string().nullable().optional()
});

const ComplianceSignalsSchema = z.object({
  whatsappOptIn: z.enum(['CONFIRMED', 'NOT_CONFIRMED', 'UNKNOWN', 'NOT_APPLICABLE']),
  optOutSuppression: z.enum(['CLEAR', 'SUPPRESSED', 'UNKNOWN']),
  touchHistory: z.enum(['NO_CONFLICT', 'CONFLICT', 'UNKNOWN']),
  businessHours: z.enum(['WITHIN_WINDOW', 'OUTSIDE_WINDOW', 'UNKNOWN', 'NOT_APPLICABLE']),
  timezone: z.string().nullable().optional()
});

const ComplianceSchema = z.object({
  channel: z.enum(['EMAIL', 'WHATSAPP', 'PHONE', 'LINKEDIN', 'MULTICHANNEL', 'NONE']),
  sendEligible: z.boolean(),
  reason: z.string(),
  checks: z.array(ComplianceCheckSchema),
  signals: ComplianceSignalsSchema
});

const ApprovalPendingSchema = z.object({
  required: z.boolean(),
  status: z.enum(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),
  action: z.string().nullable().optional(),
  approverRole: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
  reason: z.string()
});

const HandoffSchema = z.object({
  to: AgentIdEnum,
  reason: z.string(),
  payloadRef: z.string().nullable().optional(),
  viaSupervisor: z.literal(true)
});

const ActionTypeEnum = z.enum([
  'ASSIGN_OWNER',
  'CREATE_TASK',
  'DRAFT_ONLY',
  'ENQUEUE_SEND',
  'GENERATE_DOCUMENT',
  'GENERATE_REPORT',
  'NONE',
  'READ_DATA',
  'SAVE_DRAFT',
  'SCHEDULE_MEETING',
  'SCHEDULE_TASK',
  'SEND_MESSAGE',
  'SUBMIT_FOR_APPROVAL',
  'UPDATE_CRM',
  'UPDATE_RESOURCE',
  'UPDATE_SUPPRESSION'
]);

const ExecutionStateEnum = z.enum([
  'NONE',
  'PREPARED',
  'PERSISTED_VERIFIED',
  'EXECUTED_VERIFIED',
  'DENIED',
  'FAILED'
]);

const ToolCallSchema = z.object({
  toolCode: z.string(),
  status: z.enum(['SUCCESS', 'FAILURE']),
  reference: z.string()
});

const ExecutionRecordSchema = z.object({
  actionType: ActionTypeEnum,
  performed: z.boolean(),
  state: ExecutionStateEnum,
  executionId: z.string().nullable().optional(),
  idempotencyKey: z.string().nullable().optional(),
  toolCalls: z.array(ToolCallSchema)
});

const MetricsSchema = z.object({
  tokensPrompt: z.number().optional(),
  tokensCompletion: z.number().optional(),
  executionTimeMs: z.number().optional(),
  costEstimateUsd: z.number().optional()
});

export const AgentResultV31ZodSchema = z.object({
  schemaVersion: z.literal('3.1'),
  agentId: AgentIdEnum,
  missionId: z.string().nullable(),
  correlationId: z.string().nullable(),
  status: AgentStatusEnum,
  mode: AgentModeEnum,
  skillIds: z.array(z.string().regex(/^comercial\.[a-z_]+\.[a-z0-9-]+$/)),
  summary: z.string(),
  resumo_humano: z.string(),
  artifacts: z.array(ArtifactSchema),
  evidence: z.array(EvidenceSchema),
  hypotheses: z.array(z.string()),
  missingData: z.array(z.string()),
  compliance: ComplianceSchema,
  approvalPending: ApprovalPendingSchema,
  handoffs: z.array(HandoffSchema),
  execution: ExecutionRecordSchema,
  metrics: MetricsSchema,
  nextStep: z.string()
});

export interface ValidationResultV31 {
  valid: boolean;
  errors: string[];
  data?: AgentResultV31;
}

export class CommercialSchemaValidatorV31 {
  public static validate(input: unknown): ValidationResultV31 {
    const parseResult = AgentResultV31ZodSchema.safeParse(input);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      return {
        valid: false,
        errors
      };
    }

    const data = parseResult.data as AgentResultV31;
    const semanticErrors: string[] = [];

    // Regra do schema global: Se optOutSuppression for UNKNOWN ou SUPPRESSED, sendEligible DEVE ser false
    if (
      (data.compliance.signals.optOutSuppression === 'UNKNOWN' ||
        data.compliance.signals.optOutSuppression === 'SUPPRESSED') &&
      data.compliance.sendEligible
    ) {
      semanticErrors.push('Regra de Compliance: sendEligible não pode ser true com optOutSuppression UNKNOWN ou SUPPRESSED');
    }

    // Se touchHistory for UNKNOWN ou CONFLICT, sendEligible deve ser false
    if (
      (data.compliance.signals.touchHistory === 'UNKNOWN' ||
        data.compliance.signals.touchHistory === 'CONFLICT') &&
      data.compliance.sendEligible
    ) {
      semanticErrors.push('Regra de Compliance: sendEligible não pode ser true com touchHistory UNKNOWN ou CONFLICT');
    }

    // Se businessHours for UNKNOWN ou OUTSIDE_WINDOW, sendEligible deve ser false
    if (
      (data.compliance.signals.businessHours === 'UNKNOWN' ||
        data.compliance.signals.businessHours === 'OUTSIDE_WINDOW') &&
      data.compliance.sendEligible
    ) {
      semanticErrors.push('Regra de Compliance: sendEligible não pode ser true com businessHours UNKNOWN ou OUTSIDE_WINDOW');
    }

    // Se qualquer check for FAIL ou UNKNOWN, sendEligible deve ser false
    const hasUnsafeChecks = data.compliance.checks.some(
      (c) => c.state === 'FAIL' || c.state === 'UNKNOWN'
    );
    if (hasUnsafeChecks && data.compliance.sendEligible) {
      semanticErrors.push('Regra de Compliance: sendEligible não pode ser true quando existem checks com state FAIL ou UNKNOWN');
    }

    // Se execution.performed for true, executionId não pode ser null/vazio
    if (data.execution.performed && !data.execution.executionId) {
      semanticErrors.push('Regra de Execução: execution.performed=true exige executionId registrado');
    }

    if (semanticErrors.length > 0) {
      return {
        valid: false,
        errors: semanticErrors,
        data
      };
    }

    return {
      valid: true,
      errors: [],
      data
    };
  }
}
