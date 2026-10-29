import prisma from '../lib/prisma';

export interface AuditLogParams {
  organizationId: string;
  userId?: string;
  entityType: 'COMPANY' | 'CONTACT' | 'LEAD' | 'DEAL' | 'ACTIVITY';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STAGE_CHANGE';
  diff?: any;
}

export async function logAudit(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        diff: params.diff ?? {}
      }
    });
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR]', err);
  }
}
