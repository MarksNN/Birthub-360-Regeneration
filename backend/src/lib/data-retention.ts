/**
 * Data Retention Module
 *
 * Funções de expurgo, anonimização e retenção de dados conforme política de retenção.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Anonimiza um usuário
 * Remove dados identificadores mantendo estrutura para integridade referencial
 */
export async function anonymizeUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Hash do email (preserva formato para unicidade)
  const emailHash = `anon_${Buffer.from(user.email).toString('base64').substring(0, 16)}@anon.local`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: emailHash,
      name: 'Usuário Anonimizado',
      passwordHash: '', // Remove credencial
      updatedAt: new Date(),
    },
  });

  // TODO: Marcar com flag de anonimização (campo a ser adicionado no schema)
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { anonymizedAt: new Date() },
  // });
}

/**
 * Anonimiza um lead
 */
export async function anonymizeLead(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      title: 'Lead Anonimizado',
      notes: '[ANONIMIZADO]',
      updatedAt: new Date(),
    },
  });
}

/**
 * Anonimiza um contato
 */
export async function anonymizeContact(contactId: string): Promise<void> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    throw new Error('Contact not found');
  }

  const emailHash = contact.email
    ? `anon_${Buffer.from(contact.email).toString('base64').substring(0, 16)}@anon.local`
    : null;

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      name: 'Contato Anonimizado',
      email: emailHash,
      phone: null,
      roleTitle: null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Expurga leads expirados (sem conversão por 2 anos)
 */
export async function purgeExpiredLeads(organizationId?: string): Promise<number> {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const where: any = {
    status: { not: 'CONVERTIDO_EM_OPORTUNIDADE' },
    updatedAt: { lt: twoYearsAgo },
  };

  if (organizationId) {
    where.organizationId = organizationId;
  }

  // Primeiro, anonimiza em vez de deletar (preserva histórico)
  const leads = await prisma.lead.findMany({
    where,
    select: { id: true },
  });

  let count = 0;
  for (const lead of leads) {
    await anonymizeLead(lead.id);
    count++;
  }

  return count;
}

/**
 * Expurga atividades expiradas (mais de 1 ano)
 */
export async function purgeExpiredActivities(organizationId?: string): Promise<number> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const where: any = {
    status: 'CONCLUIDA',
    completedAt: { lt: oneYearAgo },
  };

  if (organizationId) {
    where.organizationId = organizationId;
  }

  const result = await prisma.activity.deleteMany({ where });
  return result.count;
}

/**
 * Expurga execuções do Supervisor expiradas (mais de 30 dias)
 */
export async function purgeExpiredSupervisorExecutions(organizationId?: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where: any = {
    createdAt: { lt: thirtyDaysAgo },
  };

  if (organizationId) {
    where.organizationId = organizationId;
  }

  const result = await prisma.supervisorExecution.deleteMany({ where });
  return result.count;
}

/**
 * Expurga eventos de webhook expirados (mais de 7 dias para inbox, 30 dias para outbox)
 */
export async function purgeExpiredWebhookEvents(organizationId?: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Inbox events (7 dias)
  const inboxWhere: any = {
    status: 'PROCESSED',
    processedAt: { lt: sevenDaysAgo },
  };

  if (organizationId) {
    inboxWhere.organizationId = organizationId;
  }

  const inboxResult = await prisma.webhookInboxEvent.deleteMany({ where: inboxWhere });

  // Outbox events (30 dias)
  const outboxWhere: any = {
    status: 'PROCESSED',
    dispatchedAt: { lt: thirtyDaysAgo },
  };

  if (organizationId) {
    outboxWhere.organizationId = organizationId;
  }

  const outboxResult = await prisma.integrationOutboxEvent.deleteMany({ where: outboxWhere });

  return inboxResult.count + outboxResult.count;
}

/**
 * Expurga todos os dados expirados para uma organização
 */
export async function purgeExpiredDataForOrganization(organizationId: string): Promise<{
  leads: number;
  activities: number;
  supervisorExecutions: number;
  webhookEvents: number;
}> {
  const leads = await purgeExpiredLeads(organizationId);
  const activities = await purgeExpiredActivities(organizationId);
  const supervisorExecutions = await purgeExpiredSupervisorExecutions(organizationId);
  const webhookEvents = await purgeExpiredWebhookEvents(organizationId);

  return {
    leads,
    activities,
    supervisorExecutions,
    webhookEvents,
  };
}

/**
 * Expurga todos os dados expirados (job agendado)
 */
export async function purgeAllExpiredData(): Promise<{
  leads: number;
  activities: number;
  supervisorExecutions: number;
  webhookEvents: number;
}> {
  const leads = await purgeExpiredLeads();
  const activities = await purgeExpiredActivities();
  const supervisorExecutions = await purgeExpiredSupervisorExecutions();
  const webhookEvents = await purgeExpiredWebhookEvents();

  return {
    leads,
    activities,
    supervisorExecutions,
    webhookEvents,
  };
}

/**
 * Verifica se um registro está sob legal hold
 * NOTA: Requer adição de campo `legalHold` no schema
 */
export async function isUnderLegalHold(entityType: string, entityId: string): Promise<boolean> {
  // TODO: Implementar após adicionar campo legalHold nas tabelas
  // const record = await prisma[entityType].findUnique({
  //   where: { id: entityId },
  //   select: { legalHold: true },
  // });
  // return record?.legalHold || false;

  return false; // Placeholder até implementação
}

/**
 * Exporta dados de um usuário (para direito de portabilidade)
 */
export async function exportUserData(userId: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      leadsAssigned: true,
      dealsAssigned: true,
      activitiesAssigned: true,
      auditLogsTriggered: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Remove credenciais do export
  const { passwordHash, ...safeUser } = user;

  return safeUser;
}

/**
 * Solicita exclusão de conta (GDPR/LGPD - direito ao esquecimento)
 */
export async function requestAccountDeletion(userId: string): Promise<void> {
  // Verifica se há dados sob legal hold
  const underLegalHold = await isUnderLegalHold('User', userId);

  if (underLegalHold) {
    throw new Error('Cannot delete user under legal hold');
  }

  // Verifica se há obrigações contratuais pendentes
  // TODO: Implementar verificação de contratos/assinaturas ativas

  // Anonimiza usuário em vez de deletar (preserva histórico)
  await anonymizeUser(userId);
}
