import prisma from '../../../lib/prisma';
import { DealStage } from '@prisma/client';

export interface ToolExecutionContext {
  organizationId: string;
  userId: string;
  idempotencyKey?: string;
}

export interface ToolExecutionResult {
  toolCode: string;
  success: boolean;
  data: any;
  reference: string;
  error?: string;
}

export class CommercialExecutorsV31 {
  /**
   * Consulta empresas/contas cadastradas pertencentes ao tenant
   */
  public static async consultarContas(
    ctx: ToolExecutionContext,
    params?: { search?: string; limit?: number }
  ): Promise<ToolExecutionResult> {
    const limit = params?.limit || 10;
    const where: any = { organizationId: ctx.organizationId };

    if (params?.search?.trim()) {
      where.OR = [
        { name: { contains: params.search.trim(), mode: 'insensitive' } },
        { cnpj: { contains: params.search.trim() } }
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        cnpj: true,
        industry: true,
        status: true,
        annualRevenue: true,
        createdAt: true
      }
    });

    return {
      toolCode: 'crm.consultar_contas',
      success: true,
      data: { count: companies.length, companies },
      reference: `Empresas recuperadas (${companies.length}) para tenant ${ctx.organizationId}`
    };
  }

  /**
   * Consulta oportunidades/deals no pipeline pertencentes ao tenant
   */
  public static async consultarDeals(
    ctx: ToolExecutionContext,
    params?: { stage?: string; limit?: number }
  ): Promise<ToolExecutionResult> {
    const limit = params?.limit || 20;
    const where: any = { organizationId: ctx.organizationId };

    if (params?.stage) {
      where.stage = params.stage as DealStage;
    }

    const deals = await prisma.deal.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    return {
      toolCode: 'crm.consultar_deals',
      success: true,
      data: { count: deals.length, deals },
      reference: `Deals recuperados (${deals.length}) para tenant ${ctx.organizationId}`
    };
  }

  /**
   * Projeta receita e forecast ponderado com base no pipeline real da organização
   */
  public static async calcularProjecaoForecast(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: { not: DealStage.FECHADO_PERDIDO }
      },
      select: {
        id: true,
        title: true,
        amount: true,
        stage: true
      }
    });

    const probabilityWeight: Record<DealStage, number> = {
      [DealStage.PROSPECT]: 0.1,
      [DealStage.QUALIFICACAO]: 0.3,
      [DealStage.PROPOSTA_ENVIADA]: 0.6,
      [DealStage.NEGOCIACAO]: 0.8,
      [DealStage.FECHADO_GANHO]: 1.0,
      [DealStage.FECHADO_PERDIDO]: 0.0
    };

    let totalPipelineValue = 0;
    let weightedForecastValue = 0;
    const byStage: Record<string, { count: number; total: number; weighted: number }> = {};

    for (const deal of deals) {
      const val = Number(deal.amount || 0);
      const weight = probabilityWeight[deal.stage] || 0;
      const weighted = val * weight;

      totalPipelineValue += val;
      weightedForecastValue += weighted;

      if (!byStage[deal.stage]) {
        byStage[deal.stage] = { count: 0, total: 0, weighted: 0 };
      }
      byStage[deal.stage].count++;
      byStage[deal.stage].total += val;
      byStage[deal.stage].weighted += weighted;
    }

    return {
      toolCode: 'forecast.calcular_projecao',
      success: true,
      data: {
        activeDealsCount: deals.length,
        totalPipelineValue,
        weightedForecastValue,
        byStage
      },
      reference: `Projeção calculada para ${deals.length} oportunidades ativas`
    };
  }

  /**
   * Analisa a saúde do pipeline e identifica deals estagnados sem atividades recentes
   */
  public static async analisarSaudePipeline(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: { notIn: [DealStage.FECHADO_GANHO, DealStage.FECHADO_PERDIDO] }
      },
      include: {
        company: { select: { id: true, name: true } },
        activities: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, status: true, title: true }
        }
      }
    });

    const now = Date.now();
    const staleThresholdMs = 7 * 24 * 60 * 60 * 1000; // 7 dias

    const healthyDeals: any[] = [];
    const atRiskDeals: any[] = [];

    for (const d of deals) {
      const lastActivityDate = d.activities[0]?.createdAt
        ? new Date(d.activities[0].createdAt).getTime()
        : new Date(d.createdAt).getTime();

      const daysWithoutTouch = Math.floor((now - lastActivityDate) / (24 * 60 * 60 * 1000));

      if (now - lastActivityDate > staleThresholdMs) {
        atRiskDeals.push({
          dealId: d.id,
          title: d.title,
          value: Number(d.amount || 0),
          stage: d.stage,
          company: d.company?.name,
          daysWithoutTouch,
          riskReason: `Estagnado há ${daysWithoutTouch} dias sem follow-up registrado`
        });
      } else {
        healthyDeals.push({
          dealId: d.id,
          title: d.title,
          value: Number(d.amount || 0),
          stage: d.stage
        });
      }
    }

    const healthScore = deals.length > 0
      ? Math.round((healthyDeals.length / deals.length) * 100)
      : 100;

    return {
      toolCode: 'deal_health.analisar_estagnacao',
      success: true,
      data: {
        healthScore,
        totalActiveDeals: deals.length,
        atRiskCount: atRiskDeals.length,
        healthyCount: healthyDeals.length,
        atRiskDeals
      },
      reference: `Auditoria de saúde do pipeline: ${atRiskDeals.length} negócios em risco detectados`
    };
  }

  /**
   * Salva rascunho de cadência outbound (seguro, sem disparo real)
   */
  public static async salvarRascunhoCadencia(
    ctx: ToolExecutionContext,
    params: { name: string; targetSegment: string; steps: any[] }
  ): Promise<ToolExecutionResult> {
    return {
      toolCode: 'outbound.salvar_rascunho_cadencia',
      success: true,
      data: {
        cadenceName: params.name,
        targetSegment: params.targetSegment,
        stepsCount: params.steps.length,
        state: 'DRAFT_NOT_SENT'
      },
      reference: `Rascunho de cadência "${params.name}" preparado sem envio`
    };
  }
}
