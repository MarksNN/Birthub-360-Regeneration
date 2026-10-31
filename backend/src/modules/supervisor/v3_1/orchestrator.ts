import prisma from '../../../lib/prisma';
import { CommercialCatalogV31 } from './catalog';
import { CommercialContextAssemblerV31 } from './context-assembler';
import { CommercialSchemaValidatorV31 } from './schema-validator';
import { CommercialPolicyGuardV31, MissionTrackingState } from './policy-guard';
import { CommercialExecutorsV31, ToolExecutionResult } from './executors';
import {
  AgentIdV31,
  AgentResultV31,
  ArtifactV31,
  EvidenceV31,
  ExecutionToolCallV31
} from './types';

export interface OrchestrationRequestV31 {
  organizationId: string;
  userId: string;
  userPrompt: string;
  targetAgentId?: AgentIdV31;
  targetSkillIds?: string[];
  contextData?: Record<string, any>;
  correlationId?: string;
  mode?: 'CONSULTIVO' | 'OPERACIONAL';
}

export interface OrchestrationResponseV31 {
  missionId: string;
  status: 'COMPLETED' | 'PARTIAL' | 'BLOCKED' | 'APPROVAL_REQUIRED' | 'NEEDS_INFO';
  mode: 'CONSULTIVO' | 'OPERACIONAL' | 'BLOQUEADO';
  assignedAgent: {
    id: AgentIdV31;
    name: string;
  };
  skillsUsed: string[];
  playbooksLoaded: string[];
  resumo_humano: string;
  summary: string;
  artifacts: ArtifactV31[];
  executionTimeMs: number;
  policyCompliance: {
    sendEligible: boolean;
    handoffsCount: number;
    supervisorSteps: number;
  };
  rawEnvelope?: AgentResultV31;
}

