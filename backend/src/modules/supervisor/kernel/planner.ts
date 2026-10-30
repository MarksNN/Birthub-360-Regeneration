import type { Catalog, Slots, WorkflowDefinition } from "./types";
import { norm } from "./text";
import { ALLOWED_STAGES } from "./seed";

export interface PlanDraft {
  workflow: WorkflowDefinition | null;
  objective: string;
  slots: Slots;
  missing: string[];
  gap: string | null;
}

const SLOT_LABEL: Record<keyof Slots, string> = {
  accountId: "identificador da conta",
  newStage: "estágio de destino",
  requestedSystem: "nome do sistema",
};

export function extractSlots(text: string): Slots {
  const folded = norm(text);
  const accountId =
    text.match(/\b(acc-[a-z0-9-]+)\b/i)?.[1] ??
    text.match(/\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i)?.[1];
  const explicit = folded.match(/estagio para ([a-z_]+)/);
  const loose = folded.match(/para (qualificacao|proposta|negociacao|ganho|perdido)/);
  const stage = explicit?.[1] ?? loose?.[1];
  const newStage = stage && ALLOWED_STAGES.includes(stage) ? stage : stage;
  const system = text.match(/integre o ([A-Za-z0-9]+)/i)?.[1];
  return {
    accountId,
    newStage,
    requestedSystem: system,
  };
}

function specificity(workflow: WorkflowDefinition): number {
  const match = workflow.match;
  return (match.all?.length ?? 0) + (match.any?.length ?? 0) + workflow.priority;
}

function matches(text: string, workflow: WorkflowDefinition): boolean {
  const haystack = norm(text);
  const match = workflow.match;
  if (match.none?.some((phrase) => haystack.includes(norm(phrase)))) return false;
  if (match.all && !match.all.every((phrase) => haystack.includes(norm(phrase)))) return false;
  if (match.any && !match.any.some((phrase) => haystack.includes(norm(phrase)))) return false;
  if (!match.all?.length && !match.any?.length) return false;
  return true;
}

export function selectWorkflow(catalog: Catalog, text: string): WorkflowDefinition | null {
  const matched = catalog.workflows.filter((workflow) => matches(text, workflow));
  matched.sort((left, right) => specificity(right) - specificity(left));
  return matched[0] ?? null;
}

export function planText(catalog: Catalog, text: string, provided: Slots): PlanDraft {
  const extracted = extractSlots(text);
  const slots: Slots = {
    accountId: provided.accountId ?? extracted.accountId,
    newStage: provided.newStage ?? extracted.newStage,
    requestedSystem: provided.requestedSystem ?? extracted.requestedSystem,
  };
  const workflow = selectWorkflow(catalog, text);
  if (!workflow) {
    return {
      workflow: null,
      objective: text.trim(),
      slots,
      missing: [],
      gap: "Nenhuma habilidade do catálogo cobre este pedido.",
    };
  }
  const missing = new Set<string>();
  for (const step of workflow.steps) {
    for (const need of step.needs) {
      const value = slots[need];
      if (!value) missing.add(SLOT_LABEL[need]);
    }
  }
  if (slots.newStage && !ALLOWED_STAGES.includes(slots.newStage)) {
    missing.add("estágio de destino reconhecido");
  }
  return {
    workflow,
    objective: text.trim(),
    slots,
    missing: [...missing],
    gap: null,
  };
}
