import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { TenantGuard, TenantSecurityError } from '../src/lib/tenant-guard';
import { auditCrossTenantIntegrity } from '../src/lib/cross-tenant-audit';
import { SupervisorEngine } from '../src/modules/supervisor/supervisor.engine';
import { UserRole, DealStage, ActivityType, ActivityStatus } from '@prisma/client';

describe('Correção 02 — Isolamento Multi-Tenant nos Relacionamentos do CRM & Supervisor', () => {
  let orgAId = '';
  let orgBId = '';
  let userAId = '';
  let userBId = '';
  let companyAId = '';
  let companyBId = '';
  let contactAId = '';
  let contactBId = '';
  let leadAId = '';
  let leadBId = '';
  let dealAId = '';
  let dealBId = '';

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(8);
    const passwordHash = await bcrypt.hash('tenant123', salt);

    const orgA = await prisma.organization.upsert({
      where: { slug: 'tenant-test-org-a' },
      update: {},
      create: {
        name: 'Organização Teste A',
        slug: 'tenant-test-org-a',
        plan: 'ENTERPRISE_360'
      }
    });
    orgAId = orgA.id;

    const orgB = await prisma.organization.upsert({
      where: { slug: 'tenant-test-org-b' },
      update: {},
      create: {
        name: 'Organização Teste B',
        slug: 'tenant-test-org-b',
        plan: 'ENTERPRISE_360'
      }
    });
    orgBId = orgB.id;

    const userA = await prisma.user.upsert({
      where: { email: 'user.a@tenant-a.com' },
      update: { organizationId: orgAId },
      create: {
        name: 'Operador Tenant A',
        email: 'user.a@tenant-a.com',
        passwordHash,
        role: UserRole.CLOSER,
        organizationId: orgAId
      }
    });
    userAId = userA.id;

    const userB = await prisma.user.upsert({
      where: { email: 'user.b@tenant-b.com' },
      update: { organizationId: orgBId },
      create: {
        name: 'Operador Tenant B',
        email: 'user.b@tenant-b.com',
        passwordHash,
        role: UserRole.CLOSER,
        organizationId: orgBId
      }
    });
    userBId = userB.id;

    const compA = await prisma.company.upsert({
      where: { organizationId_cnpj: { organizationId: orgAId, cnpj: '10.000.000/0001-01' } },
      update: {},
      create: {
        organizationId: orgAId,
        name: 'Empresa Exclusiva Tenant A',
        cnpj: '10.000.000/0001-01'
      }
    });
    companyAId = compA.id;

    const compB = await prisma.company.upsert({
      where: { organizationId_cnpj: { organizationId: orgBId, cnpj: '20.000.000/0001-02' } },
      update: {},
      create: {
        organizationId: orgBId,
        name: 'Empresa Exclusiva Tenant B',
        cnpj: '20.000.000/0001-02'
      }
    });
    companyBId = compB.id;

    const contA = await prisma.contact.create({
      data: {
        organizationId: orgAId,
        companyId: companyAId,
        name: 'Contato Exclusivo A',
        email: 'contato@tenant-a.com'
      }
    });
    contactAId = contA.id;

    const contB = await prisma.contact.create({
      data: {
        organizationId: orgBId,
        companyId: companyBId,
        name: 'Contato Exclusivo B',
        email: 'contato@tenant-b.com'
      }
    });
    contactBId = contB.id;

    const leadA = await prisma.lead.create({
      data: {
        organizationId: orgAId,
        companyId: companyAId,
        contactId: contactAId,
        assignedToId: userAId,
        title: 'Lead Exclusivo A'
      }
    });
    leadAId = leadA.id;

    const leadB = await prisma.lead.create({
      data: {
        organizationId: orgBId,
        companyId: companyBId,
        contactId: contactBId,
        assignedToId: userBId,
        title: 'Lead Exclusivo B'
      }
    });
    leadBId = leadB.id;

    const dealA = await prisma.deal.create({
      data: {
        organizationId: orgAId,
        companyId: companyAId,
        leadId: leadAId,
        assignedToId: userAId,
        title: 'Negócio Exclusivo A',
        amount: 100000,
        stage: DealStage.PROSPECT
      }
    });
    dealAId = dealA.id;

    const dealB = await prisma.deal.create({
      data: {
        organizationId: orgBId,
        companyId: companyBId,
        leadId: leadBId,
        assignedToId: userBId,
        title: 'Negócio Exclusivo B',
        amount: 250000,
        stage: DealStage.PROSPECT
      }
    });
    dealBId = dealB.id;
  });

  afterAll(async () => {
    // Limpar apenas as organizações de teste A e B sem afetar a organização matriz
    await prisma.organization.deleteMany({
      where: { slug: { in: ['tenant-test-org-a', 'tenant-test-org-b'] } }
    });
    await prisma.$disconnect();
  });

  it('1. Usuário A acessa seus próprios registros e não vê registros exclusivos de B', async () => {
    const companiesA = await prisma.company.findMany({ where: { organizationId: orgAId } });
    expect(companiesA.some((c) => c.id === companyAId)).toBe(true);
    expect(companiesA.some((c) => c.id === companyBId)).toBe(false);

    const dealsA = await prisma.deal.findMany({ where: { organizationId: orgAId } });
    expect(dealsA.some((d) => d.id === dealAId)).toBe(true);
    expect(dealsA.some((d) => d.id === dealBId)).toBe(false);
  });

  it('2. Usuário A não consegue vincular um Lead próprio a uma Empresa, Contato ou Responsável de B', async () => {
    // Tentativa de vincular Lead de A com companyBId
    await expect(
      TenantGuard.assertRelationsInTenant({ companyId: companyBId }, orgAId)
    ).rejects.toThrow(TenantSecurityError);

    // Tentativa de vincular Lead de A com contactBId
    await expect(
      TenantGuard.assertRelationsInTenant({ contactId: contactBId }, orgAId)
    ).rejects.toThrow(TenantSecurityError);

    // Tentativa de atribuir responsável de B (userBId) em registro de A
    await expect(
      TenantGuard.assertRelationsInTenant({ assignedToId: userBId }, orgAId)
    ).rejects.toThrow(TenantSecurityError);
  });

  it('3. Usuário A não consegue criar Negócio ou Atividade referenciando Lead ou Deal de B', async () => {
    await expect(
      TenantGuard.assertRelationsInTenant({ leadId: leadBId }, orgAId)
    ).rejects.toThrow(TenantSecurityError);

    await expect(
      TenantGuard.assertRelationsInTenant({ dealId: dealBId }, orgAId)
    ).rejects.toThrow(TenantSecurityError);
  });

  it('4. Usuário A não consegue movimentar nem atualizar negócios exclusivos de B', async () => {
    const dealBCheckForOrgA = await prisma.deal.findFirst({
      where: { id: dealBId, organizationId: orgAId }
    });
    expect(dealBCheckForOrgA).toBeNull();

    // Confirmar que o negócio B permanece intacto no estágio original
    const dealBIntact = await prisma.deal.findUnique({ where: { id: dealBId } });
    expect(dealBIntact?.stage).toBe(DealStage.PROSPECT);
  });

  it('5. Usuário A não consegue usar o Supervisor para referenciar entidades de B (bypass bloqueado)', async () => {
    await expect(
      SupervisorEngine.orchestrate(
        {
          targetModule: 'CRM',
          prompt: 'Criar tarefa urgente para empresa de outra organização',
          contextData: {
            companyId: companyBId,
            dealId: dealBId
          }
        },
        userAId,
        orgAId,
        'CLOSER'
      )
    ).rejects.toThrow(TenantSecurityError);
  });

  it('6. Operações válidas dentro da mesma organização A persistem normalmente e auditoria relacional retorna zero violações', async () => {
    await expect(
      TenantGuard.assertRelationsInTenant(
        {
          companyId: companyAId,
          contactId: contactAId,
          leadId: leadAId,
          dealId: dealAId,
          assignedToId: userAId
        },
        orgAId
      )
    ).resolves.toBeUndefined();

    const audit = await auditCrossTenantIntegrity();
    expect(audit.violationsFound).toBe(0);
  });
});
