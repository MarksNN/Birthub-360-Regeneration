import { v4 as uuidv4 } from "uuid";
import { EXECUTORS } from "./executors";
import {
  detectForeignOrganization,
  findInjection,
  hasGrant,
  isApprover,
  sameOrganization,
  sanitizeInstruction,
  skillOperational,
} from "./governance";
import { planText } from "./planner";
import { routeSkill } from "./router";
import { buildAccounts, buildCatalog } from "./seed";
import type {
  AccountMutation,
  ApprovalRequest,
  AuditEvent,
  Evidence,
  EvidenceKind,
  ExecutionOutcome,
  Limits,
  MissionStatus,
  PlanTask,
  Principal,
  Runtime,
  SkillDefinition,
  SpecialistDispatch,
  SpecialistResult,
  SupervisorFinalResult,
  SupervisorMission,
  SupervisorPlan,
  TaskStatus,
} from "./types";

export const DEFAULT_LIMITS: Limits = {
  maxTasks: 12,
  maxParallel: 3,
  tasksPerTick: 8,
  maxTransitions: 40,
  maxAttempts: 3,
  maxCostUnits: 100,
  timeoutMs: 5_000,
};

const EDGES: Record<MissionStatus, MissionStatus[]> = {
  RECEBIDA: ["EM_PLANEJAMENTO", "CANCELADA"],
  EM_PLANEJAMENTO: ["AGUARDANDO_DADOS", "PLANEJADA", "FALHOU", "CANCELADA"],
  AGUARDANDO_DADOS: ["EM_PLANEJAMENTO", "CANCELADA"],
  PLANEJADA: ["EM_EXECUCAO", "CANCELADA"],
  EM_EXECUCAO: [
    "AGUARDANDO_APROVACAO",
    "PAUSADA",
    "CONCLUIDA",
    "PARCIALMENTE_CONCLUIDA",
    "FALHOU",
    "CANCELADA",
  ],
  AGUARDANDO_APROVACAO: [
    "EM_EXECUCAO",
    "PAUSADA",
    "PARCIALMENTE_CONCLUIDA",
    "FALHOU",
    "CANCELADA",
  ],
  PAUSADA: ["EM_EXECUCAO", "CANCELADA"],
  CONCLUIDA: [],
  PARCIALMENTE_CONCLUIDA: [],
  FALHOU: [],
  CANCELADA: [],
};

const TERMINAL = new Set<MissionStatus>([
  "CONCLUIDA",
  "PARCIALMENTE_CONCLUIDA",
  "FALHOU",
  "CANCELADA",
]);

export interface SubmitInput {
  text: string;
  principal: Principal;
  correlationId?: string;
  document?: string;
  explicitOrganizationId?: string;
  slots?: Runtime["missions"][number]["request"]["slots"];
}

export function createRuntime(options?: { limits?: Partial<Limits>; clock?: string }): Runtime {
  return {
    schemaVersion: 1,
    catalog: buildCatalog(),
    accounts: buildAccounts(),
    missions: [],
    limits: { ...DEFAULT_LIMITS, ...options?.limits },
    metrics: {},
    executorCalls: {},
    seq: 0,
    clock: options?.clock,
  };
}

export function nowIso(runtime: Runtime): string {
  return runtime.clock ?? new Date().toISOString();
}

function nextId(runtime: Runtime, prefix: string): string {
  return `${prefix}-${uuidv4()}`;
}

function audit(
  runtime: Runtime,
  mission: SupervisorMission,
  actor: string,
  action: string,
  detail: string,
): void {
  const event: AuditEvent = {
    id: nextId(runtime, "aud"),
    missionId: mission.id,
    at: nowIso(runtime),
    actor,
    action,
    detail,
    organizationId: mission.organizationId,
  };
  mission.audit.push(event);
  mission.updatedAt = event.at;
}

function transition(
  runtime: Runtime,
  mission: SupervisorMission,
  to: MissionStatus,
  actor: string,
): void {
  if (mission.status === to) return;
  const allowed = EDGES[mission.status];
  if (!allowed.includes(to)) {
    throw new Error(`Transição ilegal ${mission.status} → ${to}`);
  }
  const from = mission.status;
  mission.status = to;
  mission.transitionCount += 1;
  audit(runtime, mission, actor, "transicao", `${from} → ${to}`);
  if (mission.transitionCount > runtime.limits.maxTransitions) {
    throw new Error("Limite de transições excedido.");
  }
}

