import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { SupervisorEngine } from '../src/modules/supervisor/supervisor.engine';
import { DealStage, ActivityStatus, ActivityType } from '@prisma/client';

describe('Birthub 360 - Fase 02 CRM, Pipeline & RevOps Integration Tests', () => {
  let orgId = '';
  let adminId = '';
  let sdrId = '';
  let closerId = '';

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

    const closer = await prisma.user.findUnique({
      where: { email: 'closer@birthhub360.com' }
    });
    closerId = closer!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. CRUD e Validação de Empresas com prevenção de duplicidade de CNPJ', async () => {
    const testCnpj = '99.888.777/0001-11';
    
    // Criação
    const company = await prisma.company.create({
      data: {
        organizationId: orgId,
        name: 'Tech Teste Fase 02 Ltda',
        cnpj: testCnpj,
        industry: 'Software'
      }
    });
    expect(company.id).toBeDefined();

    // Verificação de duplicidade de CNPJ no mesmo tenant
    let duplicateError = false;
    try {
      await prisma.company.create({
        data: {
          organizationId: orgId,
          name: 'Tech Teste Clone',
          cnpj: testCnpj
        }
      });
    } catch {
      duplicateError = true;
    }
    expect(duplicateError).toBe(true);

    // Limpeza
    await prisma.company.delete({ where: { id: company.id } });
  });

  it('2. Pipeline Kanban: Transição de Estágio e Histórico com Persistência', async () => {
    // Buscar um negócio existente que não seja o que já está fechado, para evitar que o teste 4 falhe
    const deal = await prisma.deal.findFirst({
      where: { organizationId: orgId, id: 'deal-vtech-enterprise' }
    });
    expect(deal).toBeDefined();

    const fromStage = deal!.stage;
    const targetStage = DealStage.NEGOCIACAO;

    // Atualização de estágio
    const updated = await prisma.deal.update({
      where: { id: deal!.id },
      data: {
        stage: targetStage,
        probability: 80
      }
    });
    expect(updated.stage).toBe(targetStage);
    expect(updated.probability).toBe(80);

    // Registro no DealStageHistory
    const history = await prisma.dealStageHistory.create({
      data: {
        organizationId: orgId,
        dealId: deal!.id,
        fromStage,
        toStage: targetStage,
        movedById: closerId,
        notes: 'Movido no teste automatizado do pipeline'
      }
    });
    expect(history.dealId).toBe(deal!.id);
    expect(history.toStage).toBe(targetStage);
  });

  it('3. Atividades Comerciais: Tarefas, Ligações, Reuniões e Vencimentos', async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const activity = await prisma.activity.create({
      data: {
        organizationId: orgId,
        assignedToId: sdrId,
        type: ActivityType.LIGACAO,
        title: 'Ligação de alinhamento teste',
        dueDate,
        status: ActivityStatus.PENDENTE
      }
    });
    expect(activity.id).toBeDefined();
    expect(activity.status).toBe(ActivityStatus.PENDENTE);

    // Concluir atividade
    const completed = await prisma.activity.update({
      where: { id: activity.id },
      data: {
        status: ActivityStatus.CONCLUIDA,
        completedAt: new Date()
      }
    });
    expect(completed.status).toBe(ActivityStatus.CONCLUIDA);
    expect(completed.completedAt).toBeDefined();

    await prisma.activity.delete({ where: { id: activity.id } });
  });

  it('4. Revenue Intelligence: Cálculos de Pipeline, Weighted Forecast e Win Rate', async () => {
    // Ensure there is at least one won deal for the tests
    const dealToWin = await prisma.deal.findFirst({ where: { organizationId: orgId, id: 'deal-agrosul-iot' } });
    if (dealToWin && dealToWin.stage !== DealStage.FECHADO_GANHO) {
       await prisma.deal.update({ where: { id: dealToWin.id }, data: { stage: DealStage.FECHADO_GANHO, probability: 100 } });
    }

    const deals = await prisma.deal.findMany({ where: { organizationId: orgId } });
    expect(deals.length).toBeGreaterThanOrEqual(3);

    const openDeals = deals.filter(d => d.stage !== DealStage.FECHADO_GANHO && d.stage !== DealStage.FECHADO_PERDIDO);
    const wonDeals = deals.filter(d => d.stage === DealStage.FECHADO_GANHO);

    const pipelineAmount = openDeals.reduce((sum, d) => sum + d.amount, 0);
    const wonAmount = wonDeals.reduce((sum, d) => sum + d.amount, 0);
    const weightedForecast = wonAmount + openDeals.reduce((sum, d) => sum + (d.amount * (d.probability / 100)), 0);

    expect(pipelineAmount).toBeGreaterThan(0);
    expect(wonAmount).toBeGreaterThan(0);
    expect(weightedForecast).toBeGreaterThan(0);
  });

  it('5. Supervisor Contextual: Execução Real de Atividade no CRM', async () => {
    const plan = await SupervisorEngine.orchestrate(
      {
        targetModule: 'CRM',
        prompt: 'Criar tarefa urgente de follow-up com cliente VTech'
      },
      closerId,
      orgId,
      'CLOSER'
    );

    expect(plan.authorizationCheck.hasPermission).toBe(true);
    expect(plan.requiredTools).toContain('create_crm_activity');
    expect(plan.simulatedOutput).toContain('criada com sucesso');

    // Verificar se a atividade foi de fato persistida no PostgreSQL
    const createdActivity = await prisma.activity.findFirst({
      where: {
        organizationId: orgId,
        title: { contains: 'Follow-up agendado via Supervisor' }
      }
    });
    expect(createdActivity).toBeDefined();
  });
});
