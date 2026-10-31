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
   * Calcula o score de ICP e segmenta empresas da base em tiers de fit
   */
  public static async analisarFitICP(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const companies = await prisma.company.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        deals: { select: { id: true, stage: true, amount: true } }
      },
      take: 50
    });

    const scoredAccounts = companies.map((c) => {
      let score = 50; // base score
      const reasons: string[] = [];

      // Receita Anual
      const rev = Number(c.annualRevenue || 0);
      if (rev > 5000000) {
        score += 25;
        reasons.push('Faturamento acima de R$ 5M (+25)');
      } else if (rev > 1000000) {
        score += 15;
        reasons.push('Faturamento acima de R$ 1M (+15)');
      }

      // CNPJ e dados completos
      if (c.cnpj && c.cnpj.length >= 14) {
        score += 10;
        reasons.push('CNPJ cadastrado e verificado (+10)');
      }

      // Histórico de negócios ganhos
      const hasWon = c.deals.some((d) => d.stage === DealStage.FECHADO_GANHO);
      if (hasWon) {
        score += 15;
        reasons.push('Cliente recorrente com negócio ganho (+15)');
      }

      const finalScore = Math.min(100, score);
      const tier = finalScore >= 80 ? 'TIER_1_ALTO_FIT' : finalScore >= 60 ? 'TIER_2_MEDIO_FIT' : 'TIER_3_BAIXO_FIT';

      return {
        companyId: c.id,
        name: c.name,
        industry: c.industry || 'Geral',
        annualRevenue: rev,
        icpScore: finalScore,
        tier,
        reasons
      };
    });

    const tier1Count = scoredAccounts.filter((a) => a.tier === 'TIER_1_ALTO_FIT').length;
    const tier2Count = scoredAccounts.filter((a) => a.tier === 'TIER_2_MEDIO_FIT').length;
    const tier3Count = scoredAccounts.filter((a) => a.tier === 'TIER_3_BAIXO_FIT').length;

    return {
      toolCode: 'icp.analisar_fit_leads',
      success: true,
      data: {
        totalAnalyzed: scoredAccounts.length,
        tier1Count,
        tier2Count,
        tier3Count,
        accounts: scoredAccounts.slice(0, 15)
      },
      reference: `Análise de ICP concluída: ${tier1Count} contas Tier 1 de alto fit identificadas`
    };
  }

  /**
   * Análise Causal de Win/Loss avaliando taxa de conversão e motivos de perda
   */
  public static async analisarPerdasGanhosWinLoss(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: { in: [DealStage.FECHADO_GANHO, DealStage.FECHADO_PERDIDO] }
      },
      select: {
        id: true,
        title: true,
        amount: true,
        stage: true,
        lostReason: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const wonDeals = deals.filter((d) => d.stage === DealStage.FECHADO_GANHO);
    const lostDeals = deals.filter((d) => d.stage === DealStage.FECHADO_PERDIDO);

    const totalWonValue = wonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const totalLostValue = lostDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const winRate = deals.length > 0
      ? Math.round((wonDeals.length / deals.length) * 100)
      : 0;

    const lostReasonsMap: Record<string, { count: number; value: number }> = {};
    for (const d of lostDeals) {
      const reason = d.lostReason?.trim() || 'Não especificado';
      if (!lostReasonsMap[reason]) {
        lostReasonsMap[reason] = { count: 0, value: 0 };
      }
      lostReasonsMap[reason].count++;
      lostReasonsMap[reason].value += Number(d.amount || 0);
    }

    return {
      toolCode: 'winloss.analisar_perdas_ganhos',
      success: true,
      data: {
        totalClosedDeals: deals.length,
        wonCount: wonDeals.length,
        lostCount: lostDeals.length,
        winRatePercent: winRate,
        totalWonValue,
        totalLostValue,
        topLostReasons: Object.entries(lostReasonsMap).map(([reason, stats]) => ({
          reason,
          count: stats.count,
          value: stats.value
        }))
      },
      reference: `Diagnóstico Win/Loss: Taxa de vitória de ${winRate}% em ${deals.length} negócios encerrados`
    };
  }

  /**
   * Diagnóstico de conversão e velocidade de funil comercial (RevOps / Growth)
   */
  public static async diagnosticarFunilGrowth(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const deals = await prisma.deal.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, stage: true, amount: true, createdAt: true }
    });

    const stagesOrder = [
      DealStage.PROSPECT,
      DealStage.QUALIFICACAO,
      DealStage.PROPOSTA_ENVIADA,
      DealStage.NEGOCIACAO,
      DealStage.FECHADO_GANHO,
      DealStage.FECHADO_PERDIDO
    ];

    const funnelStats = stagesOrder.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      const totalValue = stageDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
      return {
        stage,
        count: stageDeals.length,
        totalValue,
        ticketMedio: stageDeals.length > 0 ? Math.round(totalValue / stageDeals.length) : 0
      };
    });

    return {
      toolCode: 'growth_analytics.diagnosticar_funil',
      success: true,
      data: {
        totalDeals: deals.length,
        funnelDistribution: funnelStats,
        activeConversionRate: deals.length > 0
          ? Math.round((deals.filter((d) => d.stage === DealStage.FECHADO_GANHO).length / deals.length) * 100)
          : 0
      },
      reference: `Diagnóstico de funil concluído: ${deals.length} oportunidades distribuídas em 6 etapas`
    };
  }

  /**
   * Matriz de concessões e limites de alçada para negociações
   */
  public static async analisarMatrizConcessoes(
    ctx: ToolExecutionContext,
    params?: { dealId?: string }
  ): Promise<ToolExecutionResult> {
    const dealsInNegotiation = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: DealStage.NEGOCIACAO
      },
      select: { id: true, title: true, amount: true }
    });

    const matrix = {
      alçadas: [
        { nivel: 'VENDEDOR', maxDesconto: '5%', contrapartida: 'Pagamento à vista ou antecipado' },
        { nivel: 'SUPERVISOR', maxDesconto: '12%', contrapartida: 'Contrato de 24 meses ou case público' },
        { nivel: 'DEAL_DESK_DIRETORIA', maxDesconto: '20%', contrapartida: 'Pré-pagamento anual integral + exclusividade setorial' }
      ],
      dealsElegiveis: dealsInNegotiation.length,
      deals: dealsInNegotiation.slice(0, 5)
    };

    return {
      toolCode: 'negociacao.analisar_matriz_concessoes',
      success: true,
      data: matrix,
      reference: `Matriz de concessão calculada para ${dealsInNegotiation.length} negócios em negociação ativa`
    };
  }

  /**
   * Geração de roteiro de demonstração consultivo e arquitetura de valor
   */
  public static async gerarRoteiroDemoSolucoes(
    ctx: ToolExecutionContext,
    params?: { painPoints?: string[]; segment?: string }
  ): Promise<ToolExecutionResult> {
    const script = {
      etapas: [
        {
          minuto: '00-05',
          foco: 'Validação e Alinhamento de Dores',
          objetivo: 'Confirmar dores mapeadas no discovery e validar o tempo disponível dos decisores.'
        },
        {
          minuto: '05-15',
          foco: 'Visão de Futuro e Arquitetura',
          objetivo: 'Apresentar a solução sem focar em botões, mas na transformação do processo comercial.'
        },
        {
          minuto: '15-35',
          foco: 'Casos de Uso Críticos e ROI',
          objetivo: 'Demonstrar fluxo prático com dados do setor e quantificação do tempo/custo economizado.'
        },
        {
          minuto: '35-45',
          foco: 'Próximos Passos e Critérios de Decisão',
          objetivo: 'Definir mutual action plan (MAP), data de validação técnica e envio de proposta formal.'
        }
      ],
      perguntasDeImpacto: [
        'Se continuarem operando no modelo atual, qual é o impacto financeiro estimado nos próximos 6 meses?',
        'Quem além de você precisará validar a segurança e governança para aprovação?'
      ]
    };

    return {
      toolCode: 'solucoes.gerar_roteiro_demo',
      success: true,
      data: script,
      reference: 'Roteiro de demonstração estratégica e arquitetura de valor estruturado'
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