function visibleMission(runtime: Runtime, missionId: string, principal: Principal): SupervisorMission | null {
  const mission = runtime.missions.find((item) => item.id === missionId);
  if (!mission || mission.organizationId !== principal.organizationId) return null;
  return mission;
}

function skillById(runtime: Runtime, skillId: string): SkillDefinition | undefined {
  return runtime.catalog.skills.find((skill) => skill.id === skillId);
}

function accountsOf(runtime: Runtime, organizationId: string) {
  return runtime.accounts.filter((account) => account.organizationId === organizationId);
}

function emptyDistinctions(): Record<EvidenceKind, number> {
  return { fato: 0, estimativa: 0, hipotese: 0, recomendacao: 0, lacuna: 0, bloqueio: 0 };
}

function consolidate(mission: SupervisorMission): SupervisorFinalResult {
  const distinctions = emptyDistinctions();
  for (const item of mission.evidence) distinctions[item.kind] += 1;
  const pending = [
    ...mission.missing.map((item) => `Dado faltante: ${item}.`),
    ...mission.approvals
      .filter((item) => item.status === "pendente")
      .map((item) => `Aprovação pendente para ${item.skillId}.`),
  ];
  const limitations: string[] = [];
  if (mission.injectionHits.length > 0) {
    limitations.push("Instrução externa detectada e ignorada como comando.");
  }
  if (mission.results.some((result) => result.outcome === "indisponivel")) {
    limitations.push("Há ferramenta ou habilidade indisponível. Nenhum sucesso foi simulado.");
  }
  if (mission.plan && !mission.plan.completesRequest) {
    limitations.push("O fluxo disponível emite parecer ou diagnóstico. A ação pedida não foi executada.");
  }
  if (mission.results.some((result) => result.outcome === "rejeitada")) {
    limitations.push("Aprovação rejeitada. A alteração não foi aplicada.");
  }
  if (mission.results.some((result) => result.outcome === "nao_autorizado")) {
    limitations.push("Há etapa sem autorização. Ela não foi executada.");
  }
  const nextSteps: string[] = [];
  if (mission.status === "AGUARDANDO_APROVACAO") {
    nextSteps.push("Um aprovador da mesma organização precisa decidir. O supervisor não aprova sozinho.");
  } else if (mission.status === "AGUARDANDO_DADOS") {
    nextSteps.push("Informe os dados faltantes e retome o planejamento.");
  } else if (mission.status === "PAUSADA") {
    nextSteps.push("Retome a missão. Ações já concluídas não serão repetidas.");
  } else if (mission.status === "FALHOU" || mission.status === "PARCIALMENTE_CONCLUIDA") {
    nextSteps.push("Revise a limitação antes de pedir outra execução.");
  }
  return {
    missionId: mission.id,
    status: mission.status,
    objectiveUnderstood: mission.objective,
    planSummary: mission.plan?.tasks.map((task) => task.title) ?? [],
    executed: mission.results
      .filter((result) => result.outcome === "sucesso")
      .map((result) => result.skillId),
    results: mission.results,
    evidence: mission.evidence,
    pending,
    nextSteps,
    limitations,
    distinctions,
  };
}

function publish(mission: SupervisorMission): void {
  mission.finalResult = consolidate(mission);
}

function deriveTerminal(mission: SupervisorMission): MissionStatus {
  const tasks = mission.plan?.tasks ?? [];
  if (tasks.some((task) => task.status === "aguardando_aprovacao")) return "AGUARDANDO_APROVACAO";
  const open = tasks.some((task) => task.status === "pendente" || task.status === "em_execucao");
  if (open) return "PAUSADA";
  const outcomes = tasks.map((task) => task.outcome).filter(Boolean);
  const anySuccess = outcomes.includes("sucesso");
  const completes = mission.plan?.completesRequest !== false;
  if (outcomes.length > 0 && outcomes.every((item) => item === "sucesso") && completes) {
    return "CONCLUIDA";
  }
  if (anySuccess || outcomes.includes("indisponivel") || (outcomes.includes("sucesso") === false && outcomes.length > 0 && mission.plan?.completesRequest === false)) {
    if (!anySuccess && outcomes.every((item) => item === "nao_autorizado" || item === "rejeitada" || item === "falha")) {
      return "FALHOU";
    }
    if (!anySuccess && outcomes.every((item) => item === "falha")) return "FALHOU";
    return "PARCIALMENTE_CONCLUIDA";
  }
  if (outcomes.some((item) => item === "nao_autorizado" || item === "rejeitada" || item === "falha")) {
    return "FALHOU";
  }
  return "FALHOU";
}

