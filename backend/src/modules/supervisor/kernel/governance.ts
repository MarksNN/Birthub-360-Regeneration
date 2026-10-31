import type { Catalog, Principal, SkillDefinition } from "./types";
import { norm } from "./text";

const INJECTION: RegExp[] = [
  /ignore\s+(all|previous|anteriores|as anteriores)/i,
  /you are now/i,
  /voce agora e/i,
  /grant yourself/i,
  /conceda permiss/i,
  /approve all/i,
  /aprove tudo/i,
  /system prompt/i,
  /<\s*\/?\s*system\s*>/i,
];

export function findInjection(parts: Array<string | undefined>): string[] {
  const hits: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const folded = norm(part);
    for (const pattern of INJECTION) {
      pattern.lastIndex = 0;
      if (pattern.test(part) || pattern.test(folded)) {
        hits.push(pattern.source);
      }
    }
  }
  return hits;
}

export function sanitizeInstruction(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((sentence) => findInjection([sentence]).length === 0);
  const cleaned = kept.join(" ").trim();
  return cleaned || text;
}

export function detectForeignOrganization(
  catalog: Catalog,
  principal: Principal,
  text: string,
  explicitOrganizationId?: string,
): string | null {
  if (explicitOrganizationId && explicitOrganizationId !== principal.organizationId) {
    return explicitOrganizationId;
  }
  const haystack = norm(text);
  for (const organization of catalog.organizations) {
    if (organization.id === principal.organizationId) continue;
    for (const alias of organization.aliases) {
      if (alias && haystack.includes(norm(alias))) return organization.id;
    }
  }
  return null;
}

export function isApprover(principal: Principal): boolean {
  return principal.roles.includes("aprovador");
}

export function sameOrganization(principal: Principal, organizationId: string): boolean {
  return principal.organizationId === organizationId;
}

export function skillOperational(skill: SkillDefinition): boolean {
  return skill.status === "implementada" || skill.status === "verificada";
}

export function hasGrant(
  catalog: Catalog,
  agentId: string,
  skillId: string,
  organizationId: string,
): boolean {
  return catalog.grants.some(
    (grant) =>
      grant.agentId === agentId &&
      grant.skillId === skillId &&
      grant.organizationId === organizationId,
  );
}
