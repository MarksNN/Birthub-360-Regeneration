import { DealStage, Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import {
  cancel,
  createRuntime,
  decideApproval,
  provideData,
  resume,
  submit,
} from "./engine";
import { buildCatalog } from "./seed";
import type { Account, Catalog, Principal, Runtime, SupervisorMission } from "./types";

const TO_KERNEL: Record<string, string> = {
  PROSPECT: "prospect",
  QUALIFICACAO: "qualificacao",
  PROPOSTA_ENVIADA: "proposta",
  NEGOCIACAO: "negociacao",
  FECHADO_GANHO: "ganho",
  FECHADO_PERDIDO: "perdido",
};

const TO_PRISMA: Record<string, DealStage> = {
  prospect: DealStage.PROSPECT,
  qualificacao: DealStage.QUALIFICACAO,
  proposta: DealStage.PROPOSTA_ENVIADA,
  negociacao: DealStage.NEGOCIACAO,
  ganho: DealStage.FECHADO_GANHO,
  perdido: DealStage.FECHADO_PERDIDO,
};

export interface SessionUser {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
}

export interface MissionCommand {
  text: string;
  correlationId?: string;
  document?: string;
  explicitOrganizationId?: string;
  slots?: SupervisorMission["request"]["slots"];
}

export interface CrmCommit {
  updated: string[];
  conflicts: string[];
}

interface Stored {
  accounts: Account[];
  executorCalls: Record<string, number>;
  metrics: Runtime["metrics"];
  seq: number;
  mission: SupervisorMission;
}

export function principalFromUser(user: SessionUser): Principal {
  const roles = [user.role.toLowerCase()];
  if (user.role === "ADMIN" || user.role === "MANAGER") roles.push("aprovador");
  return {
    id: user.userId,
    organizationId: user.organizationId,
    roles,
    displayName: user.email,
  };
}

/** Copia as capabilities da organização de referência do núcleo para o tenant real. Não copia dados. */
export function catalogFor(orgId: string, foreign: { id: string; name: string }[]): Catalog {
  const base = buildCatalog();
  const grants = base.grants
    .filter((grant) => grant.organizationId === "org-norte")
    .map((grant) => ({ ...grant, organizationId: orgId, id: `${grant.id}:${orgId}` }));
  return {
    ...base,
    grants,
    organizations: [
      { id: orgId, name: "organizacao atual", aliases: [] },
      ...foreign
        .filter((org) => org.name.trim().length >= 4)
        .map((org) => ({ id: org.id, name: org.name, aliases: [org.name.trim()] })),
    ],
  };
}

function snapshot(accounts: Account[]): Map<string, string> {
  return new Map(accounts.map((account) => [account.id, account.stage]));
}

async function commitStages(
  organizationId: string,
  userId: string,
  before: Map<string, string>,
  after: Account[],
): Promise<CrmCommit> {
  const updated: string[] = [];
  const conflicts: string[] = [];
  for (const account of after) {
    if (account.organizationId !== organizationId) {
      conflicts.push(account.id);
      continue;
    }
    const previous = before.get(account.id);
    if (!previous || previous === account.stage) continue;
    const from = TO_PRISMA[previous];
    const to = TO_PRISMA[account.stage];
    if (!from || !to) {
      conflicts.push(account.id);
      account.stage = previous;
      continue;
    }
    const result = await prisma.deal.updateMany({
      where: { id: account.id, organizationId, stage: from },
      data: { stage: to },
    });
    if (result.count !== 1) {
      conflicts.push(account.id);
      account.stage = previous;
      continue;
    }
    await prisma.dealStageHistory.create({
      data: {
        organizationId,
        dealId: account.id,
        fromStage: from,
        toStage: to,
        movedById: userId,
        notes: "Alteração aplicada pelo supervisor após aprovação humana.",
      },
    });
    updated.push(account.id);
  }
  return { updated, conflicts };
}

function noteCommit(mission: SupervisorMission, commit: CrmCommit): void {
  if (commit.conflicts.length === 0 && commit.updated.length === 0) return;
  mission.audit.push({
    id: `aud-crm-${mission.audit.length + 1}`,
    missionId: mission.id,
    at: new Date().toISOString(),
    actor: "supervisor",
    action: "crm_commit",
    detail:
      commit.conflicts.length === 0
        ? `Estágios gravados no CRM: ${commit.updated.join(", ")}.`
        : `CRM recusou ${commit.conflicts.join(", ")}. Nenhum desses estágios foi gravado.`,
    organizationId: mission.organizationId,
  });
  if (!mission.finalResult) return;
  if (commit.conflicts.length > 0) {
    mission.finalResult.limitations.push(
      "A gravação no CRM foi recusada porque o negócio não estava mais no estágio esperado. O banco não foi alterado nesse item.",
    );
    if (commit.updated.length === 0 && mission.status === "CONCLUIDA") {
      mission.status = "FALHOU";
      mission.finalResult.status = "FALHOU";
    }
  }
}

async function loadDeals(organizationId: string): Promise<Account[]> {
  const deals = await prisma.deal.findMany({
    where: { organizationId },
    select: { id: true, title: true, stage: true, amount: true },
  });
  return deals.map((deal) => ({
    id: deal.id,
    organizationId,
    name: deal.title,
    stage: TO_KERNEL[deal.stage] ?? "prospect",
    value: deal.amount,
  }));
}

async function foreignOrgs(organizationId: string) {
  return prisma.organization.findMany({
    where: { id: { not: organizationId } },
    select: { id: true, name: true },
  });
}

function hydrate(stored: Stored, catalog: Catalog): Runtime {
  const runtime = createRuntime();
  runtime.catalog = catalog;
  runtime.accounts = stored.accounts;
  runtime.executorCalls = stored.executorCalls;
  runtime.metrics = stored.metrics;
  runtime.seq = stored.seq;
  runtime.missions = [stored.mission];
  return runtime;
}

function capture(runtime: Runtime, mission: SupervisorMission): Stored {
  return {
    accounts: runtime.accounts.filter((account) => account.organizationId === mission.organizationId),
    executorCalls: runtime.executorCalls,
    metrics: runtime.metrics,
    seq: runtime.seq,
    mission,
  };
}

async function save(stored: Stored, userId: string): Promise<void> {
  const mission = stored.mission;
  const payload = stored as unknown as Prisma.InputJsonValue;
  await prisma.supervisorMissionRecord.upsert({
    where: { id: mission.id },
    create: {
      id: mission.id,
      organizationId: mission.organizationId,
      requestedById: userId,
      correlationId: mission.correlationId,
      status: mission.status,
      payload,
    },
    update: {
      status: mission.status,
      payload,
    },
  });
}

async function read(id: string, organizationId: string): Promise<Stored | null> {
  const row = await prisma.supervisorMissionRecord.findFirst({
    where: { id, organizationId },
  });
  if (!row) return null;
  return row.payload as unknown as Stored;
}

async function contextFor(user: SessionUser, accounts: Account[]) {
  const foreign = await foreignOrgs(user.organizationId);
  return {
    runtime: Object.assign(createRuntime(), {
      catalog: catalogFor(user.organizationId, foreign),
      accounts,
      missions: [] as SupervisorMission[],
      executorCalls: {} as Record<string, number>,
      metrics: {} as Runtime["metrics"],
      seq: 0,
    }),
  };
}

export async function startMission(user: SessionUser, command: MissionCommand) {
  if (command.correlationId) {
    const existing = await prisma.supervisorMissionRecord.findUnique({
      where: {
        organizationId_correlationId: {
          organizationId: user.organizationId,
          correlationId: command.correlationId,
        },
      },
    });
    if (existing) {
      const stored = existing.payload as unknown as Stored;
      return { mission: stored.mission, crmCommit: { updated: [], conflicts: [] } satisfies CrmCommit, replayed: true };
    }
  }
  const accounts = await loadDeals(user.organizationId);
  const { runtime } = await contextFor(user, accounts);
  const before = snapshot(runtime.accounts);
  const mission = submit(runtime, {
    text: command.text,
    principal: principalFromUser(user),
    correlationId: command.correlationId,
    document: command.document,
    explicitOrganizationId: command.explicitOrganizationId,
    slots: command.slots,
  });
  const crmCommit = await commitStages(user.organizationId, user.userId, before, runtime.accounts);
  noteCommit(mission, crmCommit);
  await save(capture(runtime, mission), user.userId);
  return { mission, crmCommit, replayed: false };
}

async function withStored(
  user: SessionUser,
  missionId: string,
  run: (runtime: Runtime, mission: SupervisorMission) => SupervisorMission | null,
) {
  const stored = await read(missionId, user.organizationId);
  if (!stored) return null;
  const foreign = await foreignOrgs(user.organizationId);
  const runtime = hydrate(stored, catalogFor(user.organizationId, foreign));
  const before = snapshot(runtime.accounts);
  const mission = run(runtime, stored.mission);
  if (!mission) return { mission: null, crmCommit: { updated: [], conflicts: [] } satisfies CrmCommit };
  const crmCommit = await commitStages(user.organizationId, user.userId, before, runtime.accounts);
  noteCommit(mission, crmCommit);
  await save(capture(runtime, mission), stored.mission.requesterId);
  return { mission, crmCommit };
}

export async function approveMission(
  user: SessionUser,
  missionId: string,
  approvalId: string,
  decision: "aprovada" | "rejeitada",
) {
  const stored = await read(missionId, user.organizationId);
  if (!stored) return null;
  const foreign = await foreignOrgs(user.organizationId);
  const runtime = hydrate(stored, catalogFor(user.organizationId, foreign));
  const before = snapshot(runtime.accounts);
  const result = decideApproval(runtime, missionId, approvalId, decision, principalFromUser(user));
  if (!result.mission) return { mission: null, ok: false, error: result.error, crmCommit: { updated: [], conflicts: [] } };
  const crmCommit = await commitStages(user.organizationId, user.userId, before, runtime.accounts);
  noteCommit(result.mission, crmCommit);
  await save(capture(runtime, result.mission), stored.mission.requesterId);
  return { mission: result.mission, ok: result.ok, error: result.error, crmCommit };
}

export function resumeMission(user: SessionUser, missionId: string) {
  return withStored(user, missionId, (runtime) => resume(runtime, missionId, principalFromUser(user)));
}

export function cancelMission(user: SessionUser, missionId: string) {
  return withStored(user, missionId, (runtime) => cancel(runtime, missionId, principalFromUser(user)));
}

export function addMissionData(
  user: SessionUser,
  missionId: string,
  slots: SupervisorMission["request"]["slots"],
) {
  return withStored(user, missionId, (runtime) =>
    provideData(runtime, missionId, principalFromUser(user), slots),
  );
}

export async function listMissionSummaries(organizationId: string) {
  const rows = await prisma.supervisorMissionRecord.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, status: true, correlationId: true, createdAt: true, updatedAt: true, payload: true },
  });
  return rows.map((row) => {
    const stored = row.payload as unknown as Stored;
    return {
      id: row.id,
      status: row.status,
      correlationId: row.correlationId,
      objective: stored.mission.objective,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}

export async function getMission(organizationId: string, missionId: string) {
  const stored = await read(missionId, organizationId);
  return stored?.mission ?? null;
}
