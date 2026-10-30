import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { syncAgentsCatalogIdempotent, loadCanonicalAgentsCatalog } from '../src/modules/supervisor/catalog/catalog-importer';
import { SupervisorEngine } from '../src/modules/supervisor/supervisor.engine';

describe('Correção 01 — Catálogo Completo dos 394 Agentes & Governança do Supervisor', () => {
  let orgId = '';
  let adminId = '';
  let sdrId = '';

  beforeAll(async () => {
    const org = await prisma.organization.findUnique({
      where: { slug: 'birthhub-matriz' }
    });
    expect(org).toBeDefined();
    orgId = org!.id;

    const admin = await prisma.user.findUnique({ where: { email: 'admin@birthhub360.com' } });
    const sdr = await prisma.user.findUnique({ where: { email: 'sdr@birthhub360.com' } });
    adminId = admin!.id;
    sdrId = sdr!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Fonte de verdade documental contém exatamente 394 agentes únicos (379 normalizados + 15 célula comercial)', () => {
    const catalog = loadCanonicalAgentsCatalog();
    expect(catalog.totalAgents).toBe(394);
    expect(catalog.agents.length).toBe(394);
    expect(catalog.summary.normalized).toBe(379);
    expect(catalog.summary.commercialCell).toBe(15);

    const uniqueCodes = new Set(catalog.agents.map((a) => a.agentCode));
    expect(uniqueCodes.size).toBe(394);
  });

  it('2. Importador idempotente faz upsert sem duplicar registros e preserva metadados completos', async () => {
    const firstRun = await syncAgentsCatalogIdempotent(prisma);
    expect(firstRun.totalSynced).toBe(394);

    // Segunda execução consecutiva para comprovar idempotência
    const secondRun = await syncAgentsCatalogIdempotent(prisma);
    expect(secondRun.totalSynced).toBe(394);

    const totalInDb = await prisma.agentRegistration.count();
    expect(totalInDb).toBe(394);

    // Conferir soma por domínios = 394
    const domainSum = Object.values(secondRun.domainsCount).reduce((a, b) => a + b, 0);
    expect(domainSum).toBe(394);
  });

  it('3. Distingue rigorosamente REGISTERED, AVAILABLE, EXECUTABLE e DISABLED', async () => {
    const agents = await prisma.agentRegistration.findMany();
    const executable = agents.filter((a) => a.operationalStatus === 'EXECUTABLE');
    const available = agents.filter((a) => a.operationalStatus === 'AVAILABLE');
    const registered = agents.filter((a) => a.operationalStatus === 'REGISTERED');

    expect(executable.length).toBe(8);
    expect(available.length).toBeGreaterThan(0);
    expect(registered.length).toBeGreaterThan(300);
    expect(executable.length + available.length + registered.length).toBe(394);
  });

  it('4. Agente REGISTERED ou AVAILABLE não executa ferramenta real artificialmente quando acionado', async () => {
    const planRegistered = await SupervisorEngine.orchestrate(
      {
        targetModule: 'COPILOT',
        agentCode: 'capital-adequacy-calculator',
        prompt: 'Calcular adequação de capital'
      },
      adminId,
      orgId,
      'ADMIN'
    );

    expect(planRegistered.suggestedAgentCode).toBe('capital-adequacy-calculator');
    expect(planRegistered.operationalStatus).toBe('REGISTERED');
    expect(planRegistered.isExecutable).toBe(false);
    expect(planRegistered.simulatedOutput).toContain('Governança de Catálogo');
  });

  it('5. Agente EXECUTABLE executa ferramenta real quando autorizado pelo RBAC', async () => {
    const planExec = await SupervisorEngine.orchestrate(
      {
        targetModule: 'REVENUE_FORECAST',
        agentCode: 'revenue-intelligence',
        prompt: 'Calcular forecast e métricas de revops'
      },
      adminId,
      orgId,
      'ADMIN'
    );

    expect(planExec.suggestedAgentCode).toBe('revenue-intelligence');
    expect(planExec.operationalStatus).toBe('EXECUTABLE');
    expect(planExec.isExecutable).toBe(true);
    expect(planExec.authorizationCheck.hasPermission).toBe(true);
    expect(planExec.simulatedOutput).toContain('Diagnóstico RevOps em Tempo Real');
  });
});
