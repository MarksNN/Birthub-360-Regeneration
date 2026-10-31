import { CommercialCatalogV31 } from './catalog';
import { AgentIdV31, ContextAssemblerResult } from './types';

export class CommercialContextAssemblerV31 {
  /**
   * Monta o contexto de execução de um especialista de acordo com as regras operacionais V3.1:
   * - Injeção do CORE_COMPARTILHADO_V3_1 UMA VEZ
   * - Injeção do prompt fixo do especialista
   * - Injeção OBRIGATÓRIA do índice de skills (não é grant)
   * - Injeção do contrato obrigatório JSON V3.1
   * - Discovery sob demanda: carrega SOMENTE os playbooks mapeados para as skillIds solicitadas
   * - Se o playbook estiver ausente, fallback para contingência consultiva do prompt local
   * - Bloqueio de bootstrap operacional (`operationalAllowedByBootstrap: false`)
   */
  public static assemble(
    agentId: AgentIdV31,
    skillIds: string[] = []
  ): ContextAssemblerResult {
    const catalog = CommercialCatalogV31.getInstance();
    const agent = catalog.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agente desconhecido: "${agentId}"`);
    }

    const agentIndex = catalog.getAgentIndex(agentId);
    if (!agentIndex) {
      throw new Error(`Índice de habilidades não encontrado para o agente "${agentId}"`);
    }

    const existingSkillsMap = new Map(agentIndex.skills.map((s) => [s.id, s]));

    if (existingSkillsMap.size !== agentIndex.skillCount || existingSkillsMap.size !== agent.skills) {
      throw new Error(`Índice inconsistente para agente "${agentId}": esperado ${agent.skills}, encontrado ${existingSkillsMap.size}`);
    }

    for (const sid of skillIds) {
      if (!existingSkillsMap.has(sid)) {
        throw new Error(`SkillId "${sid}" não pertence ao agente "${agentId}"`);
      }
    }

    const corePrompt = catalog.readCorePrompt();
    const agentPrompt = catalog.readAgentPrompt(agentId);

    const skillsJsonString = JSON.stringify(agentIndex.skills, null, 2);

    const chunks: string[] = [
      corePrompt,
      agentPrompt,
      `ÍNDICE OBRIGATÓRIO DE SKILLS (não é grant):\n${skillsJsonString}`,
      'CONTRATO OBRIGATÓRIO JSON V3.1: resumo_humano sempre, UNKNOWN quando sem comprovação, nenhuma ação real sem backend.'
    ];

    const targetPlaybookIds = Array.from(
      new Set(
        skillIds
          .map((sid) => existingSkillsMap.get(sid)?.playbookId)
          .filter((pbId): pbId is string => Boolean(pbId))
      )
    ).sort();

    const loadedPlaybooks: string[] = [];
    const missingPlaybooks: string[] = [];

    for (const pbId of targetPlaybookIds) {
      const content = catalog.readPlaybookContent(agentId, pbId);
      if (!content) {
        chunks.push(`PLAYBOOK AUSENTE ${pbId}: usar CONTINGÊNCIA CONSULTIVA do prompt, não executar ação real.`);
        missingPlaybooks.push(pbId);
      } else {
        chunks.push(`PLAYBOOK ${pbId}:\n${content}`);
        loadedPlaybooks.push(pbId);
      }
    }

    const fullPrompt = chunks.join('\n\n---\n\n');

    return {
      fullPrompt,
      flags: {
        agentId,
        indexInjected: true,
        schemaReady: true,
        loadedPlaybooks,
        missingPlaybooks,
        operationalAllowedByBootstrap: false
      }
    };
  }
}
