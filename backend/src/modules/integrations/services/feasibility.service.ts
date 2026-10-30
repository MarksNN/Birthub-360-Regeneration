import { IntegrationSquad } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { IntegrationNotFoundError } from '../domain/errors';
import { IntegrationActor } from '../domain/actor';
import { ConnectorRegistry } from '../sdk/registry';

export interface AssessFeasibilityInput {
  hasOfficialApi?: boolean;
  documentationUrl?: string;
  authMethods?: string[];
  rateLimitNotes?: string;
  supportsWebhooks?: boolean;
  readCapabilities?: string[];
  writeCapabilities?: string[];
  licensingDependencies?: string;
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'UNKNOWN';
  verdict?: 'FEASIBLE' | 'FEASIBLE_WITH_RESTRICTIONS' | 'NOT_FEASIBLE' | 'UNDETERMINED';
  risks?: string[];
  uncertainties?: string[];
  requiresPaidDiscovery?: boolean;
}

export class IntegrationFeasibilityService {
  /**
   * Identifica o Squad adequado com base no objetivo e no provedor.
   */
  public static resolveSquad(toolOrProvider: string, category?: string): IntegrationSquad {
    const text = `${toolOrProvider} ${category || ''}`.toLowerCase();

    if (/crm|bitrix|hubspot|pipedrive|salesforce|rd station|lead|deal|oportunidade/i.test(text)) {
      return IntegrationSquad.CRM_INTEGRATION;
    }
    if (/erp|sap|totvs|omie|conta azul|faturamento|financeiro|pagamento|boleto|pix|stripe|asaas/i.test(text)) {
      return IntegrationSquad.FINANCIAL_INTEGRATION;
    }
    if (/enriquecimento|cnpj|receita|clearbit|serasa|neoway|data|mercado/i.test(text)) {
      return IntegrationSquad.DATA_INTELLIGENCE;
    }
    if (/email|e-mail|whatsapp|telefonia|voip|twilio|zenvia|atendimento|chat/i.test(text)) {
      return IntegrationSquad.COMMUNICATION;
    }
    if (/llm|openai|gemini|anthropic|claude|embedding|modelo|ia/i.test(text)) {
      return IntegrationSquad.AI_PROVIDER;
    }
    if (/calendario|calendar|google drive|docs|sheets|notion|slack|trello/i.test(text)) {
      return IntegrationSquad.PRODUCTIVITY;
    }

    return IntegrationSquad.CUSTOM_ENTERPRISE;
  }

  /**
   * Avalia a viabilidade técnica de uma solicitação de integração.
   */
  public static async assessFeasibility(
    projectId: string,
    organizationId: string,
    input: AssessFeasibilityInput,
    actor: IntegrationActor
  ) {
    const project = await prisma.integrationProject.findFirst({
      where: { id: projectId, organizationId },
      include: {
        discovery: true,
        provider: true
      }
    });

    if (!project) throw new IntegrationNotFoundError('Projeto');

    const disc = project.discovery;
    const toolName = disc?.toolName || project.title;

    // Squad resolvido
    const squad = project.squad || IntegrationFeasibilityService.resolveSquad(toolName, project.provider?.category);

    // Verificar se existe conector já homologado no registro do SDK
    const registry = ConnectorRegistry.getInstance();
    const reusableConnectors = registry
      .list()
      .filter((c) => c.manifest.providerKey.toLowerCase() === toolName.toLowerCase() || c.manifest.category === project.provider?.category)
      .map((c) => c.manifest.id);

    // Determinar contagem de versão de viabilidade
    const prevCount = await prisma.integrationFeasibilityAssessment.count({
      where: { projectId }
    });
    const version = prevCount + 1;

    // Avaliar veredito e complexidade padrão se não fornecidos explicitamente
    let verdict = input.verdict;
    let complexity = input.complexity;

    if (!verdict) {
      if (input.hasOfficialApi === false) {
        verdict = 'NOT_FEASIBLE';
        complexity = 'VERY_HIGH';
      } else if (input.uncertainties && input.uncertainties.length > 2) {
        verdict = 'UNDETERMINED';
        complexity = 'UNKNOWN';
      } else if (input.risks && input.risks.length > 2) {
        verdict = 'FEASIBLE_WITH_RESTRICTIONS';
        complexity = complexity || 'HIGH';
      } else {
        verdict = 'FEASIBLE';
        complexity = complexity || 'MEDIUM';
      }
    }

    const assessment = await prisma.integrationFeasibilityAssessment.create({
      data: {
        organizationId,
        projectId,
        version,
        verdict,
        complexity: complexity || 'MEDIUM',
        hasOfficialApi: input.hasOfficialApi !== undefined ? input.hasOfficialApi : true,
        documentationUrl: input.documentationUrl || project.provider?.documentationUrl || null,
        authMethods: input.authMethods || project.provider?.authMethods || ['API_KEY'],
        rateLimitNotes: input.rateLimitNotes || project.provider?.rateLimitNotes || 'Sob limites padrão da API',
        supportsWebhooks: input.supportsWebhooks !== undefined ? input.supportsWebhooks : project.provider?.supportsWebhooks,
        readCapabilities: input.readCapabilities || ['read', 'search'],
        writeCapabilities: input.writeCapabilities || ['create', 'update'],
        licensingDependencies: input.licensingDependencies || null,
        risks: (input.risks || [
          'Possível latência em cargas volumosas',
          'Dependência de estabilidade da API de terceiros'
        ]) as any,
        uncertainties: (input.uncertainties || []) as any,
        reusableConnectorIds: reusableConnectors,
        requiresPaidDiscovery: !!input.requiresPaidDiscovery,
        assessedBy: [
          { role: 'Feasibility Architect', squad, agentCode: 'api-integration-builder' },
          { role: 'API Research Agent', squad, agentCode: 'coordinator-commercial' }
        ] as any
      }
    });

    // Atualizar squad no projeto
    await prisma.integrationProject.update({
      where: { id: projectId },
      data: { squad }
    });

    return assessment;
  }
}