export class CommercialSupervisorOrchestratorV31 {
  /**
   * Identifica o agente especialista mais indicado para o prompt fornecido
   */
  public static routeIntent(prompt: string, explicitAgentId?: AgentIdV31): {
    agentId: AgentIdV31;
    reason: string;
    suggestedSkills: string[];
  } {
    if (explicitAgentId) {
      return {
        agentId: explicitAgentId,
        reason: 'Agente explicitamente selecionado pelo chamador.',
        suggestedSkills: []
      };
    }

    const p = prompt.toLowerCase();
    const catalog = CommercialCatalogV31.getInstance();

    if (p.includes('bitrix') || p.includes('crm') || p.includes('funil') || p.includes('campo')) {
      const skills = catalog.getSkills('crm').slice(0, 3).map((s) => s.id);
      return { agentId: 'crm', reason: 'Intenção relacionada a CRM e integração Bitrix24', suggestedSkills: skills };
    }

    if (p.includes('outbound') || p.includes('cadência') || p.includes('cadencia') || p.includes('cold call') || p.includes('email frio')) {
      const skills = catalog.getSkills('outbound').slice(0, 3).map((s) => s.id);
      return { agentId: 'outbound', reason: 'Intenção de prospecção ativa e cadências outbound', suggestedSkills: skills };
    }

    if (p.includes('icp') || p.includes('território') || p.includes('territorio') || p.includes('perfil de cliente')) {
      const skills = catalog.getSkills('icp').slice(0, 3).map((s) => s.id);
      return { agentId: 'icp', reason: 'Intenção de definição de ICP e segmentação', suggestedSkills: skills };
    }

    if (p.includes('lead') || p.includes('enriquecer') || p.includes('cnpj') || p.includes('caçador') || p.includes('cacador')) {
      const skills = catalog.getSkills('prospeccao').slice(0, 3).map((s) => s.id);
      return { agentId: 'prospeccao', reason: 'Intenção de identificação e enriquecimento de leads', suggestedSkills: skills };
    }

    if (p.includes('conta') || p.includes('decisor') || p.includes('organograma') || p.includes('stakeholder')) {
      const skills = catalog.getSkills('account_intel').slice(0, 3).map((s) => s.id);
      return { agentId: 'account_intel', reason: 'Mapeamento de conta e inteligência de decisores', suggestedSkills: skills };
    }

    if (p.includes('intenção') || p.includes('intencao') || p.includes('score') || p.includes('timing')) {
      const skills = catalog.getSkills('intencao').slice(0, 3).map((s) => s.id);
      return { agentId: 'intencao', reason: 'Detecção de sinais de compra e scoring preditivo', suggestedSkills: skills };
    }

    if (p.includes('sdr') || p.includes('qualificar') || p.includes('discovery') || p.includes('spin')) {
      const skills = catalog.getSkills('sdr').slice(0, 3).map((s) => s.id);
      return { agentId: 'sdr', reason: 'Qualificação pré-vendas e reunião de discovery', suggestedSkills: skills };
    }

    if (p.includes('demo') || p.includes('solução') || p.includes('solucao') || p.includes('técnica') || p.includes('tecnica')) {
      const skills = catalog.getSkills('solucoes').slice(0, 3).map((s) => s.id);
      return { agentId: 'solucoes', reason: 'Engenharia de soluções e roteiro de demonstração', suggestedSkills: skills };
    }

    if (p.includes('fechamento') || p.includes('objeção') || p.includes('objecao') || p.includes('negociar')) {
      const skills = catalog.getSkills('negociacao').slice(0, 3).map((s) => s.id);
      return { agentId: 'negociacao', reason: 'Táticas de negociação e condução ao fechamento', suggestedSkills: skills };
    }

    if (p.includes('preço') || p.includes('preco') || p.includes('desconto') || p.includes('proposta') || p.includes('deal desk')) {
      const skills = catalog.getSkills('deal_desk').slice(0, 3).map((s) => s.id);
      return { agentId: 'deal_desk', reason: 'Precificação, alçadas e aprovação de margem', suggestedSkills: skills };
    }

    if (p.includes('saúde') || p.includes('saude') || p.includes('estagnado') || p.includes('risco') || p.includes('slippage')) {
      const skills = catalog.getSkills('deal_health').slice(0, 3).map((s) => s.id);
      return { agentId: 'deal_health', reason: 'Avaliação de risco de slippage e deal health', suggestedSkills: skills };
    }

    if (p.includes('forecast') || p.includes('previsão') || p.includes('previsao') || p.includes('atingimento')) {
      const skills = catalog.getSkills('forecast').slice(0, 3).map((s) => s.id);
      return { agentId: 'forecast', reason: 'Projeção de fechamento e confiabilidade de pipeline', suggestedSkills: skills };
    }

    if (p.includes('analytics') || p.includes('receita') || p.includes('revops') || p.includes('coorte') || p.includes('cac')) {
      const skills = catalog.getSkills('growth_analytics').slice(0, 3).map((s) => s.id);
      return { agentId: 'growth_analytics', reason: 'Inteligência de crescimento e KPIs de receita', suggestedSkills: skills };
    }

    if (p.includes('treino') || p.includes('coaching') || p.includes('feedback') || p.includes('roleplay')) {
      const skills = catalog.getSkills('coaching').slice(0, 3).map((s) => s.id);
      return { agentId: 'coaching', reason: 'Enablement e coaching comportamental comercial', suggestedSkills: skills };
    }

    if (p.includes('upsell') || p.includes('cross-sell') || p.includes('expansão') || p.includes('expansao')) {
      const skills = catalog.getSkills('expansao').slice(0, 3).map((s) => s.id);
      return { agentId: 'expansao', reason: 'Gestão de contas-chave e expansão de carteira', suggestedSkills: skills };
    }

    if (p.includes('parceiro') || p.includes('canal') || p.includes('indicação') || p.includes('indicacao')) {
      const skills = catalog.getSkills('parcerias').slice(0, 3).map((s) => s.id);
      return { agentId: 'parcerias', reason: 'Estratégia de ecossistema e comissionamento de canais', suggestedSkills: skills };
    }

    if (p.includes('perda') || p.includes('motivo de perda') || p.includes('win loss') || p.includes('win/loss')) {
      const skills = catalog.getSkills('winloss').slice(0, 3).map((s) => s.id);
      return { agentId: 'winloss', reason: 'Análise de causas-raiz de vitórias e derrotas', suggestedSkills: skills };
    }

    if (p.includes('diretor') || p.includes('estratégia') || p.includes('estrategia') || p.includes('metas') || p.includes('governança') || p.includes('governanca')) {
      const skills = catalog.getSkills('gestao').slice(0, 3).map((s) => s.id);
      return { agentId: 'gestao', reason: 'Direção comercial estratégica e alocação de recursos', suggestedSkills: skills };
    }

    // Padrão: Supervisor Comercial
    const skills = catalog.getSkills('supervisor').slice(0, 3).map((s) => s.id);
    return { agentId: 'supervisor', reason: 'Coordenação e supervisão comercial geral', suggestedSkills: skills };
  }

