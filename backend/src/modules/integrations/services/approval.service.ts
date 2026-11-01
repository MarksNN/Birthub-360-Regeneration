import { ApprovalDecision, IntegrationProjectStatus, ProjectOrderStatus, ProposalVersionStatus } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { IntegrationNotFoundError, IntegrationPermissionError, CommercialLockError } from '../domain/errors';
import { IntegrationActor, assertCanApproveForOrganization, assertPlatformOperator } from '../domain/actor';
import { CommercialLockService } from './commercial-lock.service';
import { hashDocument } from '../domain/hash';

export interface AcceptProposalInput {
  proposalVersionId: string;
  decision: ApprovalDecision; // ACCEPTED | REJECTED
  effectsAcknowledged: boolean;
  conditionsAccepted: Record<string, boolean>;
  rejectionReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class IntegrationApprovalService {
  /**
   * Registra o aceite ou rejeição eletrônica formal da proposta pelo cliente.
   * Apenas usuários com poder de contratação na organização cliente podem aprovar.
   */
  public static async recordCustomerApproval(
    projectId: string,
    organizationId: string,
    input: AcceptProposalInput,
    actor: IntegrationActor
  ) {
    // 1. Validar autoridade formal para contratar em nome da organização
    assertCanApproveForOrganization(actor, organizationId);

    if (input.decision === ApprovalDecision.ACCEPTED && !input.effectsAcknowledged) {
      throw new IntegrationPermissionError(
        'É obrigatório confirmar a ciência dos efeitos legais e operacionais antes de formalizar o aceite.'
      );
    }

    // Expiração precisa persistir mesmo quando a solicitação for rejeitada.
    // Nunca lançar o erro dentro da transação que grava EXPIRED.
    const preflight = await prisma.integrationProposalVersion.findFirst({
      where: { id: input.proposalVersionId, organizationId },
      include: { proposal: true }
    });
    if (preflight?.validUntil && preflight.validUntil.getTime() < Date.now()) {
      await prisma.$transaction(async tx => {
        await tx.integrationProposalVersion.update({
          where: { id: preflight.id }, data: { status: ProposalVersionStatus.EXPIRED }
        });
        if (preflight.proposal.kind === 'MAIN') {
          const current = await tx.integrationProject.findFirst({
            where: { id: projectId, organizationId }
          });
          if (current && (current.status === IntegrationProjectStatus.AWAITING_CUSTOMER_APPROVAL ||
              current.status === IntegrationProjectStatus.PROPOSAL_SENT)) {
            await CommercialLockService.transition(
              projectId, organizationId, IntegrationProjectStatus.EXPIRED,
              actor, 'Prazo de validade da proposta expirado', undefined, tx
            );
          }
        }
      });
      throw new CommercialLockError(['Proposta expirada. Solicite uma nova versão antes do aceite.']);
    }

    return prisma.$transaction(async (tx) => {
      const project = await tx.integrationProject.findFirst({
        where: { id: projectId, organizationId },
        include: {
          proposals: {
            include: {
              versions: {
                where: { id: input.proposalVersionId }
              }
            }
          }
        }
      });

      if (!project) throw new IntegrationNotFoundError('Projeto');

      const proposal = project.proposals.find((p) => p.versions.length > 0);
      const version = proposal?.versions[0];

      if (!proposal || !version) {
        throw new IntegrationNotFoundError('Versão da proposta');
      }

      // Aditivos não devem reiniciar a contratação principal já aceita.
      if (proposal.kind === 'CHANGE_ORDER') {
        const acceptableStatuses: ProposalVersionStatus[] = [ProposalVersionStatus.COMMERCIALLY_APPROVED, ProposalVersionStatus.SENT];
        if (!acceptableStatuses.includes(version.status)) {
          throw new CommercialLockError(['Aditivo não autorizado para aceite.']);
        }
        if (!['IN_DEVELOPMENT','IN_TESTING','AWAITING_ACCEPTANCE','ACCEPTED','AVAILABLE'].includes(project.status)) {
          throw new CommercialLockError(['Aditivo só pode ser aceito em projeto já contratado.']);
        }
        if (!proposal.changeRequestId) throw new IntegrationNotFoundError('Solicitação de alteração');
        const changeRequest = await tx.integrationChangeRequest.findFirst({
          where: { id: proposal.changeRequestId, organizationId, projectId }
        });
        if (!changeRequest) throw new IntegrationNotFoundError('Solicitação de alteração');
        const accepted = input.decision === ApprovalDecision.ACCEPTED;
        const decisionRecord = await tx.integrationApproval.create({
          data: {
            organizationId, projectId, proposalVersionId: version.id,
            decision: input.decision, userId: actor.userId!,
            userRoleSnapshot: actor.role || 'ADMIN',
            hadContractingAuthority: true,
            approvedAmounts: accepted ? { oneTimeTotal: Number(version.oneTimeTotal),
              monthlyTotal: Number(version.monthlyTotal), currency: version.currency } : {},
            approvedScopeHash: (version.content as any)?.scopeHash || version.contentHash,
            documentHash: version.contentHash,
            conditionsAccepted: accepted ? input.conditionsAccepted : {},
            effectsAcknowledged: accepted,
            reason: accepted ? 'Aditivo autorizado pelo contratante' : (input.rejectionReason || 'Aditivo rejeitado'),
            legalStatus: accepted ? 'AUDITABLE_ACCEPTANCE_PENDING_LEGAL_VALIDATION' : 'REJECTED_BY_CUSTOMER'
          }
        });
        await tx.integrationProposalVersion.update({
          where: { id: version.id },
          data: { status: accepted ? ProposalVersionStatus.ACCEPTED : ProposalVersionStatus.REJECTED }
        });
        await tx.integrationChangeRequest.update({
          where: { id: changeRequest.id },
          data: { status: accepted ? 'ACCEPTED' : 'REJECTED' }
        });
        return { approval: decisionRecord, order: null };
      }

      // Proposta MAIN: aceite apenas da versão enviada e do estado contratual correto.
      if (version.status !== ProposalVersionStatus.SENT ||
          project.status !== IntegrationProjectStatus.AWAITING_CUSTOMER_APPROVAL) {
        throw new CommercialLockError(['A proposta vigente ainda não foi formalmente enviada para aceite.']);
      }

      if (input.decision === ApprovalDecision.REJECTED) {
        // Registro de rejeição
        const rejection = await tx.integrationApproval.create({
          data: {
            organizationId,
            projectId,
            proposalVersionId: version.id,
            decision: ApprovalDecision.REJECTED,
            userId: actor.userId!,
            userRoleSnapshot: actor.role || 'ADMIN',
            hadContractingAuthority: true,
            approvedAmounts: {},
            approvedScopeHash: '',
            documentHash: version.contentHash,
            conditionsAccepted: {},
            effectsAcknowledged: false,
            reason: input.rejectionReason || 'Rejeitado pelo cliente',
            ipAddress: input.ipAddress || null,
            userAgent: input.userAgent || null,
            legalStatus: 'REJECTED_BY_CUSTOMER'
          }
        });

        await tx.integrationProposalVersion.update({
          where: { id: version.id },
          data: { status: ProposalVersionStatus.REJECTED }
        });

        await CommercialLockService.transition(
          projectId,
          organizationId,
          IntegrationProjectStatus.REJECTED_BY_CUSTOMER,
          actor,
          `Proposta rejeitada: ${input.rejectionReason || 'Sem motivo detalhado'}`,
          undefined,
          tx
        );

        return { approval: rejection, order: null };
      }

      // Registro de aceite válido
      const approval = await tx.integrationApproval.create({
        data: {
          organizationId,
          projectId,
          proposalVersionId: version.id,
          decision: ApprovalDecision.ACCEPTED,
          userId: actor.userId!,
          userRoleSnapshot: actor.role || 'ADMIN',
          hadContractingAuthority: true,
          approvedAmounts: {
            oneTimeTotal: Number(version.oneTimeTotal),
            monthlyTotal: Number(version.monthlyTotal),
            currency: version.currency
          },
          approvedScopeHash: (version.content as any)?.scopeHash || version.contentHash,
          documentHash: version.contentHash,
          conditionsAccepted: input.conditionsAccepted as any,
          effectsAcknowledged: true,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
          legalStatus: 'AUDITABLE_ACCEPTANCE_PENDING_LEGAL_VALIDATION'
        }
      });

      // Atualizar status da versão da proposta
      await tx.integrationProposalVersion.update({
        where: { id: version.id },
        data: { status: ProposalVersionStatus.ACCEPTED }
      });

      // Vincular versão contratada no projeto
      await tx.integrationProject.update({
        where: { id: projectId },
        data: { contractedVersionId: version.id }
      });

      // Transicionar projeto para APPROVED_BY_CUSTOMER
      await CommercialLockService.transition(
        projectId,
        organizationId,
        IntegrationProjectStatus.APPROVED_BY_CUSTOMER,
        actor,
        `Aceite registrado pelo usuário ${actor.userId} em nome da organização`,
        { approvalId: approval.id },
        tx
      );

      // Gerar a Ordem de Projeto (INTEGRATION_PROJECT_ORDER) em estado PENDING_INTERNAL_AUTHORIZATION
      const orderCount = await tx.integrationProjectOrder.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

      const order = await tx.integrationProjectOrder.create({
        data: {
          organizationId,
          projectId,
          approvalId: approval.id,
          proposalVersionId: version.id,
          orderNumber,
          status: ProjectOrderStatus.PENDING_INTERNAL_AUTHORIZATION,
          paymentAuthorizationStatus: 'PENDING',
          authorizationChecklist: {
            customerApprovalRecorded: true,
            acceptanceDocumentHash: approval.documentHash,
            awaitingPlatformOperatorSignOff: true,
            awaitingPaymentOrCreditConfirmation: true
          }
        }
      });

      // Avançar para INTERNAL_AUTHORIZATION
      await CommercialLockService.transition(
        projectId,
        organizationId,
        IntegrationProjectStatus.INTERNAL_AUTHORIZATION,
        actor,
        `Ordem de projeto ${orderNumber} criada. Aguardando autorização interna e validação comercial`,
        { orderId: order.id, orderNumber },
        tx
      );

      return { approval, order };
    });
  }

  /**
   * Concede a autorização interna da plataforma (Etapa 08).
   * Ação exclusiva de operador da plataforma (PLATFORM_COMMERCIAL ou PLATFORM_ADMIN).
   * Somente após esta autorização a ordem se torna EXECUTABLE e o projeto pode transicionar
   * para AUTHORIZED_FOR_DEVELOPMENT!
   */
  public static async authorizeProjectInternally(
    orderId: string,
    actor: IntegrationActor,
    paymentStatus: 'CONFIRMED' | 'NOT_REQUIRED' = 'CONFIRMED'
  ) {
    assertPlatformOperator(actor, ['PLATFORM_COMMERCIAL', 'PLATFORM_ADMIN'], 'autorizar início de desenvolvimento');

    return prisma.$transaction(async (tx) => {
      const order = await tx.integrationProjectOrder.findUnique({
        where: { id: orderId },
        include: {
          project: true,
          approval: true
        }
      });

      if (!order) throw new IntegrationNotFoundError('Ordem de projeto');

      if (order.approval.invalidatedAt) {
        throw new CommercialLockError(['O aceite vinculado a esta ordem foi invalidado anteriormente.']);
      }

      // Atualizar a ordem para EXECUTABLE
      const updatedOrder = await tx.integrationProjectOrder.update({
        where: { id: order.id },
        data: {
          status: ProjectOrderStatus.EXECUTABLE,
          paymentAuthorizationStatus: paymentStatus,
          authorizedById: actor.userId,
          authorizedAt: new Date(),
          authorizationChecklist: {
            ...(order.authorizationChecklist as any),
            platformOperatorSignOff: true,
            authorizedBy: actor.userId,
            authorizedAt: new Date().toISOString(),
            paymentStatus
          }
        }
      });

      // Transicionar o projeto para AUTHORIZED_FOR_DEVELOPMENT
      await CommercialLockService.transition(
        order.projectId,
        order.organizationId,
        IntegrationProjectStatus.AUTHORIZED_FOR_DEVELOPMENT,
        actor,
        `Ordem ${order.orderNumber} liberada pelo operador da plataforma. Projeto autorizado para desenvolvimento.`,
        { orderId: order.id, orderNumber: order.orderNumber },
        tx
      );

      return updatedOrder;
    });
  }
}
