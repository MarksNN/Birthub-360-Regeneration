import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { SupervisorEngine } from '../src/modules/supervisor/supervisor.engine';

describe('Birthub 360 - Fase 01 Backend Integration Tests', () => {
  let orgId = '';
  let adminId = '';
  let sdrId = '';

  beforeAll(async () => {
    const org = await prisma.organization.findUnique({
      where: { slug: 'birthhub-matriz' }
    });
    expect(org).toBeDefined();
    orgId = org!.id;

    const admin = await prisma.user.findUnique({
      where: { email: 'admin@birthhub360.com' }
    });
    adminId = admin!.id;

    const sdr = await prisma.user.findUnique({
      where: { email: 'sdr@birthhub360.com' }
    });
    sdrId = sdr!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Deve confirmar isolamento multi-tenant de dados da organização', async () => {
    const companies = await prisma.company.findMany({
      where: { organizationId: orgId }
    });
    expect(companies.length).toBeGreaterThanOrEqual(2);
    expect(companies[0].organizationId).toBe(orgId);
  });

  it('2. Deve verificar entidades essenciais do CRM mínimo (Empresas, Contatos, Leads, Negócios)', async () => {
    const [companiesCount, contactsCount, leadsCount, dealsCount] = await Promise.all([
      prisma.company.count({ where: { organizationId: orgId } }),
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.deal.count({ where: { organizationId: orgId } }),
    ]);

    expect(companiesCount).toBeGreaterThan(0);
    expect(contactsCount).toBeGreaterThan(0);
    expect(leadsCount).toBeGreaterThan(0);
    expect(dealsCount).toBeGreaterThan(0);
  });

  it('3. Deve consultar o catálogo mapeado de agentes respeitando escopos', async () => {
    const agents = await prisma.agentRegistration.findMany();
    expect(agents.length).toBeGreaterThan(0);

    const universal = agents.filter(a => a.scope === 'UNIVERSAL');
    const specialized = agents.filter(a => a.scope === 'SPECIALIZED');
    expect(universal.length).toBeGreaterThan(0);
    expect(specialized.length).toBeGreaterThan(0);
  });

  it('4. Supervisor Engine: Deve orquestrar solicitação respeitando autorização RBAC', async () => {
    // Admin solicitando análise de fechamento
    const planAdmin = await SupervisorEngine.orchestrate(
      {
        targetModule: 'SALES_ORCHESTRATION',
        prompt: 'Qualificar proposta de fechamento para VTech'
      },
      adminId,
      orgId,
      'ADMIN'
    );

    expect(planAdmin).toBeDefined();
    expect(planAdmin.authorizationCheck.hasPermission).toBe(true);

    // SDR tentando rodar ação que exige perfil CLOSER/MANAGER
    const planSDR = await SupervisorEngine.orchestrate(
      {
        targetModule: 'SALES_ORCHESTRATION',
        prompt: 'Qualificar proposta de fechamento para VTech'
      },
      sdrId,
      orgId,
      'SDR'
    );

    expect(planSDR).toBeDefined();
    expect(planSDR.authorizationCheck.hasPermission).toBe(false);
    expect(planSDR.simulatedOutput).toContain('Acesso negado');
  });

  it('5. Supervisor Engine: Deve registrar auditoria de execuções no banco PostgreSQL', async () => {
    const executions = await prisma.supervisorExecution.findMany({
      where: { organizationId: orgId }
    });
    expect(executions.length).toBeGreaterThanOrEqual(2);
    expect(executions.some((e) => e.targetModule === 'SALES_ORCHESTRATION')).toBe(true);
  });
});
