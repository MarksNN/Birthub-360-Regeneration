import { PrismaClient, UserRole, DealStage, ActivityType, ActivityStatus, CompanyStatus, ContactStatus, LeadStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export class TenantSecurityError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'TenantSecurityError';
    this.statusCode = statusCode;
  }
}

export class TenantGuard {
  /**
   * Valida que uma empresa pertence estritamente à organização autenticada.
   */
  public static async assertCompanyInTenant(
    companyId: string | null | undefined,
    organizationId: string,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<void> {
    if (!companyId) return;
    const company = await tx.company.findFirst({
      where: { id: companyId, organizationId },
      select: { id: true }
    });
    if (!company) {
      throw new TenantSecurityError(
        `Violação de isolamento multi-tenant ou empresa inexistente na organização atual (companyId: ${companyId}).`,
        403
      );
    }
  }

  /**
   * Valida que um contato pertence estritamente à organização autenticada.
   */
  public static async assertContactInTenant(
    contactId: string | null | undefined,
    organizationId: string,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<void> {
    if (!contactId) return;
    const contact = await tx.contact.findFirst({
      where: { id: contactId, organizationId },
      select: { id: true }
    });
    if (!contact) {
      throw new TenantSecurityError(
        `Violação de isolamento multi-tenant ou contato inexistente na organização atual (contactId: ${contactId}).`,
        403
      );
    }
  }

  /**
   * Valida que um lead pertence estritamente à organização autenticada.
   */
  public static async assertLeadInTenant(
    leadId: string | null | undefined,
    organizationId: string,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<void> {
    if (!leadId) return;
    const lead = await tx.lead.findFirst({
      where: { id: leadId, organizationId },
      select: { id: true }
    });
    if (!lead) {
      throw new TenantSecurityError(
        `Violação de isolamento multi-tenant ou lead inexistente na organização atual (leadId: ${leadId}).`,
        403
      );
    }
  }

  /**
   * Valida que um negócio (Deal) pertence estritamente à organização autenticada.
   */
  public static async assertDealInTenant(
    dealId: string | null | undefined,
    organizationId: string,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<void> {
    if (!dealId) return;
    const deal = await tx.deal.findFirst({
      where: { id: dealId, organizationId },
      select: { id: true }
    });
    if (!deal) {
      throw new TenantSecurityError(
        `Violação de isolamento multi-tenant ou negócio inexistente na organização atual (dealId: ${dealId}).`,
        403
      );
    }
  }

  /**
   * Valida que um responsável comercial (User) pertence estritamente à organização autenticada.
   */
  public static async assertAssigneeInTenant(
    assignedToId: string | null | undefined,
    organizationId: string,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<void> {
    if (!assignedToId) return;
    const user = await tx.user.findFirst({
      where: { id: assignedToId, organizationId },
      select: { id: true }
    });
    if (!user) {
      throw new TenantSecurityError(
        `Violação de isolamento multi-tenant ou responsável comercial não pertence à organização atual (assignedToId: ${assignedToId}).`,
        403
      );
    }
  }

  /**
   * Valida simultaneamente múltiplas referências relacionais dentro do mesmo tenant.
   */
  public static async assertRelationsInTenant(
    relations: {
      companyId?: string | null;
      contactId?: string | null;
      leadId?: string | null;
      dealId?: string | null;
      assignedToId?: string | null;
    },
    organizationId: string,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<void> {
    await Promise.all([
      this.assertCompanyInTenant(relations.companyId, organizationId, tx),
      this.assertContactInTenant(relations.contactId, organizationId, tx),
      this.assertLeadInTenant(relations.leadId, organizationId, tx),
      this.assertDealInTenant(relations.dealId, organizationId, tx),
      this.assertAssigneeInTenant(relations.assignedToId, organizationId, tx)
    ]);
  }
}
