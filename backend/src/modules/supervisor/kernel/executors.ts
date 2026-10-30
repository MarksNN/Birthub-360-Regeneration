import { findInjection } from "./governance";
import { ALLOWED_STAGES, STAGE_WEIGHT } from "./seed";
import type { Catalog, ExecContext, ExecOutput } from "./types";

export type Executor = (context: ExecContext, catalog: Catalog) => ExecOutput;

function untrusted(values: string[]): boolean {
  return findInjection(values).length > 0;
}

export const EXECUTORS: Record<string, Executor> = {
  "exec.pipeline.read"(context) {
    const names = context.accounts.map((account) => account.name);
    const suspect = untrusted(names);
    return {
      outcome: "sucesso",
      output: context.accounts.map((account) => ({
        id: account.id,
        name: account.name,
        stage: account.stage,
        value: account.value,
      })),
      evidence: [
        {
          kind: "fato",
          source: "repositorio.contas",
          untrusted: suspect,
          summary: suspect
            ? `Pipeline com ${context.accounts.length} contas da organização. Texto externo no cadastro foi mantido como dado, sem efeito de política.`
            : `Pipeline com ${context.accounts.length} contas da organização.`,
          payload: { organizationId: context.organizationId, count: context.accounts.length },
        },
      ],
    };
  },

  "exec.records.read"(context) {
    const accountId = context.inputs.accountId;
    const rows = accountId
      ? context.accounts.filter((account) => account.id === accountId)
      : context.accounts;
    if (accountId && rows.length === 0) {
      return {
        outcome: "falha",
        error: "Conta não encontrada na organização do solicitante.",
        evidence: [
          {
            kind: "lacuna",
            source: "repositorio.contas",
            untrusted: false,
            summary: "A conta pedida não existe na organização do principal.",
          },
        ],
      };
    }
    return {
      outcome: "sucesso",
      output: rows,
      evidence: [
        {
          kind: "fato",
          source: "repositorio.contas",
          untrusted: untrusted(rows.map((row) => row.name)),
          summary: accountId
            ? `Conta ${accountId} está em ${rows[0]?.stage}.`
            : `Consulta devolveu ${rows.length} contas locais.`,
        },
      ],
    };
  },

  "exec.records.write"(context) {
    if (!context.approvalGranted) {
      return {
        outcome: "aguardando_aprovacao",
        error: "Executor de escrita chamado sem aprovação válida.",
        evidence: [
          {
            kind: "bloqueio",
            source: "exec.records.write",
            untrusted: false,
            summary: "Escrita recusada no executor por ausência de aprovação.",
          },
        ],
      };
    }
    const accountId = context.inputs.accountId;
    const newStage = context.inputs.newStage;
    if (!accountId || !newStage) {
      return {
        outcome: "falha",
        error: "Entradas obrigatórias ausentes.",
        evidence: [
          {
            kind: "lacuna",
            source: "exec.records.write",
            untrusted: false,
            summary: "Conta ou estágio não informados.",
          },
        ],
      };
    }
    if (!ALLOWED_STAGES.includes(newStage)) {
      return {
        outcome: "falha",
        error: "Estágio fora da lista permitida.",
        evidence: [
          {
            kind: "bloqueio",
            source: "exec.records.write",
            untrusted: false,
            summary: "Estágio rejeitado pela regra do repositório.",
          },
        ],
      };
    }
    const account = context.accounts.find((item) => item.id === accountId);
    if (!account) {
      return {
        outcome: "falha",
        error: "Conta não encontrada na organização do solicitante.",
        evidence: [
          {
            kind: "lacuna",
            source: "repositorio.contas",
            untrusted: false,
            summary: "Escrita não aplicada. Conta ausente nesta organização.",
          },
        ],
      };
    }
    return {
      outcome: "sucesso",
      mutations: [{ id: account.id, stage: newStage, previousStage: account.stage }],
      output: { id: account.id, from: account.stage, to: newStage },
      evidence: [
        {
          kind: "fato",
          source: "repositorio.contas",
          untrusted: false,
          summary: `Estágio de ${account.id} alterado de ${account.stage} para ${newStage}.`,
          payload: { from: account.stage, to: newStage },
        },
      ],
    };
  },

  "exec.forecast"(context) {
    const rows = context.accounts.map((account) => {
      const weight = STAGE_WEIGHT[account.stage] ?? 0;
      return {
        id: account.id,
        stage: account.stage,
        value: account.value,
        weight,
        weighted: Math.round(account.value * weight),
      };
    });
    const total = rows.reduce((sum, row) => sum + row.weighted, 0);
    return {
      outcome: "sucesso",
      output: { total, rows, label: "estimativa" },
      evidence: [
        {
          kind: "estimativa",
          source: "calculo.local",
          untrusted: false,
          summary: `Receita ponderada estimada em ${total}. Pesos: qualificacao 0,2; proposta 0,4; negociacao 0,6; ganho 1; perdido 0.`,
          payload: { total, rows },
        },
      ],
    };
  },

  "exec.feasibility"(context, catalog) {
    const system = context.inputs.requestedSystem ?? "sistema não nomeado";
    const known = catalog.tools.some(
      (tool) => tool.available && normIncludes(tool.name, system),
    );
    return {
      outcome: "sucesso",
      output: {
        system,
        connectorAvailable: known,
        implemented: false,
        scope: [
          "Confirmar dono do processo e dados mínimos.",
          "Homologar executor e binding antes de qualquer chamada.",
          "Definir aprovação para ações de escrita no sistema externo.",
        ],
      },
      evidence: [
        {
          kind: "recomendacao",
          source: "catalogo.ferramentas",
          untrusted: false,
          summary: known
            ? `${system} já tem ferramenta disponível. Ainda assim esta habilidade não liga o conector.`
            : `${system} não tem conector no catálogo. Viabilidade registrada. Integração não implementada.`,
          payload: { system, implemented: false, connectorAvailable: known },
        },
      ],
    };
  },

  "exec.audit"(context) {
    return {
      outcome: "sucesso",
      output: { evidenceCount: context.priorEvidence.length },
      evidence: [
        {
          kind: "fato",
          source: "missao.evidencias",
          untrusted: context.priorEvidence.some((item) => item.untrusted),
          summary: `Trilha conferida com ${context.priorEvidence.length} evidências das tarefas dependentes. Nenhuma permissão foi alterada.`,
        },
      ],
    };
  },
};

function normIncludes(left: string, right: string): boolean {
  return left.toLowerCase().includes(right.toLowerCase());
}
