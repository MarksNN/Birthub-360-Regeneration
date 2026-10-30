import { ChangeRequestStatus, ProposalKind, ProposalVersionStatus } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { IntegrationNotFoundError, CommercialLockError } from '../domain/errors';
import { IntegrationActor } from '../domain/actor';
import { IntegrationCommercialEngine, EffortBreakdown } from '../commercial/pricing.engine';
import { ProposalArtifactGenerator } from '../commercial/proposal.generator';
import { hashDocument } from '../domain/hash';

export interface RegisterChangeRequestInput {
  description: string;
  deltaEffort: EffortBreakdown;
  deltaDays: number;
}

export class IntegrationChangeRequestService {
  /**
   * Registra uma solicitação de alteração de escopo (Change Request)
   * sem alterar silenciosamente o escopo contratado do projeto original.
   */
  public static async registerChangeRequest(
    projectId: string,
    organizationId: string,
    input: RegisterChangeRequestInput,
    actor: IntegrationActor
  ) {
    const project = await prisma.integrationProject.findFirst({
      where: { id: projectId, organizationId },
      include: {
        scopes: { orderBy: { version: 'desc' }, take: 1 }
      }
    });

    if (!project) throw new IntegrationNotFoundError('Projeto');

    const currentScope = project.scopes[0];
    const contractedScopeHash = currentScope ? currentScope.contentHash : 'no-scope';

    // 1. Calcular impacto de preço da alteração
    const pricing = await IntegrationCommercialEngine.calculateEstimate(
      organizationId,
      input.deltaEffort,
      {},
      0,
      actor
    );

    const deltaHours = Object.values(input.deltaEffort).reduce((a, b) => a + b, 0);

    // 2. Registrar Change Request
    const changeRequest = await prisma.integrationChangeRequest.create({
      data: {
        organizationId,
        projectId,
        description: input.description,
        requestedById: actor.userId,
        contractedScopeHash,
        impactSummary: {
          deltaHours,
          deltaOneTime: pricing.oneTimeTotal,
          deltaMonthly: pricing.monthlyTotal,
          deltaDays: input.deltaDays,
          calculatedAt: new Date().toISOString()
        } as any,
        deltaHours,
        deltaOneTime: pricing.oneTimeTotal,
        deltaMonthly: pricing.monthlyTotal,
        deltaDays: input.deltaDays,
        status: ChangeRequestStatus.ESTIMATED
      }
    });

    // 3. Emitir proposta complementar (CHANGE_ORDER) vinculada ao Change Request
    const propCount = await prisma.integrationProposal.count();
    const proposalNumber = `PROP-CR-${new Date().getFullYear()}-${String(propCount + 1).padStart(4, '0')}`;

    const complementaryProposal = await prisma.integrationProposal.create({
      data: {
        organizationId,
        projectId,
        kind: ProposalKind.CHANGE_ORDER,
        proposalNumber,
        changeRequestId: changeRequest.id
      }
    });

    // 4. Criar Versão 1 da proposta complementar
    const validUntil = new Date(Date.now() + 15 * 86400000).toISOString();
    const artifacts = ProposalArtifactGenerator.generate({
      proposalNumber,
      version: 1,
      kind: 'CHANGE_ORDER',
      organizationName: 'Organização Contratante',
      organizationSlug: 'org-slug',
      providerName: 'Provedor Integrado',
      projectCode: project.code,
      projectTitle: `${project.title} — Aditivo de Escopo`,
      scopeContent: {
        objective: `Alteração de Escopo: ${input.description}`,
        justification: 'Necessidade identificada durante a fase de desenvolvimento',
        deliverables: ['Módulos/Adaptadores adicionais solicitados'],
        includedFeatures: [input.description],
        excludedFeatures: ['Demais itens fora do aditivo'],
        integratedEntities: [],
        syncFlows: [],
        dependencies: [],
        clientPrerequisites: [],
        acceptanceCriteria: ['Validação dos requisitos do aditivo em conjunto com o conector'],
        limitations: [],
        estimatedTimelineDays: input.deltaDays,
        risksAndAssumptions: []
      },
      feasibilityContent: {
        verdict: 'FEASIBLE',
        complexity: 'LOW',
        hasOfficialApi: true,
        authMethods: ['API_KEY'],
        supportsWebhooks: true,
        readCapabilities: ['read'],
        writeCapabilities: ['write'],
        risks: [],
        uncertainties: [],
        reusableConnectorIds: [],
        requiresPaidDiscovery: false
      },
      pricingResult: pricing,
      validUntil
    });

    const proposalVersion = await prisma.integrationProposalVersion.create({
      data: {
        organizationId,
        proposalId: complementaryProposal.id,
        version: 1,
        status: ProposalVersionStatus.COMMERCIALLY_APPROVED,
        scopeId: currentScope?.id || 'synthetic-scope',
        estimateId: 'estimate-cr',
        currency: pricing.currency,
        oneTimeTotal: pricing.oneTimeTotal,
        monthlyTotal: pricing.monthlyTotal,
        content: {
          kind: 'CHANGE_ORDER',
          description: input.description,
          deltaHours,
          deltaDays: input.deltaDays,
          pricingBreakdown: pricing.clientBreakdown
        } as any,
        contentHash: artifacts.contentHash,
        validUntil: new Date(validUntil),
        changeReason: input.description
      }
    });

    await prisma.integrationProposal.update({
      where: { id: complementaryProposal.id },
      data: { currentVersionId: proposalVersion.id }
    });

    const updatedCr = await prisma.integrationChangeRequest.update({
      where: { id: changeRequest.id },
      data: {
        status: ChangeRequestStatus.PROPOSAL_ISSUED,
        proposalId: complementaryProposal.id
      }
    });

    return {
      changeRequest: updatedCr,
      complementaryProposal,
      proposalVersion,
      artifacts
    };
  }
}
