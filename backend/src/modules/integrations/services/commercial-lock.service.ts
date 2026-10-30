import { IntegrationProjectStatus as S, PrismaClient } from '@prisma/client';
import prisma from '../../../lib/prisma';
import {
  isTransitionAllowed,
  DEVELOPMENT_GATED_STATES,
  APPROVAL_GATED_STATES
} from '../domain/project-states';
import { CommercialLockError, InvalidTransitionError, IntegrationNotFoundError } from '../domain/errors';
import { IntegrationActor } from '../domain/actor';

export interface CommercialLockCheckResult {
  canProceedToDevelopment: boolean;
  reasons: string[];
  activeApprovalId?: string;
  orderId?: string;
}

export class CommercialLockService {
  /**
   * Avalia rigorosamente se o projeto possui ACEITE COMERCIAL VÁLIDO e AUTORIZAÇÃO INTERNA executável.
   * Não confia em flags em memória — consulta o banco de dados e valida o hash da proposta aceita.
   */
  public static async evaluateDevelopmentPreconditions(
    projectId: string,
    organizationId: string,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<CommercialLockCheckResult> {
    const reasons: string[] = [];

    const project = await tx.integrationProject.findFirst({
      where: { id: projectId, organizationId },
      include: {
        proposals: {
          include: {
            versions: {
              orderBy: { version: 'desc' }
            }
          }
        },
        approvals: {
          orderBy: { decidedAt: 'desc' }
        },
        orders: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      throw new IntegrationNotFoundError('Projeto de integração');
    }

    // 1. Verificar proposta principal
    const mainProposal = project.proposals.find((p) => p.kind === 'MAIN');
    if (!mainProposal) {
      reasons.push('Nenhuma proposta comercial foi gerada para este projeto.');
      return { canProceedToDevelopment: false, reasons };
    }

    // 2. Verificar versão mais recente da proposta
    const latestVersion = mainProposal.versions[0];
    if (!latestVersion) {
      reasons.push('Nenhuma versão de proposta comercial encontrada.');
      return { canProceedToDevelopment: false, reasons };
    }

    // 3. Verificar aceite formal do cliente
    const validApproval = project.approvals.find(
      (a) =>
        a.proposalVersionId === latestVersion.id &&
        a.decision === 'ACCEPTED' &&
        !a.invalidatedAt &&
        a.hadContractingAuthority
    );

    if (!validApproval) {
      reasons.push(
        `A versão atual da proposta (v${latestVersion.version}) não possui aceite comercial válido do cliente. Status atual da versão: ${latestVersion.status}.`
      );
    } else {
      // Validar se o hash do escopo e do documento na aprovação coincide com a versão atual da proposta
      if (validApproval.documentHash !== latestVersion.contentHash) {
        reasons.push(
          'Inconsistência de integridade: a proposta sofreu alteração material após o aceite (hash divergente). Um novo aceite é obrigatório.'
        );
      }
    }

    // 4. Verificar Ordem de Projeto (Autorização Interna)
    const validOrder = project.orders.find(
      (o) =>
        o.proposalVersionId === latestVersion.id &&
        o.status === 'EXECUTABLE' &&
        !o.invalidatedAt
    );

    if (!validOrder) {
      reasons.push(
        'Ordem de projeto não autorizada internamente ou pendente de confirmação comercial da plataforma.'
      );
    }

    const canProceedToDevelopment = reasons.length === 0;

    return {
      canProceedToDevelopment,
      reasons,
      activeApprovalId: validApproval?.id,
      orderId: validOrder?.id
    };
  }

  /**
   * Executa a transição de estado de um projeto de integração garantindo:
   * 1. A transição é válida no grafo de estados (PROJECT_TRANSITIONS).
   * 2. Se o estado de destino for de desenvolvimento (AUTHORIZED_FOR_DEVELOPMENT, IN_DEVELOPMENT, etc.),
   *    exige rigorosamente aceite comercial válido e ordem interna executável.
   * 3. Registra histórico auditável de cada transição.
   */
  public static async transition(
    projectId: string,
    organizationId: string,
    targetStatus: S,
    actor: IntegrationActor,
    reason?: string,
    metadata?: Record<string, unknown>,
    tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
  ): Promise<{ fromStatus: S; toStatus: S }> {
    const runner = async (db: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      const project = await db.integrationProject.findFirst({
        where: { id: projectId, organizationId }
      });

      if (!project) {
        throw new IntegrationNotFoundError('Projeto de integração');
      }

      const currentStatus = project.status;

      // Se já está no estado desejado, retorna idempotentemente
      if (currentStatus === targetStatus) {
        return { fromStatus: currentStatus, toStatus: targetStatus };
      }

      // BLOQUEIO COMERCIAL ABSOLUTO
      if (DEVELOPMENT_GATED_STATES.has(targetStatus)) {
        const check = await CommercialLockService.evaluateDevelopmentPreconditions(projectId, organizationId, db);
        if (!check.canProceedToDevelopment) {
          throw new CommercialLockError(check.reasons);
        }
      }

      // Validar se a transição é legal no grafo de estados
      const allowed = isTransitionAllowed(currentStatus, targetStatus, project.onHoldFromStatus);
      if (!allowed) {
        throw new InvalidTransitionError(currentStatus, targetStatus);
      }

      // Estados de contratação exigem ao menos proposta enviada ou aceite
      if (APPROVAL_GATED_STATES.has(targetStatus) && targetStatus === S.APPROVED_BY_CUSTOMER) {
        const hasAcceptedApproval = await db.integrationApproval.findFirst({
          where: { projectId, organizationId, decision: 'ACCEPTED', invalidatedAt: null }
        });
        if (!hasAcceptedApproval) {
          throw new CommercialLockError([
            'Não é permitido transicionar para APPROVED_BY_CUSTOMER sem registro prévio de aceite eletrônico válido.'
          ]);
        }
      }

      // Atualizar status do projeto
      const updateData: any = {
        status: targetStatus,
        updatedAt: new Date()
      };

      if (targetStatus === S.ON_HOLD) {
        updateData.onHoldFromStatus = currentStatus;
      } else if (currentStatus === S.ON_HOLD) {
        updateData.onHoldFromStatus = null;
      }

      await db.integrationProject.update({
        where: { id: projectId },
        data: updateData
      });

      // Registrar histórico auditável
      await db.integrationProjectStatusHistory.create({
        data: {
          organizationId,
          projectId,
          fromStatus: currentStatus,
          toStatus: targetStatus,
          actorType: actor.type,
          actorId: actor.userId || null,
          channel: actor.channel,
          reason: reason || null,
          metadata: (metadata as any) || {}
        }
      });

      return { fromStatus: currentStatus, toStatus: targetStatus };
    };

    if (tx) {
      return runner(tx);
    }
    return prisma.$transaction(async (trans) => runner(trans));
  }
}