function depsSatisfied(task: PlanTask, tasks: PlanTask[]): boolean {
  return task.dependsOn.every((dependencyId) => {
    const dependency = tasks.find((item) => item.id === dependencyId);
    return dependency?.status === "concluida";
  });
}

function approvalFor(mission: SupervisorMission, taskId: string): ApprovalRequest | undefined {
  return mission.approvals.find((item) => item.taskId === taskId);
}

function approvalIsValid(approval: ApprovalRequest | undefined): boolean {
  return Boolean(
    approval &&
      approval.status === "aprovada" &&
      approval.method === "decideApproval" &&
      approval.decidedBy,
  );
}

function pushEvidence(
  runtime: Runtime,
  mission: SupervisorMission,
  task: PlanTask,
  draft: Omit<Evidence, "id" | "taskId" | "createdAt">,
): Evidence {
  const evidence: Evidence = {
    ...draft,
    id: nextId(runtime, "ev"),
    taskId: task.id,
    createdAt: nowIso(runtime),
  };
  mission.evidence.push(evidence);
  if (findInjection([evidence.summary, JSON.stringify(evidence.payload ?? "")]).length > 0) {
    evidence.untrusted = true;
    audit(
      runtime,
      mission,
      "supervisor",
      "injecao_bloqueada",
      "Payload de evidência contém instrução externa e permanece como dado.",
    );
  }
  return evidence;
}

function closeTask(
  runtime: Runtime,
  mission: SupervisorMission,
  task: PlanTask,
  outcome: ExecutionOutcome,
  status: TaskStatus,
  reason: string,
  evidenceDrafts: Array<Omit<Evidence, "id" | "taskId" | "createdAt">>,
): void {
  task.outcome = outcome;
  task.status = status;
  task.blockedReason = status === "concluida" ? undefined : reason;
  const evidence = evidenceDrafts.map((draft) => pushEvidence(runtime, mission, task, draft));
  const result: SpecialistResult = {
    taskId: task.id,
    specialistId: task.specialistId,
    skillId: task.skillId,
    outcome,
    evidence,
    error: status === "concluida" ? undefined : reason,
  };
  mission.results.push(result);
  const dispatch: SpecialistDispatch = {
    id: nextId(runtime, "dsp"),
    missionId: mission.id,
    taskId: task.id,
    specialistId: task.specialistId,
    skillId: task.skillId,
    organizationId: mission.organizationId,
    correlationId: mission.correlationId,
    accepted: outcome === "sucesso",
    blockedReason: result.error,
    createdAt: nowIso(runtime),
  };
  mission.dispatches.push(dispatch);
  audit(runtime, mission, task.specialistId ?? "supervisor", "tarefa", `${task.skillId}: ${outcome}. ${reason}`);
}

function applyMutations(
  runtime: Runtime,
  mission: SupervisorMission,
  mutations: AccountMutation[],
): string | null {
  for (const mutation of mutations) {
    const account = runtime.accounts.find((item) => item.id === mutation.id);
    if (!account || account.organizationId !== mission.organizationId) {
      return "Mutação recusada pelo isolamento de organização.";
    }
    if (account.stage !== mutation.previousStage) {
      return "Mutação recusada. O registro mudou desde a leitura.";
    }
    account.stage = mutation.stage;
  }
  return null;
}

