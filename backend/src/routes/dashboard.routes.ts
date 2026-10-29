import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { DealStage, ActivityStatus } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

/**
 * Cálculos em tempo real de Revenue Intelligence & RevOps
 * Baseados estritamente nos dados do PostgreSQL isolado da organização.
 */
router.get('/metrics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const now = new Date();

    const [
      totalCompanies,
      totalContacts,
      totalLeads,
      deals,
      activities,
      assignees
    ] = await Promise.all([
      prisma.company.count({ where: { organizationId: orgId } }),
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.deal.findMany({
        where: { organizationId: orgId },
        include: {
          assignedTo: { select: { id: true, name: true, role: true } },
          company: { select: { id: true, name: true } }
        }
      }),
      prisma.activity.findMany({
        where: { organizationId: orgId }
      }),
      prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, role: true }
      })
    ]);

    // 1. Métricas de Pipeline & Oportunidades
    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.stage === DealStage.FECHADO_GANHO);
    const lostDeals = deals.filter(d => d.stage === DealStage.FECHADO_PERDIDO);
    const openDeals = deals.filter(d => d.stage !== DealStage.FECHADO_GANHO && d.stage !== DealStage.FECHADO_PERDIDO);

    // Valor Total do Pipeline Aberto (Fórmula: soma dos amounts dos negócios em andamento)
    const pipelineAmount = openDeals.reduce((sum, d) => sum + d.amount, 0);

    // Receita Total Ganha (Fórmula: soma dos amounts de negócios com estágio FECHADO_GANHO)
    const wonAmount = wonDeals.reduce((sum, d) => sum + d.amount, 0);

    // Receita Perdida (Fórmula: soma dos amounts de negócios com estágio FECHADO_PERDIDO)
    const lostAmount = lostDeals.reduce((sum, d) => sum + d.amount, 0);

    // Receita Prevista Ponderada (Weighted Forecast)
    // Fórmula: Somatório de (amount * (probability / 100)) para negócios abertos + 100% dos ganhos
    const weightedForecastOpen = openDeals.reduce((sum, d) => sum + (d.amount * (d.probability / 100)), 0);
    const weightedForecast = wonAmount + weightedForecastOpen;

    // Ticket Médio
    // Fórmula: Total fechado ganho / número de negócios ganhos (ou se 0, média do pipeline total)
    const averageTicket = wonDeals.length > 0 
      ? wonAmount / wonDeals.length 
      : (totalDeals > 0 ? (pipelineAmount + wonAmount) / totalDeals : 0);

    // Taxa de Conversão Global (Win Rate)
    // Fórmula: (Negócios Ganhos / (Negócios Ganhos + Negócios Perdidos)) * 100
    const finishedDealsCount = wonDeals.length + lostDeals.length;
    const winRate = finishedDealsCount > 0 ? (wonDeals.length / finishedDealsCount) * 100 : 0;

    // 2. Distribuição por Etapas do Funil
    const stagesOrdered: DealStage[] = [
      DealStage.PROSPECT,
      DealStage.QUALIFICACAO,
      DealStage.PROPOSTA_ENVIADA,
      DealStage.NEGOCIACAO,
      DealStage.FECHADO_GANHO,
      DealStage.FECHADO_PERDIDO
    ];

    const stageDistribution = stagesOrdered.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      const stageAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
      return {
        stage,
        count: stageDeals.length,
        amount: stageAmount,
        percentageOfTotalCount: totalDeals > 0 ? Math.round((stageDeals.length / totalDeals) * 100) : 0
      };
    });

    // 3. Distribuição do Pipeline por Responsável Comercial
    const repDistribution = assignees.map(user => {
      const userDeals = deals.filter(d => d.assignedToId === user.id);
      const userOpenDeals = userDeals.filter(d => d.stage !== DealStage.FECHADO_GANHO && d.stage !== DealStage.FECHADO_PERDIDO);
      const userWonDeals = userDeals.filter(d => d.stage === DealStage.FECHADO_GANHO);

      const userPipelineAmount = userOpenDeals.reduce((sum, d) => sum + d.amount, 0);
      const userWonAmount = userWonDeals.reduce((sum, d) => sum + d.amount, 0);
      const userWeightedAmount = userOpenDeals.reduce((sum, d) => sum + (d.amount * (d.probability / 100)), 0);

      return {
        userId: user.id,
        name: user.name,
        role: user.role,
        dealsCount: userDeals.length,
        openDealsCount: userOpenDeals.length,
        wonDealsCount: userWonDeals.length,
        pipelineAmount: userPipelineAmount,
        wonAmount: userWonAmount,
        weightedAmount: Math.round(userWeightedAmount)
      };
    }).filter(rep => rep.dealsCount > 0 || rep.role === 'SDR' || rep.role === 'CLOSER' || rep.role === 'MANAGER');

    // 4. Métricas de Atividades e Cadência Comercial
    const pendingActivities = activities.filter(a => a.status === ActivityStatus.PENDENTE);
    const completedActivities = activities.filter(a => a.status === ActivityStatus.CONCLUIDA);
    const overdueActivities = pendingActivities.filter(a => new Date(a.dueDate) < now);

    res.json({
      success: true,
      data: {
        summary: {
          totalCompanies,
          totalContacts,
          totalLeads,
          totalDeals,
          openDealsCount: openDeals.length,
          wonDealsCount: wonDeals.length,
          lostDealsCount: lostDeals.length,
          totalPipelineAmount: pipelineAmount,
          totalWonAmount: wonAmount,
          totalLostAmount: lostAmount,
          weightedForecast: Math.round(weightedForecast),
          averageTicket: Math.round(averageTicket),
          winRate: Math.round(winRate * 10) / 10
        },
        activitiesSummary: {
          total: activities.length,
          pending: pendingActivities.length,
          completed: completedActivities.length,
          overdue: overdueActivities.length
        },
        stageDistribution,
        repDistribution,
        recentDeals: deals.slice(0, 5),
        overdueActivitiesList: overdueActivities.slice(0, 5)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
