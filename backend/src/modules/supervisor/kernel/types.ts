/** Contratos do núcleo. Sem domínio, produto ou ferramenta concreta. */

export type MissionStatus =
  | "RECEBIDA"
  | "EM_PLANEJAMENTO"
  | "AGUARDANDO_DADOS"
  | "PLANEJADA"
  | "EM_EXECUCAO"
  | "AGUARDANDO_APROVACAO"
  | "PAUSADA"
  | "CONCLUIDA"
  | "PARCIALMENTE_CONCLUIDA"
  | "FALHOU"
  | "CANCELADA";

export type SkillStatus =
  | "proposta"
  | "mapeada"
  | "implementada"
  | "verificada"
  | "indisponivel";

export type RiskLevel = "baixo" | "medio" | "alto" | "critico";

export type EvidenceKind =
  | "fato"
  | "estimativa"
  | "hipotese"
  | "recomendacao"
  | "lacuna"
  | "bloqueio";

export type TaskStatus =
  | "pendente"
  | "em_execucao"
  | "aguardando_aprovacao"
  | "concluida"
  | "falhou"
  | "bloqueada"
  | "ignorada";

export type ExecutionOutcome =
  | "sucesso"
  | "parcial"
  | "falha"
  | "indisponivel"
  | "nao_autorizado"
  | "aguardando_aprovacao"
  | "rejeitada";

export interface Principal {
  id: string;
  organizationId: string;
  roles: string[];
  displayName: string;
}

export interface OrganizationRef {
  id: string;
  name: string;
  /** Frases que identificam a organização. Evite apelidos curtos demais. */
  aliases: string[];
}

export interface Domain {
  id: string;
  name: string;
  description: string;
}

export interface Specialist {
  id: string;
  name: string;
  domainId: string;
  description: string;
  /** Habilidades catalogadas. Não são permissões. */
  skillIds: string[];
}

export interface SkillInput {
  name: string;
  required: boolean;
  description: string;
}

export interface SkillDefinition {
  id: string;
  version: string;
  name: string;
  description: string;
  domainId: string;
  ownerAgentId: string;
  inputs: SkillInput[];
  preconditions: string[];
  dataSources: string[];
  toolIds: string[];
  risk: RiskLevel;
  requiresApproval: boolean;
  expectedResult: string;
  successCriteria: string[];
  failureHandling: string;
  status: SkillStatus;
  costUnits: number;
}

export interface CapabilityGrant {
  id: string;
  agentId: string;
  skillId: string;
  organizationId: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  available: boolean;
  unavailableReason?: string;
}

export interface ToolBinding {
  id: string;
  skillId: string;
  toolId: string;
  executorId: string;
}

export interface WorkflowMatch {
  all?: string[];
  any?: string[];
  none?: string[];
}

export type SlotName = "accountId" | "newStage" | "requestedSystem";

