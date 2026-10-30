import { randomUUID } from 'crypto';
import { IntegrationProjectStatus as S, PlatformRole, ProposalKind, ProposalVersionStatus } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { IntegrationActor, assertPlatformOperator } from '../domain/actor';
import { CommercialLockService } from '../services/commercial-lock.service';
import { IntegrationCommercialEngine, EffortBreakdown, OptionalServicesSelection } from './pricing.engine';
import { ProposalArtifactGenerator, ProposalArtifactsInput } from './proposal.generator';
import { hashDocument } from '../domain/hash';
import { IntegrationDomainError } from '../domain/errors';

export interface PrepareAndSendProposalInput {
  effort: EffortBreakdown;
  options?: OptionalServicesSelection;
  discountPct?: number;
  validityDays?: number;
  scope: ProposalArtifactsInput['scopeContent'];
  feasibility: ProposalArtifactsInput['feasibilityContent'];
}

/**
 * Caminho de produção, não apenas da suíte de testes:
 * discovery -> viabilidade -> escopo -> preço -> proposta -> aceite pendente.
 * A transação impede que um erro deixe o projeto em um estado intermediário.
 */
export class IntegrationProposalService {
  public static async prepareAndSend(
    projectId: string,
    input: PrepareAndSendProposalInput,
    actor: IntegrationActor
  ) {
    assertPlatformOperator(
      actor,
      [PlatformRole.PLATFORM_COMMERCIAL, PlatformRole.PLATFORM_ADMIN],
      'aprovar e enviar proposta comercial'
    );
    if (!actor.userId) {
      throw new IntegrationDomainError('ACTOR_REQUIRED', 'Operador responsável é obrigatório.', 403);
    }
    if (input.feasibility.verdict === 'UNDETERMINED' ||
        input.feasibility.verdict === 'NOT_FEASIBLE' ||
        input.feasibility.hasOfficialApi === null) {
      throw new IntegrationDomainError('FEASIBILITY_NOT_APPROVED',
        'A viabilidade técnica deve ser confirmada antes do envio da proposta.', 422);
    }
    if (input.feasibility.hasOfficialApi && !input.feasibility.documentationUrl) {
      throw new IntegrationDomainError('API_EVIDENCE_REQUIRED',
        'Informe a URL da documentação técnica verificada para uma API oficial.', 422);
    }
    return prisma.$transaction(async (tx) => {
      const project = await tx.integrationProject.findUnique({
        where: { id: projectId },
        include: { organization: true, discovery: true, proposals: { where: { kind: 'MAIN' } } }
      });
      if (!project) throw new IntegrationDomainError('PROJECT_NOT_FOUND', 'Projeto não encontrado.', 404);
      if (project.status !== S.DISCOVERY) {
        throw new IntegrationDomainError('INVALID_PROPOSAL_STATE',
          'A proposta inicial só pode ser preparada após discovery e antes da contratação.', 409);
      }
      if (project.proposals.length) {
        throw new IntegrationDomainError('MAIN_PROPOSAL_EXISTS',
          'Já existe proposta principal. Use revisão de versão em vez de duplicá-la.', 409);
      }
      if (!project.discovery || project.discovery.completeness < 67 ||
          !project.discovery.toolName || !project.discovery.objective) {
        throw new IntegrationDomainError('DISCOVERY_INCOMPLETE',
          'Complete as informações do discovery antes de precificar.', 422);
      }

      const orgId = project.organizationId;
      const priced = await IntegrationCommercialEngine.calculateEstimate(
        orgId, input.effort, input.options || {}, input.discountPct || 0, actor, tx
      );
      const validity = input.validityDays || 15;
      const validUntil = new Date(Date.now() + validity * 86400000);
      const fea = input.feasibility;
      await CommercialLockService.transition(projectId, orgId, S.FEASIBILITY_REVIEW, actor, 'Viabilidade documentada', undefined, tx);
      await tx.integrationFeasibilityAssessment.create({
        data: {
          organizationId: orgId, projectId, version: 1,
          verdict: fea.verdict, complexity: fea.complexity,
          hasOfficialApi: fea.hasOfficialApi,
          documentationUrl: fea.documentationUrl || null,
          authMethods: fea.authMethods,
          rateLimitNotes: fea.rateLimitNotes || null,
          supportsWebhooks: fea.supportsWebhooks,
          readCapabilities: fea.readCapabilities,
          writeCapabilities: fea.writeCapabilities,
          licensingDependencies: fea.licensingDependencies || null,
          risks: fea.risks,
          uncertainties: fea.uncertainties,
          reusableConnectorIds: fea.reusableConnectorIds,
          requiresPaidDiscovery: fea.requiresPaidDiscovery,
          assessedBy: [{ role: 'PLATFORM_COMMERCIAL', operatorId: actor.userId, verified: true }]
        }
      });
      await CommercialLockService.transition(projectId, orgId, S.SCOPE_DRAFT, actor, 'Escopo formalizado', undefined, tx);
      const scope = await tx.integrationScope.create({
        data: {
          organizationId: orgId, projectId, version: 1, content: input.scope,
          contentHash: hashDocument(input.scope), createdById: actor.userId
        }
      });
      await CommercialLockService.transition(projectId, orgId, S.PRICING_REVIEW, actor, 'Precificação validada', undefined, tx);
      const estimate = await tx.integrationEstimate.create({
        data: {
          organizationId: orgId, projectId, scopeId: scope.id, kind: ProposalKind.MAIN,
          status: 'COMMERCIALLY_APPROVED', currency: priced.currency, effort: input.effort,
          internalBreakdown: priced.internalBreakdown, clientBreakdown: priced.clientBreakdown,
          oneTimeTotal: priced.oneTimeTotal, monthlyTotal: priced.monthlyTotal,
          discountPct: priced.discountPct, pricingSnapshot: priced.pricingSnapshot,
          createdByType: 'PLATFORM_OPERATOR', createdById: actor.userId
        }
      });
      const proposalNumber = 'INT-' + randomUUID().slice(0, 12).toUpperCase();
      const proposal = await tx.integrationProposal.create({
        data: { organizationId: orgId, projectId, kind: ProposalKind.MAIN, proposalNumber }
      });
      const artifacts = ProposalArtifactGenerator.generate({
        proposalNumber, version: 1, kind: 'MAIN',
        organizationName: project.organization.name,
        organizationSlug: project.organization.slug,
        providerName: project.discovery.toolName,
        projectCode: project.code, projectTitle: project.title,
        scopeContent: input.scope, feasibilityContent: fea, pricingResult: priced,
        validUntil: validUntil.toISOString()
      });
      const version = await tx.integrationProposalVersion.create({
        data: {
          organizationId: orgId, proposalId: proposal.id, version: 1,
          status: ProposalVersionStatus.SENT,
          scopeId: scope.id, estimateId: estimate.id,
          currency: priced.currency, oneTimeTotal: priced.oneTimeTotal,
          monthlyTotal: priced.monthlyTotal, content: artifacts,
          contentHash: artifacts.contentHash, validUntil,
          commerciallyApprovedById: actor.userId, commerciallyApprovedAt: new Date(),
          sentById: actor.userId, sentAt: new Date()
        }
      });
      await tx.integrationProposal.update({
        where: { id: proposal.id }, data: { currentVersionId: version.id }
      });
      for (const [type, fileName, content, mimeType] of [
        ['INTEGRATION_SCOPE', 'INTEGRATION_SCOPE.html', artifacts.scopeHtml, 'text/html'],
        ['TECHNICAL_FEASIBILITY', 'TECHNICAL_FEASIBILITY.html', artifacts.feasibilityHtml, 'text/html'],
        ['COMMERCIAL_PROPOSAL', 'COMMERCIAL_PROPOSAL.html', artifacts.proposalHtml, 'text/html'],
        ['ESTIMATE_BREAKDOWN', 'ESTIMATE_BREAKDOWN.json', artifacts.estimateBreakdownJson, 'application/json'],
        ['ACCEPTANCE_TERMS', 'ACCEPTANCE_TERMS.html', artifacts.acceptanceTermsHtml, 'text/html']
      ] as Array<[string, string, string, string]>) {
        await tx.integrationArtifact.create({
          data: { organizationId: orgId, projectId, proposalVersionId: version.id,
            type, fileName, content, mimeType, contentHash: hashDocument(content) }
        });
      }
      await CommercialLockService.transition(projectId, orgId, S.PROPOSAL_READY, actor, 'Proposta comercial aprovada', undefined, tx);
      await CommercialLockService.transition(projectId, orgId, S.PROPOSAL_SENT, actor, 'Proposta enviada ao cliente', undefined, tx);
      await CommercialLockService.transition(projectId, orgId, S.AWAITING_CUSTOMER_APPROVAL, actor, 'Aguardando aceite humano autorizado', undefined, tx);
      return {
        proposalId: proposal.id, proposalVersionId: version.id,
        proposalNumber, version: 1, validUntil,
        oneTimeTotal: priced.oneTimeTotal, monthlyTotal: priced.monthlyTotal,
        currency: priced.currency, status: 'AWAITING_CUSTOMER_APPROVAL'
      };
    }, { timeout: 20000 });
  }
}
