import prisma from './prisma';

export interface CrossTenantAuditResult {
  totalChecked: number;
  violationsFound: number;
  violations: Array<{
    entityType: string;
    entityId: string;
    entityOrgId: string;
    relatedType: string;
    relatedId: string;
    relatedOrgId: string;
  }>;
}

/**
 * Inspeciona o banco em busca de eventuais relacionamentos cruzados entre tenants
 * (para comprovar integridade relacional sem destruir nem apagar registros).
 */
export async function auditCrossTenantIntegrity(): Promise<CrossTenantAuditResult> {
  const violations: CrossTenantAuditResult['violations'] = [];

  const [contacts, leads, deals, activities] = await Promise.all([
    prisma.contact.findMany({ include: { company: true } }),
    prisma.lead.findMany({ include: { company: true, contact: true, assignedTo: true } }),
    prisma.deal.findMany({ include: { company: true, lead: true, assignedTo: true } }),
    prisma.activity.findMany({ include: { company: true, contact: true, lead: true, deal: true, assignedTo: true } })
  ]);

  for (const c of contacts) {
    if (c.company && c.company.organizationId !== c.organizationId) {
      violations.push({
        entityType: 'CONTACT',
        entityId: c.id,
        entityOrgId: c.organizationId,
        relatedType: 'COMPANY',
        relatedId: c.company.id,
        relatedOrgId: c.company.organizationId
      });
    }
  }

  for (const l of leads) {
    if (l.company && l.company.organizationId !== l.organizationId) {
      violations.push({
        entityType: 'LEAD',
        entityId: l.id,
        entityOrgId: l.organizationId,
        relatedType: 'COMPANY',
        relatedId: l.company.id,
        relatedOrgId: l.company.organizationId
      });
    }
    if (l.contact && l.contact.organizationId !== l.organizationId) {
      violations.push({
        entityType: 'LEAD',
        entityId: l.id,
        entityOrgId: l.organizationId,
        relatedType: 'CONTACT',
        relatedId: l.contact.id,
        relatedOrgId: l.contact.organizationId
      });
    }
    if (l.assignedTo && l.assignedTo.organizationId !== l.organizationId) {
      violations.push({
        entityType: 'LEAD',
        entityId: l.id,
        entityOrgId: l.organizationId,
        relatedType: 'USER',
        relatedId: l.assignedTo.id,
        relatedOrgId: l.assignedTo.organizationId
      });
    }
  }

  for (const d of deals) {
    if (d.company && d.company.organizationId !== d.organizationId) {
      violations.push({
        entityType: 'DEAL',
        entityId: d.id,
        entityOrgId: d.organizationId,
        relatedType: 'COMPANY',
        relatedId: d.company.id,
        relatedOrgId: d.company.organizationId
      });
    }
    if (d.lead && d.lead.organizationId !== d.organizationId) {
      violations.push({
        entityType: 'DEAL',
        entityId: d.id,
        entityOrgId: d.organizationId,
        relatedType: 'LEAD',
        relatedId: d.lead.id,
        relatedOrgId: d.lead.organizationId
      });
    }
    if (d.assignedTo && d.assignedTo.organizationId !== d.organizationId) {
      violations.push({
        entityType: 'DEAL',
        entityId: d.id,
        entityOrgId: d.organizationId,
        relatedType: 'USER',
        relatedId: d.assignedTo.id,
        relatedOrgId: d.assignedTo.organizationId
      });
    }
  }

  for (const a of activities) {
    if (a.company && a.company.organizationId !== a.organizationId) {
      violations.push({
        entityType: 'ACTIVITY',
        entityId: a.id,
        entityOrgId: a.organizationId,
        relatedType: 'COMPANY',
        relatedId: a.company.id,
        relatedOrgId: a.company.organizationId
      });
    }
    if (a.contact && a.contact.organizationId !== a.organizationId) {
      violations.push({
        entityType: 'ACTIVITY',
        entityId: a.id,
        entityOrgId: a.organizationId,
        relatedType: 'CONTACT',
        relatedId: a.contact.id,
        relatedOrgId: a.contact.organizationId
      });
    }
    if (a.lead && a.lead.organizationId !== a.organizationId) {
      violations.push({
        entityType: 'ACTIVITY',
        entityId: a.id,
        entityOrgId: a.organizationId,
        relatedType: 'LEAD',
        relatedId: a.lead.id,
        relatedOrgId: a.lead.organizationId
      });
    }
    if (a.deal && a.deal.organizationId !== a.organizationId) {
      violations.push({
        entityType: 'ACTIVITY',
        entityId: a.id,
        entityOrgId: a.organizationId,
        relatedType: 'DEAL',
        relatedId: a.deal.id,
        relatedOrgId: a.deal.organizationId
      });
    }
    if (a.assignedTo && a.assignedTo.organizationId !== a.organizationId) {
      violations.push({
        entityType: 'ACTIVITY',
        entityId: a.id,
        entityOrgId: a.organizationId,
        relatedType: 'USER',
        relatedId: a.assignedTo.id,
        relatedOrgId: a.assignedTo.organizationId
      });
    }
  }

  return {
    totalChecked: contacts.length + leads.length + deals.length + activities.length,
    violationsFound: violations.length,
    violations
  };
}