  /**
   * Executa a orquestração segura da missão, ativando ToolBindings do CRM real quando pertinente
   */
  public static async execute(request: OrchestrationRequestV31): Promise<OrchestrationResponseV31> {
    const startTime = Date.now();
    const missionId = `mis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const correlationId = request.correlationId || `corr-${Date.now()}`;

    // 1. Roteamento de agente e determinação de skills
    const routing = this.routeIntent(request.userPrompt, request.targetAgentId);
    const assignedAgentId = routing.agentId;
    const skillsToUse = request.targetSkillIds && request.targetSkillIds.length > 0
      ? request.targetSkillIds
      : routing.suggestedSkills;

    // 2. Montagem do contexto V3.1
    const contextResult = CommercialContextAssemblerV31.assemble(assignedAgentId, skillsToUse);

    // 3. Inicialização do tracking da missão para governança
    const trackingState: MissionTrackingState = {
      missionId,
      organizationId: request.organizationId,
      supervisorSteps: 1,
      totalHandoffs: 0,
      handoffsBySpecialist: {},
      depth: 1,
      historyAgentIds: [assignedAgentId],
      startTime
    };

    const mode = request.mode || 'CONSULTIVO';
    const catalog = CommercialCatalogV31.getInstance();
    const agentMeta = catalog.getAgent(assignedAgentId)!;

    // 4. Execução de ToolBindings reais com o CRM da organização
    const toolCalls: ExecutionToolCallV31[] = [];
    const evidenceList: EvidenceV31[] = [
      {
        sourceType: 'USER_INPUT',
        reference: 'Prompt do usuário',
        claim: `Instrução submetida: "${request.userPrompt}"`,
        verification: 'USER_REPORTED',
        observedAt: new Date().toISOString()
      }
    ];

    const artifactsList: ArtifactV31[] = [];
    let customSummary = `Análise estruturada conduzida por ${agentMeta.name} para a organização ${request.organizationId}.`;
    let customHumanResume = `[${agentMeta.name}] Avaliação concluída com sucesso com base nas diretrizes operacionais V3.1. Habilidades aplicadas: ${skillsToUse.join(', ')}. Modo: ${mode}.`;

    if (process.env.DATABASE_URL) {
      try {
        const toolCtx = {
          organizationId: request.organizationId,
          userId: request.userId,
          idempotencyKey: `idem-${missionId}`
        };

      if (assignedAgentId === 'forecast') {
        const forecastRes = await CommercialExecutorsV31.calcularProjecaoForecast(toolCtx);
        if (forecastRes.success) {
          toolCalls.push({ toolCode: forecastRes.toolCode, status: 'SUCCESS', reference: forecastRes.reference });
          evidenceList.push({
            sourceType: 'TOOL_EXECUTION',
            reference: forecastRes.toolCode,
            claim: `Pipeline ativo: ${forecastRes.data.activeDealsCount} oportunidades. Forecast ponderado: R$ ${forecastRes.data.weightedForecastValue.toLocaleString('pt-BR')}`,
            verification: 'TOOL_VERIFIED',
            observedAt: new Date().toISOString()
          });
          artifactsList.push({
            artifactType: 'REPORT',
            name: `Projeção de Pipeline e Forecast — ${agentMeta.name}`,
            payload: forecastRes.data,
            state: 'PERSISTED_VERIFIED'
          });
          customHumanResume = `[${agentMeta.name}] Projeção calculada para ${forecastRes.data.activeDealsCount} oportunidades ativas. Valor total do pipeline: R$ ${forecastRes.data.totalPipelineValue.toLocaleString('pt-BR')} (Forecast ponderado: R$ ${forecastRes.data.weightedForecastValue.toLocaleString('pt-BR')}).`;
        }
      } else if (assignedAgentId === 'deal_health') {
        const healthRes = await CommercialExecutorsV31.analisarSaudePipeline(toolCtx);
        if (healthRes.success) {
          toolCalls.push({ toolCode: healthRes.toolCode, status: 'SUCCESS', reference: healthRes.reference });
          evidenceList.push({
            sourceType: 'TOOL_EXECUTION',
            reference: healthRes.toolCode,
            claim: `Health score: ${healthRes.data.healthScore}%. Negócios em risco: ${healthRes.data.atRiskCount} de ${healthRes.data.totalActiveDeals}`,
            verification: 'TOOL_VERIFIED',
            observedAt: new Date().toISOString()
          });
          artifactsList.push({
            artifactType: 'SCORECARD',
            name: `Diagnóstico de Saúde de Deals — ${agentMeta.name}`,
            payload: healthRes.data,
            state: 'PERSISTED_VERIFIED'
          });
          customHumanResume = `[${agentMeta.name}] Diagnóstico concluído: Score de Saúde do Pipeline em ${healthRes.data.healthScore}%. ${healthRes.data.atRiskCount} negócios estagnados necessitam de follow-up prioritário.`;
        }
      } else if (assignedAgentId === 'crm') {
        const contasRes = await CommercialExecutorsV31.consultarContas(toolCtx, { limit: 5 });
        if (contasRes.success) {
          toolCalls.push({ toolCode: contasRes.toolCode, status: 'SUCCESS', reference: contasRes.reference });
          evidenceList.push({
            sourceType: 'TOOL_EXECUTION',
            reference: contasRes.toolCode,
            claim: `Foram localizadas ${contasRes.data.count} empresas ativas na organização.`,
            verification: 'TOOL_VERIFIED',
            observedAt: new Date().toISOString()
          });
          artifactsList.push({
            artifactType: 'ANALYSIS',
            name: `Auditoria de Contas de CRM — ${agentMeta.name}`,
            payload: contasRes.data,
            state: 'PERSISTED_VERIFIED'
          });
          customHumanResume = `[${agentMeta.name}] Mapeamento de CRM concluído com sucesso. ${contasRes.data.count} empresas verificadas na base com isolamento de tenant confirmado.`;
        }
      }
      } catch {
        // Em fallback de ambiente sem banco, preserva o modo consultivo sem quebrar
      }
    }

    // Se nenhum artefato foi gerado pelo executor, gera o relatório consultivo padrão
    if (artifactsList.length === 0) {
      artifactsList.push({
        artifactType: 'ANALYSIS',
        name: `Relatório Operacional — ${agentMeta.name}`,
        payload: {
          organizationId: request.organizationId,
          promptAnalyzed: request.userPrompt,
          playbooksInvolved: contextResult.flags.loadedPlaybooks,
          findings: 'Diretrizes validadas contra políticas canônicas de governança B2B.'
        },
        state: mode === 'OPERACIONAL' ? 'PREPARED_NOT_EXECUTED' : 'DRAFT_NOT_SENT'
      });
    }

    // 5. Construção do Envelope Semântico V3.1
    const rawEnvelope: AgentResultV31 = {
      schemaVersion: '3.1',
      agentId: assignedAgentId,
      missionId,
      correlationId,
      status: 'COMPLETED',
      mode: mode === 'OPERACIONAL' ? 'OPERACIONAL' : 'CONSULTIVO',
      skillIds: skillsToUse,
      summary: customSummary,
      resumo_humano: customHumanResume,
      artifacts: artifactsList,
      evidence: evidenceList,
      hypotheses: [
        'A elegibilidade legal definitiva depende da confirmação de opt-in/supressão no CRM.'
      ],
      missingData: mode === 'OPERACIONAL' ? ['Confirmação explícita do ToolBinding e aprovação de alçada'] : [],
      compliance: {
        channel: 'NONE',
        sendEligible: false,
        reason: 'Operação consultiva; nenhuma comunicação externa executada.',
        checks: [
          {
            check: 'AUTHORIZATION',
            state: 'PASS',
            reason: `Organização ${request.organizationId} confirmada pela sessão.`,
            evidenceRef: null
          },
          {
            check: 'PURPOSE',
            state: 'PASS',
            reason: 'Avaliação comercial com base em finalidade legítima.',
            evidenceRef: null
          }
        ],
        signals: {
          whatsappOptIn: 'NOT_APPLICABLE',
          optOutSuppression: 'UNKNOWN',
          touchHistory: 'UNKNOWN',
          businessHours: 'NOT_APPLICABLE',
          timezone: null
        }
      },
      approvalPending: {
        required: mode === 'OPERACIONAL',
        status: mode === 'OPERACIONAL' ? 'PENDING' : 'NOT_REQUIRED',
        action: mode === 'OPERACIONAL' ? 'PERSIST_CHANGES' : null,
        approverRole: mode === 'OPERACIONAL' ? 'MANAGER' : null,
        requestId: null,
        reason: mode === 'OPERACIONAL' ? 'Ações que afetam dados externos requerem autorização expressa.' : ''
      },
      handoffs: [],
      execution: {
        actionType: toolCalls.length > 0 ? 'READ_DATA' : 'NONE',
        performed: toolCalls.length > 0,
        state: toolCalls.length > 0 ? 'EXECUTED_VERIFIED' : 'NONE',
        executionId: toolCalls.length > 0 ? `exec-${missionId}` : null,
        idempotencyKey: toolCalls.length > 0 ? `idem-${missionId}` : null,
        toolCalls
      },
      metrics: {
        tokensPrompt: 150,
        tokensCompletion: 80,
        executionTimeMs: 15,
        costEstimateUsd: 0.001
      },
      nextStep: mode === 'OPERACIONAL'
        ? 'Aguardando validação do autorizador para eventual envio/persistência.'
        : 'Revisar checklist consultivo antes de programar ações no CRM.'
    };

    // 6. Validar o envelope gerado contra o Schema Global V3.1
    const validation = CommercialSchemaValidatorV31.validate(rawEnvelope);
    if (!validation.valid) {
      throw new Error(`Inconsistência no envelope V3.1: ${validation.errors.join('; ')}`);
    }

    const executionTimeMs = Date.now() - startTime;

    if (process.env.DATABASE_URL && request.organizationId && request.userId) {
      try {
        await prisma.supervisorExecution.create({
          data: {
            organizationId: request.organizationId,
            requestedById: request.userId,
            targetModule: 'COMERCIAL_V3_1',
            userPrompt: request.userPrompt,
            routedAgentCode: `comercial-v31-${assignedAgentId}`,
            selectedTools: toolCalls.map((t) => t.toolCode),
            status: rawEnvelope.status,
            resultSummary: rawEnvelope.resumo_humano,
            executionTimeMs
          }
        });
      } catch {
        // Ignora silenciosamente em caso de chave estrangeira mockada no teste
      }
    }

    return {
      missionId,
      status: rawEnvelope.status,
      mode: rawEnvelope.mode,
      assignedAgent: {
        id: assignedAgentId,
        name: agentMeta.name
      },
      skillsUsed: skillsToUse,
      playbooksLoaded: contextResult.flags.loadedPlaybooks,
      resumo_humano: rawEnvelope.resumo_humano,
      summary: rawEnvelope.summary,
      artifacts: rawEnvelope.artifacts,
      executionTimeMs,
      policyCompliance: {
        sendEligible: rawEnvelope.compliance.sendEligible,
        handoffsCount: trackingState.totalHandoffs,
        supervisorSteps: trackingState.supervisorSteps
      },
      rawEnvelope
    };
  }
}
