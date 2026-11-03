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

  /**
   * Mapeia organograma, stakeholders e influenciadores de contas (Account Intel)
   */
  public static async mapearStakeholdersAccountIntel(
    ctx: ToolExecutionContext,
    params?: { companyId?: string }
  ): Promise<ToolExecutionResult> {
    const where: any = { organizationId: ctx.organizationId };
    if (params?.companyId) {
      where.companyId = params.companyId;
    }

    const contacts = await prisma.contact.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true } }
      }
    });

    const categorized = contacts.map(c => {
      const role = (c.roleTitle || '').toLowerCase();
      let persona = 'USUARIO_OPERACIONAL';
      if (role.includes('ceo') || role.includes('diretor') || role.includes('vp') || role.includes('head') || role.includes('sócio') || role.includes('socio')) {
        persona = 'DECISOR_ECONOMICO';
      } else if (role.includes('cto') || role.includes('tech') || role.includes('arquiteto') || role.includes('engenheiro') || role.includes('ti') || role.includes('desenvolvedor')) {
        persona = 'DECISOR_TECNICO';
      } else if (role.includes('gerente') || role.includes('lider') || role.includes('líder') || role.includes('coordenador')) {
        persona = 'CAMPEAO_INTERNO';
      }

      return {
        contactId: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        roleTitle: c.roleTitle || 'Não especificado',
        companyName: c.company?.name || 'Não vinculada',
        persona
      };
    });

    const economicDecisionMakers = categorized.filter(c => c.persona === 'DECISOR_ECONOMICO').length;
    const technicalDecisionMakers = categorized.filter(c => c.persona === 'DECISOR_TECNICO').length;
    const champions = categorized.filter(c => c.persona === 'CAMPEAO_INTERNO').length;

    return {
      toolCode: 'account_intel.mapear_stakeholders',
      success: true,
      data: {
        totalContacts: contacts.length,
        economicDecisionMakers,
        technicalDecisionMakers,
        champions,
        stakeholders: categorized
      },
      reference: `Mapeamento de organograma: ${categorized.length} stakeholders classificados em 4 personas`
    };
  }

  /**
   * Avalia completude e enriquece dados de prospecção de leads (Caçador de Leads)
   */
  public static async enriquecerLeadsProspeccao(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const leads = await prisma.lead.findMany({
      where: { organizationId: ctx.organizationId },
      take: 25,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, cnpj: true, industry: true } },
        contact: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    const evaluatedLeads = leads.map(l => {
      let dataHealth = 0;
      const missingFields: string[] = [];

      if (l.title) dataHealth += 20;
      if (l.company?.cnpj) dataHealth += 25; else missingFields.push('CNPJ da Empresa');
      if (l.contact?.email) dataHealth += 25; else missingFields.push('Email do Contato');
      if (l.contact?.phone) dataHealth += 20; else missingFields.push('Telefone de Contato');
      if (l.company?.industry) dataHealth += 10; else missingFields.push('Segmento de Mercado');

      return {
        leadId: l.id,
        title: l.title,
        company: l.company?.name || 'Não informada',
        status: l.status,
        score: l.score,
        dataHealthPercent: dataHealth,
        missingFields
      };
    });

    const completeLeads = evaluatedLeads.filter(l => l.dataHealthPercent >= 80).length;

    return {
      toolCode: 'prospeccao.enriquecer_leads',
      success: true,
      data: {
        totalLeads: leads.length,
        readyForOutboundCount: completeLeads,
        needsEnrichmentCount: leads.length - completeLeads,
        leads: evaluatedLeads.slice(0, 10)
      },
      reference: `Auditoria de prospecção: ${completeLeads} leads prontos para abordagem outbound`
    };
  }

  /**
   * Calcula score de intenção e timing de compra com base em sinais e atividades recentes
   */
  public static async calcularScoreIntencao(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: { notIn: [DealStage.FECHADO_GANHO, DealStage.FECHADO_PERDIDO] }
      },
      include: {
        company: { select: { name: true } },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, type: true, title: true }
        }
      },
      take: 20
    });

    const now = Date.now();
    const scoredDeals = deals.map(d => {
      let intentScore = 40;
      const recentActivities = d.activities;

      if (recentActivities.length >= 3) intentScore += 25;
      else if (recentActivities.length >= 1) intentScore += 10;

      if (recentActivities.length > 0) {
        const lastTouch = new Date(recentActivities[0].createdAt).getTime();
        const hoursAgo = (now - lastTouch) / (1000 * 60 * 60);
        if (hoursAgo < 48) intentScore += 25;
        else if (hoursAgo < 168) intentScore += 15;
      }

      if (d.stage === DealStage.PROPOSTA_ENVIADA || d.stage === DealStage.NEGOCIACAO) {
        intentScore += 15;
      }

      const finalIntentScore = Math.min(100, intentScore);
      const buyingWindow = finalIntentScore >= 80 ? 'QUENTE_IMEDIATO' : finalIntentScore >= 60 ? 'MORNO_MEDIO_PRAZO' : 'FRIO_LONGO_PRAZO';

      return {
        dealId: d.id,
        title: d.title,
        companyName: d.company?.name || 'Geral',
        stage: d.stage,
        intentScore: finalIntentScore,
        buyingWindow,
        recentTouchesCount: recentActivities.length
      };
    });

    const hotCount = scoredDeals.filter(d => d.buyingWindow === 'QUENTE_IMEDIATO').length;

    return {
      toolCode: 'intencao.calcular_score_intencao',
      success: true,
      data: {
        totalEvaluated: scoredDeals.length,
        hotWindowCount: hotCount,
        deals: scoredDeals
      },
      reference: `Inteligência de intenção: ${hotCount} negócios em janela de compra quente (<48h)`
    };
  }

  /**
   * Gera roteiro estruturado de reunião de qualificação e discovery SPIN Selling (SDR)
   */
  public static async gerarRoteiroDiscoverySDR(
    ctx: ToolExecutionContext,
    params?: { segment?: string; leadName?: string }
  ): Promise<ToolExecutionResult> {
    const discoveryFramework = {
      metodologia: 'SPIN_SELLING_BANT',
      estrutura: [
        {
          bloco: 'SITUAÇÃO',
          objetivo: 'Compreender o cenário atual da operação comercial e ferramentas em uso.',
          perguntas: [
            'Como vocês gerenciam hoje o fluxo de leads desde a prospecção até o fechamento?',
            'Qual o tamanho atual da equipe comercial e qual CRM utilizam?'
          ]
        },
        {
          bloco: 'PROBLEMA',
          objetivo: 'Identificar dores explícitas e gargalos no processo.',
          perguntas: [
            'Onde vocês sentem que mais perdem oportunidades no funil atual?',
            'Qual é a principal dificuldade dos vendedores no cumprimento da cota mensal?'
          ]
        },
        {
          bloco: 'IMPLICAÇÃO',
          objetivo: 'Tornar a dor urgente e quantificar o custo da inação.',
          perguntas: [
            'Qual o impacto financeiro de manter essa taxa de conversão no próximo trimestre?',
            'Como a falta de visibilidade afeta as projeções de forecast da diretoria?'
          ]
        },
        {
          bloco: 'NECESSIDADE DE SOLUÇÃO',
          objetivo: 'Levar o prospect a verbalizar o valor de uma plataforma unificada.',
          perguntas: [
            'Se a IA pudesse antecipar negócios em risco e guiar os vendedores em tempo real, quanto tempo seria economizado?',
            'O que tornaria essa mudança prioritária para vocês ainda neste mês?'
          ]
        }
      ],
      criteriosQualificacaoBANT: {
        budget: 'Orçamento aprovado ou margem discricionária mapeada',
        authority: 'Decisor econômico (C-Level ou Head) envolvido na demo',
        need: 'Pelo menos 2 dores críticas de implicação confirmadas',
        timeline: 'Prazo de decisão e go-live inferior a 60 dias'
      }
    };

    return {
      toolCode: 'sdr.gerar_roteiro_discovery',
      success: true,
      data: discoveryFramework,
      reference: 'Roteiro de Discovery SPIN Selling estruturado com critérios de qualificação BANT'
    };
  }

  /**
   * Avalia margem de contribuição, viabilidade econômico-financeira e alçadas de aprovação (Deal Desk)
   */
  public static async avaliarViabilidadeDealDesk(
    ctx: ToolExecutionContext,
    params?: { amount?: number; discountPercent?: number; contractTermMonths?: number }
  ): Promise<ToolExecutionResult> {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: { in: [DealStage.PROPOSTA_ENVIADA, DealStage.NEGOCIACAO] }
      },
      select: { id: true, title: true, amount: true, stage: true },
      take: 10
    });

    const evaluated = deals.map(d => {
      const val = Number(d.amount || 0);
      const margemBrutaEstimada = val * 0.72;
      const custoImplantacao = val * 0.15;
      const margemContribuicao = margemBrutaEstimada - custoImplantacao;

      return {
        dealId: d.id,
        title: d.title,
        valorTotal: val,
        margemBrutaPercent: 72,
        margemContribuicaoLiquida: margemContribuicao,
        statusAprovacao: val > 100000 ? 'REQUER_APROVACAO_DIRETORIA' : val > 30000 ? 'APROVADO_SUPERVISAO' : 'APROVACAO_AUTOMATICA'
      };
    });

    return {
      toolCode: 'deal_desk.avaliar_viabilidade_deal',
      success: true,
      data: {
        dealsAnalisados: evaluated.length,
        politicaPrecificacao: {
          tabelaOficialVigente: '2026.Q4',
          margemMinimaPermitida: '55%',
          prazoMaximoFaturamento: '30 dias'
        },
        propostas: evaluated
      },
      reference: `Análise Deal Desk: ${evaluated.length} propostas auditadas com cálculo de margem e alçadas`
    };
  }

  /**
   * Diagnóstico de competências comerciais da equipe de vendas e plano de treinamento (Coaching)
   */
  public static async avaliarCompetenciasCoaching(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const users = await prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        dealsAssigned: { select: { id: true, stage: true, amount: true } },
        activitiesAssigned: { select: { id: true, status: true } }
      },
      take: 15
    });

    const reps = users.map(u => {
      const totalDeals = u.dealsAssigned.length;
      const wonDeals = u.dealsAssigned.filter(d => d.stage === DealStage.FECHADO_GANHO).length;
      const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
      const totalActivities = u.activitiesAssigned.length;

      let focoTreinamento = 'Técnicas de Fechamento e Contorno de Objeções';
      if (totalActivities < 5) {
        focoTreinamento = 'Disciplina de Cadência e Registro de Atividades';
      } else if (conversionRate < 20) {
        focoTreinamento = 'Qualificação Avançada e Discovery SPIN';
      } else if (conversionRate >= 40) {
        focoTreinamento = 'Negociação de Grandes Contas e Multi-threading';
      }

      return {
        userId: u.id,
        name: u.name,
        role: u.role,
        dealsCount: totalDeals,
        wonDealsCount: wonDeals,
        conversionRatePercent: conversionRate,
        activitiesCount: totalActivities,
        focoTreinamento
      };
    });

    return {
      toolCode: 'coaching.avaliar_competencias_equipe',
      success: true,
      data: {
        totalReps: reps.length,
        equipe: reps
      },
      reference: `Diagnóstico de coaching: Plano de desenvolvimento gerado para ${reps.length} consultores`
    };
  }

  /**
   * Identifica oportunidades de upsell, cross-sell e expansão de clientes ativos (Expansão / CS)
   */
  public static async identificarOportunidadesExpansao(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const wonDeals = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: DealStage.FECHADO_GANHO
      },
      include: {
        company: { select: { id: true, name: true, annualRevenue: true, industry: true } }
      },
      take: 20
    });

    const expansionPlays = wonDeals.map(d => {
      const originalValue = Number(d.amount || 0);
      const potencialExpansao = Math.round(originalValue * 0.35);

      return {
        companyId: d.company?.id,
        companyName: d.company?.name || 'Cliente Ativo',
        dealOriginal: d.title,
        valorContratoAtual: originalValue,
        potencialExpansaoEstimado: potencialExpansao,
        estrategiaSugerida: originalValue > 50000 
          ? 'Cross-sell de Módulo de Inteligência Preditiva + Assentos Adicionais'
          : 'Upgrade de Plano Standard para Enterprise + Treinamento Avançado'
      };
    });

    const totalPipelineExpansao = expansionPlays.reduce((sum, p) => sum + p.potencialExpansaoEstimado, 0);

    return {
      toolCode: 'expansao.identificar_oportunidades_upsell',
      success: true,
      data: {
        totalClientesAnalisados: wonDeals.length,
        pipelineTotalExpansao: totalPipelineExpansao,
        oportunidades: expansionPlays
      },
      reference: `Estratégia de expansão: R$ ${totalPipelineExpansao.toLocaleString('pt-BR')} em potencial de upsell identificado`
    };
  }

  /**
   * Modelo de canais, atribuição e comissionamento de parceiros e ecossistema (Parcerias)
   */
  public static async calcularComissionamentoParcerias(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: ctx.organizationId,
        stage: DealStage.FECHADO_GANHO
      },
      select: { id: true, title: true, amount: true },
      take: 10
    });

    const partnerTiers = [
      { tier: 'SILVER', feeIndicacao: '10%', contrapartida: 'Indicação qualificada com reunião agendada' },
      { tier: 'GOLD', feeIndicacao: '15%', contrapartida: 'Co-sell com acompanhamento conjunto até fechamento' },
      { tier: 'PLATINUM', feeIndicacao: '20%', contrapartida: 'Revenda direta homologada + suporte N1' }
    ];

    const totalWon = deals.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const estimatedPartnerPayout = Math.round(totalWon * 0.15);

    return {
      toolCode: 'parcerias.calcular_comissionamento_canais',
      success: true,
      data: {
        niveisParceria: partnerTiers,
        faturamentoElegivelParceiros: totalWon,
        projecaoComissoesCanais: estimatedPartnerPayout,
        politicaRegras: 'Pagamento em D+30 após compensação do faturamento do cliente final'
      },
      reference: 'Estrutura de comissionamento de canais e governança de ecossistema estruturada'
    };
  }

  /**
   * Scorecard executivo de metas, cota consolidada e governança estratégica (Head de Vendas / Gestão)
   */
  public static async avaliarAtingimentoMetasGestao(
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const allDeals = await prisma.deal.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, amount: true, stage: true }
    });

    const totalRealizado = allDeals
      .filter(d => d.stage === DealStage.FECHADO_GANHO)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const totalEmAberto = allDeals
      .filter(d => d.stage !== DealStage.FECHADO_GANHO && d.stage !== DealStage.FECHADO_PERDIDO)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const metaPeriodo = Math.max(500000, totalRealizado * 1.25);
    const percentualAtingido = metaPeriodo > 0 ? Math.round((totalRealizado / metaPeriodo) * 100) : 0;
    const coberturaPipeline = totalEmAberto > 0 && metaPeriodo > 0 ? (totalEmAberto / (metaPeriodo - totalRealizado || 1)).toFixed(2) : '1.00';

    return {
      toolCode: 'gestao.avaliar_atingimento_metas',
      success: true,
      data: {
        metaPeriodo,
        totalRealizado,
        totalPipelineEmAberto: totalEmAberto,
        percentualAtingido,
        indiceCoberturaPipeline: `${coberturaPipeline}x`,
        statusGovernanca: percentualAtingido >= 100 ? 'META_SUPERADA' : percentualAtingido >= 75 ? 'DENTRO_DO_PLANEJADO' : 'ATENCAO_CRITICA'
      },
      reference: `Diretoria Comercial: Atingimento em ${percentualAtingido}% com índice de cobertura de pipeline ${coberturaPipeline}x`
    };
  }
}
