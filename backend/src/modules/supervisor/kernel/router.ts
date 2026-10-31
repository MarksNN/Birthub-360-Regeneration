import { hasGrant } from "./governance";
import type { Principal, Runtime, SkillDefinition } from "./types";

export interface RoutingDecision {
  specialistId: string | null;
  reasons: string[];
  eligible: string[];
  rejected: { specialistId: string; reason: string }[];
}

export function routeSkill(
  runtime: Runtime,
  principal: Principal,
  skill: SkillDefinition,
): RoutingDecision {
  const reasons: string[] = [];
  const rejected: RoutingDecision["rejected"] = [];
  const associated = runtime.catalog.specialists.filter(
    (specialist) =>
      specialist.id === skill.ownerAgentId || specialist.skillIds.includes(skill.id),
  );
  const eligible = associated.filter((specialist) => {
    const allowed = hasGrant(
      runtime.catalog,
      specialist.id,
      skill.id,
      principal.organizationId,
    );
    if (!allowed) {
      rejected.push({
        specialistId: specialist.id,
        reason: "Habilidade catalogada sem capability concedida nesta organização.",
      });
      return false;
    }
    return true;
  });

  const toolDown = skill.toolIds.some((toolId) => {
    const tool = runtime.catalog.tools.find((item) => item.id === toolId);
    return !tool || !tool.available;
  });

  if (eligible.length === 0) {
    reasons.push("Nenhum especialista com capability concedida para esta habilidade.");
    if (toolDown) reasons.push("A ferramenta exigida também está indisponível.");
    return { specialistId: null, reasons, eligible: [], rejected };
  }

  const ranked = [...eligible].sort((left, right) => {
    const leftFailures = runtime.metrics[left.id]?.failures ?? 0;
    const rightFailures = runtime.metrics[right.id]?.failures ?? 0;
    if (leftFailures !== rightFailures) return leftFailures - rightFailures;
    if (left.id === skill.ownerAgentId) return -1;
    if (right.id === skill.ownerAgentId) return 1;
    return left.id.localeCompare(right.id);
  });
  const chosen = ranked[0];
  if (!chosen) {
    return { specialistId: null, reasons, eligible: [], rejected };
  }
  reasons.push(`Habilidade ${skill.id} corresponde ao pedido.`);
  reasons.push(`Capability concedida em ${principal.organizationId}.`);
  if (chosen.id === skill.ownerAgentId) {
    reasons.push("Agente responsável selecionado.");
  } else {
    reasons.push(
      "Agente responsável tem mais falhas recentes. A alternativa elegível foi selecionada.",
    );
  }
  if (toolDown) {
    reasons.push("Ferramenta indisponível. A execução não será simulada.");
  }
  if (skill.requiresApproval) {
    reasons.push("Risco exige aprovação humana antes da ação.");
  }
  reasons.push("Latência histórica não registrada. Critério neutro.");
  return {
    specialistId: chosen.id,
    reasons,
    eligible: ranked.map((item) => item.id),
    rejected,
  };
}