export interface WorkflowStep {
  id: string;
  title: string;
  skillId: string;
  dependsOn: string[];
  needs: SlotName[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  match: WorkflowMatch;
  /** Desempate. Maior vence empate de especificidade. */
  priority: number;
  steps: WorkflowStep[];
  completionCriteria: string[];
  /** False quando o fluxo só emite parecer e não cumpre a ação pedida. */
  completesRequest: boolean;
}

export interface Catalog {
  domains: Domain[];
  specialists: Specialist[];
  skills: SkillDefinition[];
  grants: CapabilityGrant[];
  tools: ToolDefinition[];
  bindings: ToolBinding[];
  workflows: WorkflowDefinition[];
  organizations: OrganizationRef[];
}

export interface Slots {
  accountId?: string;
  newStage?: string;
  requestedSystem?: string;
}

export interface MissionRequest {
  rawText: string;
  text: string;
  document?: string;
  principal: Principal;
  correlationId: string;
  slots: Slots;
}

export interface Evidence {
  id: string;
  taskId: string;
  kind: EvidenceKind;
  summary: string;
  source: string;
  untrusted: boolean;
  payload?: unknown;
  createdAt: string;
}

export interface PlanTask {
  id: string;
  stepId: string;
  title: string;
  skillId: string;
  dependsOn: string[];
  inputs: Record<string, string>;
  status: TaskStatus;
  outcome?: ExecutionOutcome;
  specialistId: string | null;
  routingReasons: string[];
  blockedReason?: string;
  idempotencyKey: string;
  wave?: number;
  output?: unknown;
}

export interface SupervisorPlan {
  id: string;
  version: number;
  workflowId: string | null;
  objective: string;
  tasks: PlanTask[];
  completionCriteria: string[];
  completesRequest: boolean;
  createdAt: string;
}

export interface SpecialistDispatch {
  id: string;
  missionId: string;
  taskId: string;
  specialistId: string | null;
  skillId: string;
  organizationId: string;
  correlationId: string;
  accepted: boolean;
  blockedReason?: string;
  createdAt: string;
}

export interface SpecialistResult {
  taskId: string;
  specialistId: string | null;
  skillId: string;
  outcome: ExecutionOutcome;
  evidence: Evidence[];
  output?: unknown;
  error?: string;
}

export interface ApprovalRequest {
  id: string;
  missionId: string;
  taskId: string;
  skillId: string;
  organizationId: string;
  reason: string;
  status: "pendente" | "aprovada" | "rejeitada";
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  /** Preenchido só por decideApproval. Forjar o status não autoriza execução. */
  method?: "decideApproval";
}

export interface AuditEvent {
  id: string;
  missionId: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  organizationId: string;
}

export interface ExecutionWave {
  index: number;
  taskIds: string[];
}

export interface SupervisorFinalResult {
  missionId: string;
  status: MissionStatus;
  objectiveUnderstood: string;
  planSummary: string[];
  executed: string[];
  results: SpecialistResult[];
  evidence: Evidence[];
  pending: string[];
  nextSteps: string[];
  limitations: string[];
  distinctions: Record<EvidenceKind, number>;
}

export interface SupervisorMission {
  id: string;
  correlationId: string;
  organizationId: string;
  requesterId: string;
  request: MissionRequest;
  objective: string;
  status: MissionStatus;
  missing: string[];
  plan: SupervisorPlan | null;
  planHistory: SupervisorPlan[];
  dispatches: SpecialistDispatch[];
  results: SpecialistResult[];
  approvals: ApprovalRequest[];
  evidence: Evidence[];
  audit: AuditEvent[];
  waves: ExecutionWave[];
  completedActionKeys: string[];
  toolsCalled: string[];
  costs: { units: number; notes: string[] };
  attempts: number;
  transitionCount: number;
  injectionHits: string[];
  finalResult: SupervisorFinalResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface Limits {
  maxTasks: number;
  maxParallel: number;
  tasksPerTick: number;
  maxTransitions: number;
  maxAttempts: number;
  maxCostUnits: number;
  timeoutMs: number;
}

export interface Runtime {
  schemaVersion: 1;
  catalog: Catalog;
  accounts: Account[];
  missions: SupervisorMission[];
  limits: Limits;
  metrics: Record<string, { calls: number; failures: number }>;
  executorCalls: Record<string, number>;
  seq: number;
  clock?: string;
}

export interface Account {
  id: string;
  organizationId: string;
  name: string;
  stage: string;
  value: number;
}

export interface ExecContext {
  organizationId: string;
  accounts: Account[];
  inputs: Record<string, string>;
  priorEvidence: Pick<Evidence, "kind" | "summary" | "untrusted">[];
  approvalGranted: boolean;
  timeoutMs: number;
}

export interface AccountMutation {
  id: string;
  stage: string;
  previousStage: string;
}

export interface ExecOutput {
  outcome: ExecutionOutcome;
  evidence: Array<Omit<Evidence, "id" | "taskId" | "createdAt">>;
  output?: unknown;
  error?: string;
  mutations?: AccountMutation[];
  timedOut?: boolean;
}