function executeTask(runtime: Runtime, mission: SupervisorMission, task: PlanTask, wave: number): void {
  task.wave = wave;
  if (mission.completedActionKeys.includes(task.idempotencyKey) || task.status === "concluida") {
    task.status = "concluida";
    task.outcome = "sucesso";
    audit(runtime, mission, "supervisor", "idempotencia", `${task.skillId} já concluída. Executor não chamado.`);
    return;
  }
  const skill = skillById(runtime, task.skillId);
  if (!skill) {
    closeTask(runtime, mission, task, "indisponivel", "bloqueada", "Habilidade ausente no catálogo.", [
      {
        kind: "lacuna",
        source: "catalogo",
        untrusted: false,
        summary: `A habilidade ${task.skillId} não existe.`,
      },
    ]);
    return;
  }
  const decision = routeSkill(runtime, mission.request.principal, skill);
  task.specialistId = decision.specialistId;
  task.routingReasons = decision.reasons;

  const tools = skill.toolIds.map((toolId) => runtime.catalog.tools.find((tool) => tool.id === toolId));
  const unavailable = tools.find((tool) => !tool || !tool.available);
  if (skill.status === "indisponivel" || unavailable) {
    const reason =
      unavailable?.unavailableReason ??
      (unavailable ? "Ferramenta ausente no catálogo." : "Habilidade marcada como indisponível.");
    closeTask(runtime, mission, task, "indisponivel", "bloqueada", reason, [
      {
        kind: "lacuna",
        source: unavailable?.id ?? skill.id,
        untrusted: false,
        summary: reason,
      },
    ]);
    return;
  }
  if (!skillOperational(skill)) {
    closeTask(
      runtime,
      mission,
      task,
      "nao_autorizado",
      "bloqueada",
      `Habilidade em situação ${skill.status}. Catálogo não autoriza execução.`,
      [
        {
          kind: "bloqueio",
          source: "catalogo",
          untrusted: false,
          summary: `${skill.id} está ${skill.status}. Nenhuma permissão foi concedida.`,
        },
      ],
    );
    return;
  }
  if (!decision.specialistId || !hasGrant(runtime.catalog, decision.specialistId, skill.id, mission.organizationId)) {
    closeTask(
      runtime,
      mission,
      task,
      "nao_autorizado",
      "bloqueada",
      decision.reasons.join(" "),
      [
        {
          kind: "bloqueio",
          source: "governanca",
          untrusted: false,
          summary: "Sem capability concedida para executar a habilidade nesta organização.",
        },
      ],
    );
    return;
  }
  const missingInput = skill.inputs.find((input) => input.required && !task.inputs[input.name]);
  if (missingInput) {
    closeTask(runtime, mission, task, "falha", "bloqueada", `Entrada ausente: ${missingInput.name}.`, [
      {
        kind: "lacuna",
        source: "planejamento",
        untrusted: false,
        summary: `A tarefa não rodou. Falta ${missingInput.description}.`,
      },
    ]);
    return;
  }
  if (skill.requiresApproval && !approvalIsValid(approvalFor(mission, task.id))) {
    if (!approvalFor(mission, task.id)) {
      mission.approvals.push({
        id: nextId(runtime, "apr"),
        missionId: mission.id,
        taskId: task.id,
        skillId: skill.id,
        organizationId: mission.organizationId,
        reason: `${skill.name} é de risco ${skill.risk} e altera estado.`,
        status: "pendente",
        requestedAt: nowIso(runtime),
      });
    }
    task.status = "aguardando_aprovacao";
    task.outcome = "aguardando_aprovacao";
    task.blockedReason = "Aprovação humana pendente.";
    audit(runtime, mission, "supervisor", "aprovacao_solicitada", `${skill.id} bloqueada até decisão humana.`);
    mission.dispatches.push({
      id: nextId(runtime, "dsp"),
      missionId: mission.id,
      taskId: task.id,
      specialistId: decision.specialistId,
      skillId: skill.id,
      organizationId: mission.organizationId,
      correlationId: mission.correlationId,
      accepted: false,
      blockedReason: "aprovação humana pendente",
      createdAt: nowIso(runtime),
    });
    return;
  }
  const binding = runtime.catalog.bindings.find(
    (item) => item.skillId === skill.id && skill.toolIds.includes(item.toolId),
  );
  const executor = binding ? EXECUTORS[binding.executorId] : undefined;
  if (!binding || !executor) {
    closeTask(
      runtime,
      mission,
      task,
      "indisponivel",
      "bloqueada",
      "Não há executor homologado para esta habilidade.",
      [
        {
          kind: "lacuna",
          source: "tool-binding",
          untrusted: false,
          summary: "Sem binding executável. Resultado não foi inventado.",
        },
      ],
    );
    return;
  }
  const nextCost = mission.costs.units + skill.costUnits;
  if (nextCost > runtime.limits.maxCostUnits) {
    task.status = "pendente";
    audit(runtime, mission, "supervisor", "limite_custo", "Teto de custo atingido. Tarefa não iniciada.");
    return;
  }
  task.status = "em_execucao";
  const started = Date.now();
  let output;
  try {
    output = executor(
      {
        organizationId: mission.organizationId,
        accounts: accountsOf(runtime, mission.organizationId),
        inputs: task.inputs,
        priorEvidence: mission.evidence
          .filter((item) => task.dependsOn.includes(item.taskId))
          .map((item) => ({ kind: item.kind, summary: item.summary, untrusted: item.untrusted })),
        approvalGranted: approvalIsValid(approvalFor(mission, task.id)) || !skill.requiresApproval,
        timeoutMs: runtime.limits.timeoutMs,
      },
      runtime.catalog,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha do executor.";
    closeTask(runtime, mission, task, "falha", "falhou", message, [
      { kind: "bloqueio", source: binding.executorId, untrusted: false, summary: message },
    ]);
    const metric = runtime.metrics[decision.specialistId] ?? { calls: 0, failures: 0 };
    metric.calls += 1;
    metric.failures += 1;
    runtime.metrics[decision.specialistId] = metric;
    return;
  }
  runtime.executorCalls[skill.id] = (runtime.executorCalls[skill.id] ?? 0) + 1;
  const metric = runtime.metrics[decision.specialistId] ?? { calls: 0, failures: 0 };
  metric.calls += 1;
  if (Date.now() - started > runtime.limits.timeoutMs || output.timedOut) {
    metric.failures += 1;
    runtime.metrics[decision.specialistId] = metric;
    closeTask(runtime, mission, task, "falha", "falhou", "Tempo limite do executor excedido.", [
      { kind: "bloqueio", source: binding.executorId, untrusted: false, summary: "Timeout." },
    ]);
    return;
  }
  if (output.mutations?.length) {
    const mutationError = applyMutations(runtime, mission, output.mutations);
    if (mutationError) {
      metric.failures += 1;
      runtime.metrics[decision.specialistId] = metric;
      closeTask(runtime, mission, task, "nao_autorizado", "bloqueada", mutationError, [
        { kind: "bloqueio", source: "isolamento", untrusted: false, summary: mutationError },
      ]);
      return;
    }
  }
  mission.costs.units += skill.costUnits;
  mission.costs.notes.push(`${skill.id}: ${skill.costUnits}`);
  mission.toolsCalled.push(binding.toolId);
  if (output.outcome === "sucesso") {
    mission.completedActionKeys.push(task.idempotencyKey);
  }
  if (output.outcome !== "sucesso") metric.failures += 1;
  runtime.metrics[decision.specialistId] = metric;
  const status: TaskStatus =
    output.outcome === "sucesso" ? "concluida" : output.outcome === "falha" ? "falhou" : "bloqueada";
  task.output = output.output;
  closeTask(
    runtime,
    mission,
    task,
    output.outcome,
    status,
    output.error ?? "Executor concluiu.",
    output.evidence,
  );
}

function runExecution(runtime: Runtime, mission: SupervisorMission): void {
  mission.attempts += 1;
  if (mission.attempts > runtime.limits.maxAttempts) {
    audit(runtime, mission, "supervisor", "limite", "Número máximo de tentativas atingido.");
    if (!TERMINAL.has(mission.status)) transition(runtime, mission, "FALHOU", "supervisor");
    publish(mission);
    return;
  }
  if (mission.status === "PLANEJADA" || mission.status === "PAUSADA" || mission.status === "AGUARDANDO_APROVACAO") {
    transition(runtime, mission, "EM_EXECUCAO", "supervisor");
  }
  const tasks = mission.plan?.tasks ?? [];
  let ran = 0;
  let guard = 0;
  while (guard < runtime.limits.maxTasks + 2) {
    guard += 1;
    const pendingApproval = tasks.some((task) => task.status === "aguardando_aprovacao");
    const open = tasks.filter((task) => task.status === "pendente");
    if (pendingApproval || open.length === 0) break;
    if (ran >= runtime.limits.tasksPerTick) break;
    const ready = open.filter((task) => depsSatisfied(task, tasks));
    if (ready.length === 0) {
      audit(runtime, mission, "supervisor", "deadlock", "Há tarefas abertas sem dependências satisfeitas.");
      for (const task of open) {
        closeTask(runtime, mission, task, "falha", "falhou", "Dependência não satisfeita.", [
          { kind: "bloqueio", source: "orquestrador", untrusted: false, summary: "Ciclo ou dependência falha." },
        ]);
      }
      break;
    }
    const room = Math.min(runtime.limits.maxParallel, runtime.limits.tasksPerTick - ran);
    const batch = ready.slice(0, room);
    const wave = mission.waves.length;
    mission.waves.push({ index: wave, taskIds: batch.map((task) => task.id) });
    for (const task of batch) {
      executeTask(runtime, mission, task, wave);
      ran += 1;
    }
  }
  const terminal = deriveTerminal(mission);
  if (mission.status === "EM_EXECUCAO") {
    transition(runtime, mission, terminal, "supervisor");
  } else if (mission.status !== terminal && EDGES[mission.status].includes(terminal)) {
    transition(runtime, mission, terminal, "supervisor");
  }
  publish(mission);
}

function materializePlan(
  runtime: Runtime,
  mission: SupervisorMission,
  draft: ReturnType<typeof planText>,
): SupervisorPlan | null {
  if (!draft.workflow) return null;
  if (draft.workflow.steps.length > runtime.limits.maxTasks) {
    audit(runtime, mission, "supervisor", "limite", "Plano excede o máximo de tarefas.");
    return null;
  }
  const stepToTask = new Map<string, string>();
  for (const step of draft.workflow.steps) stepToTask.set(step.id, nextId(runtime, "task"));
  const tasks: PlanTask[] = draft.workflow.steps.map((step) => {
    const id = stepToTask.get(step.id) ?? nextId(runtime, "task");
    const inputs: Record<string, string> = {};
    for (const need of step.needs) {
      const value = draft.slots[need];
      if (value) inputs[need] = value;
    }
    return {
      id,
      stepId: step.id,
      title: step.title,
      skillId: step.skillId,
      dependsOn: step.dependsOn.map((dependency) => stepToTask.get(dependency) ?? dependency),
      inputs,
      status: "pendente",
      specialistId: null,
      routingReasons: [],
      idempotencyKey: `${mission.id}:${step.id}:${step.skillId}`,
    };
  });
  return {
    id: nextId(runtime, "plan"),
    version: (mission.plan?.version ?? 0) + 1,
    workflowId: draft.workflow.id,
    objective: draft.objective,
    tasks,
    completionCriteria: draft.workflow.completionCriteria,
    completesRequest: draft.workflow.completesRequest,
    createdAt: nowIso(runtime),
  };
}

function openMission(runtime: Runtime, input: SubmitInput, correlationId: string): SupervisorMission {
  const createdAt = nowIso(runtime);
  const sanitized = sanitizeInstruction(input.text);
  const mission: SupervisorMission = {
    id: nextId(runtime, "mis"),
    correlationId,
    organizationId: input.principal.organizationId,
    requesterId: input.principal.id,
    request: {
      rawText: input.text,
      text: sanitized,
      document: input.document,
      principal: input.principal,
      correlationId,
      slots: input.slots ?? {},
    },
    objective: sanitized.trim(),
    status: "RECEBIDA",
    missing: [],
    plan: null,
    planHistory: [],
    dispatches: [],
    results: [],
    approvals: [],
    evidence: [],
    audit: [],
    waves: [],
    completedActionKeys: [],
    toolsCalled: [],
    costs: { units: 0, notes: [] },
    attempts: 0,
    transitionCount: 0,
    injectionHits: [],
    finalResult: null,
    createdAt,
    updatedAt: createdAt,
  };
  runtime.missions.push(mission);
  audit(runtime, mission, input.principal.id, "recebida", "Missão registrada.");
  return mission;
}

function planMission(runtime: Runtime, mission: SupervisorMission, explicitOrganizationId?: string): void {
  transition(runtime, mission, "EM_PLANEJAMENTO", "supervisor");
  const hits = findInjection([mission.request.rawText, mission.request.document]);
  mission.injectionHits = hits;
  if (hits.length > 0) {
    audit(
      runtime,
      mission,
      "supervisor",
      "injecao_bloqueada",
      "Texto ou documento externo tentou alterar regras. Tratado como dado.",
    );
  }
  const foreign = detectForeignOrganization(
    runtime.catalog,
    mission.request.principal,
    `${mission.request.rawText}\n${mission.request.document ?? ""}`,
    explicitOrganizationId,
  );
  if (foreign) {
    mission.objective = "Pedido bloqueado por isolamento de organização.";
    pushEvidence(runtime, mission, placeholderTask(mission), {
      kind: "bloqueio",
      source: "isolamento",
      untrusted: false,
      summary: "O pedido cita outra organização. Nenhum dado dela foi lido.",
    });
    transition(runtime, mission, "FALHOU", "supervisor");
    publish(mission);
    return;
  }
  const draft = planText(runtime.catalog, mission.request.text, mission.request.slots);
  mission.request.slots = draft.slots;
  mission.objective = draft.objective || mission.objective;
  if (draft.missing.length > 0) {
    mission.missing = draft.missing;
    transition(runtime, mission, "AGUARDANDO_DADOS", "supervisor");
    audit(runtime, mission, "supervisor", "dados", `Faltam: ${draft.missing.join(", ")}.`);
    publish(mission);
    return;
  }
  if (!draft.workflow || draft.gap) {
    pushEvidence(runtime, mission, placeholderTask(mission), {
      kind: "lacuna",
      source: "catalogo",
      untrusted: false,
      summary: draft.gap ?? "Sem fluxo aplicável.",
    });
    transition(runtime, mission, "FALHOU", "supervisor");
    publish(mission);
    return;
  }
  if (mission.plan) mission.planHistory.push(mission.plan);
  mission.plan = materializePlan(runtime, mission, draft);
  if (!mission.plan) {
    transition(runtime, mission, "FALHOU", "supervisor");
    publish(mission);
    return;
  }
  for (const task of mission.plan.tasks) {
    const skill = skillById(runtime, task.skillId);
    if (!skill) continue;
    const decision = routeSkill(runtime, mission.request.principal, skill);
    task.specialistId = decision.specialistId;
    task.routingReasons = decision.reasons;
  }
  transition(runtime, mission, "PLANEJADA", "supervisor");
  runExecution(runtime, mission);
}

function placeholderTask(mission: SupervisorMission): PlanTask {
  return {
    id: `${mission.id}:bloqueio`,
    stepId: "bloqueio",
    title: "Bloqueio",
    skillId: "nenhuma",
    dependsOn: [],
    inputs: {},
    status: "bloqueada",
    specialistId: null,
    routingReasons: [],
    idempotencyKey: `${mission.id}:bloqueio`,
  };
}

export function submit(runtime: Runtime, input: SubmitInput): SupervisorMission {
  const correlationId = input.correlationId ?? nextId(runtime, "cor");
  const existing = runtime.missions.find(
    (mission) =>
      mission.correlationId === correlationId &&
      mission.organizationId === input.principal.organizationId,
  );
  if (existing) return existing;
  const mission = openMission(runtime, input, correlationId);
  planMission(runtime, mission, input.explicitOrganizationId);
  return mission;
}

/** Fachada estável. Não contém regra própria. */
export function runMission(runtime: Runtime, input: SubmitInput): SupervisorMission {
  return submit(runtime, input);
}

export function provideData(
  runtime: Runtime,
  missionId: string,
  principal: Principal,
  slots: SupervisorMission["request"]["slots"],
): SupervisorMission | null {
  const mission = visibleMission(runtime, missionId, principal);
  if (!mission || mission.status !== "AGUARDANDO_DADOS") return mission;
  mission.request.slots = { ...mission.request.slots, ...slots };
  mission.missing = [];
  transition(runtime, mission, "EM_PLANEJAMENTO", principal.id);
  const draft = planText(runtime.catalog, mission.request.text, mission.request.slots);
  mission.request.slots = draft.slots;
  if (draft.missing.length > 0) {
    mission.missing = draft.missing;
    transition(runtime, mission, "AGUARDANDO_DADOS", "supervisor");
    publish(mission);
    return mission;
  }
  if (!draft.workflow) {
    transition(runtime, mission, "FALHOU", "supervisor");
    publish(mission);
    return mission;
  }
  mission.plan = materializePlan(runtime, mission, draft);
  if (!mission.plan) {
    transition(runtime, mission, "FALHOU", "supervisor");
    publish(mission);
    return mission;
  }
  transition(runtime, mission, "PLANEJADA", "supervisor");
  runExecution(runtime, mission);
  return mission;
}

export function resume(runtime: Runtime, missionId: string, principal: Principal): SupervisorMission | null {
  const mission = visibleMission(runtime, missionId, principal);
  if (!mission) return null;
  if (TERMINAL.has(mission.status)) return mission;
  if (mission.status !== "PAUSADA" && mission.status !== "AGUARDANDO_APROVACAO" && mission.status !== "EM_EXECUCAO") {
    return mission;
  }
  const callsBefore = { ...runtime.executorCalls };
  runExecution(runtime, mission);
  const unchanged = JSON.stringify(callsBefore) === JSON.stringify(runtime.executorCalls);
  if (unchanged) {
    audit(runtime, mission, "supervisor", "idempotencia", "Retomada não chamou executor de tarefa já concluída.");
  }
  return mission;
}

export interface DecisionResult {
  ok: boolean;
  error?: string;
  mission: SupervisorMission | null;
}

export function decideApproval(
  runtime: Runtime,
  missionId: string,
  approvalId: string,
  decision: "aprovada" | "rejeitada",
  principal: Principal,
): DecisionResult {
  const mission = visibleMission(runtime, missionId, principal);
  if (!mission) return { ok: false, error: "Missão não encontrada.", mission: null };
  if (TERMINAL.has(mission.status)) return { ok: false, error: "Não é possível aprovar missões em estado terminal.", mission };
  if (!isApprover(principal) || !sameOrganization(principal, mission.organizationId)) {
    audit(runtime, mission, principal.id, "aprovacao_recusada", "Papel ou organização não autorizam a decisão.");
    return { ok: false, error: "Papel insuficiente para aprovar nesta organização.", mission };
  }
  const approval = mission.approvals.find((item) => item.id === approvalId);
  if (!approval || approval.organizationId !== principal.organizationId) {
    return { ok: false, error: "Aprovação não encontrada.", mission };
  }
  if (approval.status !== "pendente") {
    return { ok: false, error: "Aprovação já decidida.", mission };
  }
  approval.status = decision;
  approval.decidedAt = nowIso(runtime);
  approval.decidedBy = principal.id;
  approval.method = "decideApproval";
  const task = mission.plan?.tasks.find((item) => item.id === approval.taskId);
  audit(runtime, mission, principal.id, "aprovacao_decidida", `${approval.skillId}: ${decision}.`);
  if (!task) return { ok: false, error: "Tarefa da aprovação não encontrada.", mission };
  if (decision === "rejeitada") {
    closeTask(runtime, mission, task, "rejeitada", "bloqueada", "Aprovação rejeitada por humano.", [
      {
        kind: "bloqueio",
        source: "aprovacao",
        untrusted: false,
        summary: "A alteração não foi executada.",
      },
    ]);
  } else {
    task.status = "pendente";
    task.outcome = undefined;
    task.blockedReason = undefined;
  }
  if (mission.status === "AGUARDANDO_APROVACAO") {
    transition(runtime, mission, "EM_EXECUCAO", principal.id);
  }
  runExecution(runtime, mission);
  return { ok: true, mission };
}

export function cancel(runtime: Runtime, missionId: string, principal: Principal): SupervisorMission | null {
  const mission = visibleMission(runtime, missionId, principal);
  if (!mission || TERMINAL.has(mission.status)) return mission;
  for (const task of mission.plan?.tasks ?? []) {
    if (task.status === "pendente" || task.status === "aguardando_aprovacao") {
      task.status = "ignorada";
      task.outcome = "nao_autorizado";
      task.blockedReason = "Missão cancelada.";
    }
  }
  transition(runtime, mission, "CANCELADA", principal.id);
  publish(mission);
  return mission;
}

export interface GateExplanation {
  allowed: boolean;
  reason: string;
}

export function explainExecutionGate(
  runtime: Runtime,
  principal: Principal,
  skillId: string,
): GateExplanation {
  const skill = skillById(runtime, skillId);
  if (!skill) return { allowed: false, reason: "Habilidade não está no catálogo." };
  if (!skillOperational(skill)) {
    return {
      allowed: false,
      reason: `Situação ${skill.status}. Incluir no catálogo não concede execução.`,
    };
  }
  const decision = routeSkill(runtime, principal, skill);
  if (!decision.specialistId) {
    return { allowed: false, reason: decision.reasons.join(" ") || "Sem capability concedida." };
  }
  return { allowed: true, reason: decision.reasons.join(" ") };
}

export function registerSkill(runtime: Runtime, skill: SkillDefinition): { ok: boolean; reason: string } {
  if (runtime.catalog.skills.some((item) => item.id === skill.id)) {
    return { ok: false, reason: "Identificador de habilidade já existe." };
  }
  const owner = runtime.catalog.specialists.find((item) => item.id === skill.ownerAgentId);
  if (!owner) return { ok: false, reason: "Agente responsável inexistente. O núcleo não cria agente." };
  runtime.catalog.skills.push(structuredClone(skill));
  if (!owner.skillIds.includes(skill.id)) owner.skillIds.push(skill.id);
  return { ok: true, reason: "Habilidade catalogada. Nenhuma capability foi concedida." };
}

export function listMissions(runtime: Runtime, principal: Principal): SupervisorMission[] {
  return runtime.missions.filter((mission) => mission.organizationId === principal.organizationId);
}
