import { PlatformRole } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { IntegrationPermissionError } from './errors';

/**
 * Ator de uma operação da Integration Factory. Todo serviço de aplicação recebe o ator
 * explicitamente — não existe "modo sistema" implícito que pule as regras comerciais.
 */
export type ActorType = 'USER' | 'SUPERVISOR' | 'WORKER' | 'PLATFORM_OPERATOR' | 'SYSTEM';
export type ActorChannel = 'UI' | 'API' | 'SUPERVISOR' | 'WORKER' | 'SERVICE';

export interface IntegrationActor {
  type: ActorType;
  channel: ActorChannel;
  userId?: string;
  organizationId: string; // Organização em nome da qual a operação ocorre
  role?: string; // UserRole da organização cliente
  platformRole?: PlatformRole | null;
  canApproveProposals?: boolean;
}

/** Carrega o ator a partir do banco (nunca confia em flags vindas do token/cliente). */
export async function loadUserActor(
  userId: string,
  channel: ActorChannel,
  type: ActorType = 'USER'
): Promise<IntegrationActor> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, organizationId: true, role: true, platformRole: true, canApproveIntegrationProposals: true }
  });
  if (!user) throw new IntegrationPermissionError('Usuário não encontrado.');
  return {
    type: user.platformRole && type === 'USER' ? 'USER' : type,
    channel,
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    platformRole: user.platformRole,
    canApproveProposals: user.canApproveIntegrationProposals
  };
}

export function isPlatformOperator(actor: IntegrationActor, roles?: PlatformRole[]): boolean {
  if (!actor.platformRole) return false;
  if (actor.platformRole === PlatformRole.PLATFORM_ADMIN) return true;
  return roles ? roles.includes(actor.platformRole) : true;
}

export function assertPlatformOperator(actor: IntegrationActor, roles: PlatformRole[], action: string): void {
  if (actor.type === 'SUPERVISOR' || actor.type === 'WORKER') {
    throw new IntegrationPermissionError(`A ação "${action}" é exclusiva de operadores humanos autorizados da plataforma.`);
  }
  if (!isPlatformOperator(actor, roles)) {
    throw new IntegrationPermissionError(
      `A ação "${action}" requer papel de operador da plataforma (${roles.join(' ou ')} ou PLATFORM_ADMIN).`
    );
  }
}

/** Usuário da organização cliente com poderes formais de contratação. */
export function assertCanApproveForOrganization(actor: IntegrationActor, organizationId: string): void {
  if (actor.type !== 'USER') {
    throw new IntegrationPermissionError('Somente um usuário humano autorizado pode aprovar ou rejeitar propostas.');
  }
  if (actor.organizationId !== organizationId) {
    throw new IntegrationPermissionError('Usuário não pertence à organização da proposta.');
  }
  if (!actor.canApproveProposals || !['ADMIN', 'MANAGER'].includes(actor.role || '')) {
    throw new IntegrationPermissionError(
      'Usuário sem permissão para contratar em nome da organização (requer perfil ADMIN/MANAGER com poder de contratação).'
    );
  }
}
