import { PrismaClient, AgentScope, AgentOperationalStatus, UserRole } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { CommercialCatalogV31 } from './catalog';

export interface SyncV31Report {
  totalSynced: number;
  availableCount: number;
  executableCount: number;
  agents: { id: string; name: string; skillsCount: number }[];
}

/**
 * Sincronizador idempotente da Matriz Comercial V3.1 com o banco de dados.
 * Registra os 19 especialistas com suas respectivas capacidades e playbooks canônicos.
 */
export async function syncCommercialV31CatalogToDatabase(
  client: PrismaClient = prisma
): Promise<SyncV31Report> {
  const catalog = CommercialCatalogV31.getInstance();
  const agentsMeta = catalog.getAgents();

  const syncedAgents: { id: string; name: string; skillsCount: number }[] = [];

  for (const agent of agentsMeta) {
    const agentIndex = catalog.getAgentIndex(agent.id);
    const skills = agentIndex?.skills || [];
    const skillIds = skills.map((s) => s.id);
    const playbookIds = agentIndex?.playbooks.map((p) => p.id) || [];

    const agentCode = `comercial-v31-${agent.id}`;
    const isSupervisor = agent.id === 'supervisor';

    await client.agentRegistration.upsert({
      where: { agentCode },
      update: {
        name: agent.name,
        characterRole: `Especialista Comercial V3.1 — ${agent.name}`,
        domain: 'COMERCIAL_V3_1',
        subgroup: isSupervisor ? 'SUPERVISAO_E_ORQUESTRACAO' : 'EXECUCAO_ESPECIALIZADA',
        origin: 'MATRIZ_COMERCIAL_V3_1_CANONICA',
        sourceVersion: '3.1.0',
        scope: isSupervisor ? AgentScope.UNIVERSAL : AgentScope.SPECIALIZED,
        description: `Especialista oficial da Matriz Comercial V3.1 (${skills.length} habilidades, ${playbookIds.length} playbooks).`,
        mission: `Execução canônica das diretrizes operacionais de ${agent.name}.`,
        capabilities: skillIds,
        specializedCapabilities: skillIds,
        allowedTools: playbookIds.map((p) => `playbook.${agent.id}.${p}`),
        promptRef: agent.prompt,
        operationalStatus: AgentOperationalStatus.AVAILABLE,
        requiredRole: isSupervisor ? UserRole.MANAGER : UserRole.SDR,
        isActive: true,
        isExecutable: false // Por segurança: bootstrap operacional requer aprovação e grant explícito
      },
      create: {
        agentCode,
        name: agent.name,
        characterRole: `Especialista Comercial V3.1 — ${agent.name}`,
        domain: 'COMERCIAL_V3_1',
        subgroup: isSupervisor ? 'SUPERVISAO_E_ORQUESTRACAO' : 'EXECUCAO_ESPECIALIZADA',
        origin: 'MATRIZ_COMERCIAL_V3_1_CANONICA',
        sourceVersion: '3.1.0',
        scope: isSupervisor ? AgentScope.UNIVERSAL : AgentScope.SPECIALIZED,
        description: `Especialista oficial da Matriz Comercial V3.1 (${skills.length} habilidades, ${playbookIds.length} playbooks).`,
        mission: `Execução canônica das diretrizes operacionais de ${agent.name}.`,
        capabilities: skillIds,
        specializedCapabilities: skillIds,
        allowedTools: playbookIds.map((p) => `playbook.${agent.id}.${p}`),
        promptRef: agent.prompt,
        operationalStatus: AgentOperationalStatus.AVAILABLE,
        requiredRole: isSupervisor ? UserRole.MANAGER : UserRole.SDR,
        isActive: true,
        isExecutable: false
      }
    });

    syncedAgents.push({
      id: agent.id,
      name: agent.name,
      skillsCount: skills.length
    });
  }

  return {
    totalSynced: syncedAgents.length,
    availableCount: syncedAgents.length,
    executableCount: 0,
    agents: syncedAgents
  };
}
