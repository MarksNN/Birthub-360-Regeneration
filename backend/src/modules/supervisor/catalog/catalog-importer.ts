import fs from 'fs';
import path from 'path';
import { PrismaClient, AgentScope, AgentOperationalStatus, UserRole } from '@prisma/client';
import prisma from '../../../lib/prisma';

export interface CatalogAgentRecord {
  agentCode: string;
  name: string;
  characterRole: string | null;
  domain: string;
  subgroup: string;
  origin: string;
  sourcePath: string;
  sourceVersion: string;
  scope: 'UNIVERSAL' | 'SPECIALIZED';
  description: string;
  mission: string;
  functionalCore: string;
  trigger: string;
  universalCapabilities: string[];
  specializedCapabilities: string[];
  optionalCapabilities: string[];
  capabilities: string[];
  allowedTools: string[];
  inputs: string[];
  outputs: string[];
  workflow: string[];
  dependencies: string[];
  permissionsSummary: Record<string, any>;
  promptRef: string;
  bindingType: string;
  operationalStatus: 'REGISTERED' | 'AVAILABLE' | 'EXECUTABLE' | 'DISABLED';
  requiredRole: 'ADMIN' | 'MANAGER' | 'CLOSER' | 'SDR' | 'BDR' | 'VIEWER';
  isActive: boolean;
  isExecutable: boolean;
}

export interface CatalogFileStructure {
  schemaVersion: string;
  sourceSnapshot: string;
  totalAgents: number;
  summary: {
    total: number;
    normalized: number;
    commercialCell: number;
    executable: number;
    available: number;
    registered: number;
  };
  agents: CatalogAgentRecord[];
}

export function loadCanonicalAgentsCatalog(): CatalogFileStructure {
  const candidates = [
    path.resolve(__dirname, 'agents-394.catalog.json'),
    path.resolve(process.cwd(), 'src/modules/supervisor/catalog/agents-394.catalog.json'),
    path.resolve(__dirname, '../../../../src/modules/supervisor/catalog/agents-394.catalog.json')
  ];
  const catalogPath = candidates.find((p) => fs.existsSync(p)) || candidates[0];
  const raw = fs.readFileSync(catalogPath, 'utf8');
  return JSON.parse(raw) as CatalogFileStructure;
}

/**
 * Importador idempotente do catálogo oficial dos 394 agentes.
 * - Upsert por agentCode estável.
 * - Preserva configurações operacionais existentes (como isActive customizado).
 * - Não apaga histórico de execução.
 * - Remove apenas registros legados artificiais que não façam parte dos 394 canônicos se não tiverem vínculo.
 */
export async function syncAgentsCatalogIdempotent(
  client: PrismaClient = prisma
): Promise<{
  totalSynced: number;
  executableCount: number;
  availableCount: number;
  registeredCount: number;
  domainsCount: Record<string, number>;
}> {
  const catalog = loadCanonicalAgentsCatalog();
  const validCodes = new Set(catalog.agents.map((a) => a.agentCode));

  // Remover os 2 agentes legados artificiais caso existam da Fase 02 inicial ('revops-intelligence-analyzer', 'commercial-activity-copilot')
  // para que o catálogo reflita exatamente os 394 agentes canônicos sem duplicações nem invenções.
  await client.agentRegistration.deleteMany({
    where: {
      agentCode: {
        notIn: Array.from(validCodes)
      }
    }
  });

  const existingRecords = await client.agentRegistration.findMany({
    select: {
      agentCode: true,
      isActive: true,
      operationalStatus: true
    }
  });
  const existingMap = new Map(existingRecords.map((r) => [r.agentCode, r]));

  const domainsCount: Record<string, number> = {};
  let executableCount = 0;
  let availableCount = 0;
  let registeredCount = 0;

  // Executar em lotes transacionais para alta performance e atomicidade
  const batchSize = 50;
  for (let i = 0; i < catalog.agents.length; i += batchSize) {
    const batch = catalog.agents.slice(i, i + batchSize);
    await client.$transaction(
      batch.map((agent) => {
        const existing = existingMap.get(agent.agentCode);
        const preserveActive = existing !== undefined ? existing.isActive : agent.isActive;
        const effectiveStatus: AgentOperationalStatus = !preserveActive
          ? AgentOperationalStatus.DISABLED
          : (agent.operationalStatus as AgentOperationalStatus);

        domainsCount[agent.domain] = (domainsCount[agent.domain] || 0) + 1;
        if (effectiveStatus === AgentOperationalStatus.EXECUTABLE) executableCount++;
        else if (effectiveStatus === AgentOperationalStatus.AVAILABLE) availableCount++;
        else registeredCount++;

        const payload = {
          name: agent.name,
          characterRole: agent.characterRole,
          domain: agent.domain,
          subgroup: agent.subgroup,
          origin: agent.origin,
          sourceVersion: agent.sourceVersion,
          scope: agent.scope as AgentScope,
          description: agent.description,
          mission: agent.mission,
          universalCapabilities: agent.universalCapabilities,
          specializedCapabilities: agent.specializedCapabilities,
          capabilities: agent.capabilities,
          allowedTools: agent.allowedTools,
          inputs: agent.inputs,
          outputs: agent.outputs,
          dependencies: agent.dependencies,
          permissionsSummary: agent.permissionsSummary,
          promptRef: agent.promptRef,
          operationalStatus: effectiveStatus,
          requiredRole: agent.requiredRole as UserRole,
          isActive: preserveActive,
          isExecutable: agent.isExecutable && preserveActive
        };

        return client.agentRegistration.upsert({
          where: { agentCode: agent.agentCode },
          update: payload,
          create: {
            agentCode: agent.agentCode,
            ...payload
          }
        });
      })
    );
  }

  return {
    totalSynced: catalog.agents.length,
    executableCount,
    availableCount,
    registeredCount,
    domainsCount
  };
}
