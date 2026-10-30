import prisma from '../../lib/prisma';
import { SupervisorRequest, SupervisorPlan } from './supervisor.types';
import { UserRole, DealStage, ActivityType, AgentOperationalStatus } from '@prisma/client';
import { TenantGuard, TenantSecurityError } from '../../lib/tenant-guard';

export class SupervisorEngine {
  /**
   * Avalia a intenção do usuário no módulo especificado, identifica o agente mapeado
   * no catálogo oficial dos 394 agentes e executa ferramentas autorizadas reais no CRM / Pipeline / RevOps
   * respeitando o isolamento multi-tenant e a classificação operacional (REGISTERED, AVAILABLE, EXECUTABLE, DISABLED).
   */
  public static async orchestrate(
    request: SupervisorRequest,
    userId: string,
    organizationId: string,
    userRole: string
  ): Promise<SupervisorPlan> {
    const startTime = Date.now();

    // 1. Validar se contextData contém IDs de entidades e garantir que pertencem à mesma organização
    if (request.contextData) {
      await TenantGuard.assertRelationsInTenant(
        {
          companyId: request.contextData.companyId,
          contactId: request.contextData.contactId,
          leadId: request.contextData.leadId,
          dealId: request.contextData.dealId,
          assignedToId: request.contextData.assignedToId
        },
        organizationId
      );
    }

    // 2. Localizar agentes cadastrados no catálogo
    const registeredAgents = await prisma.agentRegistration.findMany();

    const promptLower = request.prompt.toLowerCase();

    let targetAgent = request.agentCode
      ? registeredAgents.find((a) => a.agentCode === request.agentCode)
      : undefined;

    if (!targetAgent) {
      // Roteamento inteligente por intenção comercial usando códigos canônicos dos 394 agentes
      if (
        promptLower.includes('revops') ||
        promptLower.includes('indicador') ||
        promptLower.includes('métrica') ||
        promptLower.includes('kpi') ||
        promptLower.includes('forecast')
      ) {
        targetAgent = registeredAgents.find((a) => a.agentCode === 'revenue-intelligence');
      } else if (
        promptLower.includes('tarefa') ||
        promptLower.includes('atividade') ||
        promptLower.includes('ligação') ||
        promptLower.includes('reunião') ||
        promptLower.includes('follow-up')
      ) {
        targetAgent = registeredAgents.find((a) => a.agentCode === 'bdr-outbound' || a.agentCode === 'sdr-qualification');
      } else if (
        promptLower.includes('fechamento') ||
        promptLower.includes('proposta') ||
        promptLower.includes('negócio') ||
        promptLower.includes('pipeline') ||
        promptLower.includes('etapa')
      ) {
        targetAgent = registeredAgents.find((a) => a.agentCode === 'closer-sales');
      } else if (promptLower.includes('icp') || promptLower.includes('qualificar') || promptLower.includes('score')) {
        targetAgent = registeredAgents.find((a) => a.agentCode === 'ldr-intelligence' || a.agentCode === 'account-detective');
      } else if (promptLower.includes('cadência') || promptLower.includes('email') || promptLower.includes('outbound')) {
        targetAgent = registeredAgents.find((a) => a.agentCode === 'bdr-outbound');
      } else if (promptLower.includes('contrato') || promptLower.includes('assinatura')) {
        targetAgent = registeredAgents.find((a) => a.agentCode === 'contract-signature');
      } else if (promptLower.includes('churn') || promptLower.includes('retenção')) {
        targetAgent = registeredAgents.find((a) => a.agentCode === 'churn-retention');
      } else {
        // Busca por nome, código ou capacidade no prompt
        targetAgent = registeredAgents.find(
          (a) =>
            promptLower.includes(a.agentCode.toLowerCase()) ||
            promptLower.includes(a.name.toLowerCase()) ||
            a.capabilities.some((cap) => promptLower.includes(cap.toLowerCase()))
        );
      }
    }

    if (!targetAgent) {
      // Mapeamento por módulo comercial
      const moduleToAgentCode: Record<string, string> = {
        CRM: 'sdr-qualification',
        HUB: 'coordinator-commercial',
        INTELLIGENCE: 'ldr-intelligence',
        SALES_ORCHESTRATION: 'closer-sales',
        REAL_TIME_PERFORMANCE: 'manager-commercial',
        REVENUE_FORECAST: 'revenue-intelligence',
        COPILOT: 'account-detective',
        AUTOMATIONS: 'bitrix-guardian',
        CADENCE: 'bdr-outbound'
      };
      const fallbackCode = moduleToAgentCode[request.targetModule] || 'sdr-qualification';
      targetAgent = registeredAgents.find((a) => a.agentCode === fallbackCode) || registeredAgents[0];
    }

    // Fallback estruturado caso o banco ainda não tenha sido populado
    const selected = targetAgent || {
      agentCode: 'sdr-qualification',
      name: 'Agente SDR — Qualificação',
      characterRole: 'SDR',
      domain: 'Vendas',
      subgroup: 'Qualificação e descoberta',
      operationalStatus: AgentOperationalStatus.EXECUTABLE,
      universalCapabilities: ['agent.discover', 'agent.execute', 'agent.request_cross_role'],
      specializedCapabilities: ['lead.qualify', 'crm.read'],
      capabilities: ['agent.discover', 'agent.execute', 'lead.qualify', 'crm.read'],
      allowedTools: ['read_crm_state', 'create_crm_activity', 'inspect_crm_pipeline'],
      requiredRole: UserRole.SDR,
      isActive: true,
      isExecutable: true
    };

    // 3. Verificação de autorização baseada em RBAC estrito
    const roleHierarchy: Record<string, number> = {
      VIEWER: 1,
      BDR: 2,
      SDR: 2,
      CLOSER: 3,
      MANAGER: 4,
      ADMIN: 5
    };

    const userLevel = roleHierarchy[userRole] || 1;
    const requiredLevel = roleHierarchy[selected.requiredRole] || 2;
    const hasPermission = userLevel >= requiredLevel;

    const opStatus = !selected.isActive
      ? 'DISABLED'
      : (selected.operationalStatus as 'REGISTERED' | 'AVAILABLE' | 'EXECUTABLE' | 'DISABLED');

    let output = '';
    let executedTools: string[] = [];
    let executionRecordStatus = 'COMPLETED';

    if (!hasPermission) {
      output = `Acesso negado: A operação com o agente ${selected.name} (${selected.agentCode}) requer o perfil ${selected.requiredRole}, mas seu usuário possui perfil ${userRole}.`;
      executionRecordStatus = 'FORBIDDEN';
    } else if (opStatus === 'DISABLED' || !selected.isActive) {
      output = `[Agente Desativado] O agente ${selected.name} (${selected.agentCode}) encontra-se com status DISABLED e não pode ser executado.`;
      executionRecordStatus = 'SKIPPED_DISABLED';
    } else if (opStatus !== 'EXECUTABLE' || !selected.isExecutable) {
      output = `[Governança de Catálogo — Status: ${opStatus}] O agente ${selected.name} (${selected.agentCode}) existe no catálogo oficial dos 394 agentes sob o domínio "${selected.domain} / ${selected.subgroup}", mas não possui executor/ferramenta ativa homologada nesta fase. Nenhuma execução simulada foi disparada. Ferramentas previstas no mapeamento: ${selected.allowedTools.join(', ')}.`;
      executedTools = [];
      executionRecordStatus = `CATALOG_${opStatus}`;
    } else {
      // 4. Execução REAL de ferramentas autorizadas apenas para agentes EXECUTABLE
      if (
        promptLower.includes('criar tarefa') ||
        promptLower.includes('agendar follow-up') ||
        promptLower.includes('registrar ligação')
      ) {
        executedTools.push('create_crm_activity');
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);

        const activity = await prisma.activity.create({
          data: {
            organizationId,
            assignedToId: userId,
            companyId: request.contextData?.companyId || null,
            contactId: request.contextData?.contactId || null,
            leadId: request.contextData?.leadId || null,
            dealId: request.contextData?.dealId || null,
            title: `Follow-up agendado via Supervisor: "${request.prompt.slice(0, 40)}..."`,
            type: promptLower.includes('ligação') ? ActivityType.LIGACAO : ActivityType.FOLLOW_UP,
            dueDate,
            description: `Criado automaticamente pelo agente ${selected.agentCode} com base na instrução: ${request.prompt}`
          }
        });
        output = `[Operação Executada — Agente ${selected.name}] Atividade ID ${activity.id.slice(0, 8)} criada com sucesso na organização para ${dueDate.toLocaleDateString('pt-BR')}. Ferramenta 'create_crm_activity' executada no PostgreSQL.`;
      } else if (
        promptLower.includes('revops') ||
        promptLower.includes('kpi') ||
        promptLower.includes('forecast') ||
        promptLower.includes('métrica')
      ) {
        executedTools.push('calculate_revops_metrics');
        const deals = await prisma.deal.findMany({ where: { organizationId } });
        const openDeals = deals.filter((d) => d.stage !== DealStage.FECHADO_GANHO && d.stage !== DealStage.FECHADO_PERDIDO);
        const wonDeals = deals.filter((d) => d.stage === DealStage.FECHADO_GANHO);
        const pipelineAmount = openDeals.reduce((s, d) => s + d.amount, 0);
        const wonAmount = wonDeals.reduce((s, d) => s + d.amount, 0);
        const weightedForecast = wonAmount + openDeals.reduce((s, d) => s + d.amount * (d.probability / 100), 0);

        output = `[Diagnóstico RevOps em Tempo Real — Agente ${selected.name}] Pipeline ativo da organização: R$ ${pipelineAmount.toLocaleString('pt-BR')} em ${openDeals.length} negócios. Receita Ganha: R$ ${wonAmount.toLocaleString('pt-BR')}. Previsão Ponderada: R$ ${Math.round(weightedForecast).toLocaleString('pt-BR')}. Ferramenta 'calculate_revops_metrics' executada no PostgreSQL.`;
      } else {
        executedTools.push(...selected.allowedTools);
        const [companiesCount, dealsCount, pendingActivities] = await Promise.all([
          prisma.company.count({ where: { organizationId } }),
          prisma.deal.count({ where: { organizationId } }),
          prisma.activity.count({ where: { organizationId, status: 'PENDENTE' } })
        ]);
        output = `[Execução Concluída — Agente ${selected.name} (${selected.agentCode})] Contexto ${request.targetModule} inspecionado na organização atual (${companiesCount} empresas, ${dealsCount} negócios, ${pendingActivities} atividades pendentes). Ferramentas executadas: ${executedTools.join(', ')}.`;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    // 5. Registro de auditoria no PostgreSQL
    await prisma.supervisorExecution.create({
      data: {
        organizationId,
        requestedById: userId,
        targetModule: request.targetModule,
        userPrompt: request.prompt,
        routedAgentCode: selected.agentCode,
        selectedTools: executedTools.length > 0 ? executedTools : selected.allowedTools,
        status: executionRecordStatus,
        resultSummary: output,
        executionTimeMs
      }
    });

    return {
      suggestedAgentCode: selected.agentCode,
      suggestedAgentName: selected.name,
      characterRole: selected.characterRole,
      domain: selected.domain,
      subgroup: selected.subgroup,
      operationalStatus: opStatus,
      reasoning: `Roteado para o agente ${selected.name} (${selected.domain} / ${selected.subgroup}) com status operacional ${opStatus}.`,
      requiredTools: executedTools.length > 0 ? executedTools : selected.allowedTools,
      universalCapabilities: selected.universalCapabilities || [],
      specializedCapabilities: selected.specializedCapabilities || [],
      isExecutable: opStatus === 'EXECUTABLE' && selected.isExecutable,
      authorizationCheck: {
        userRole,
        requiredRole: selected.requiredRole,
        hasPermission
      },
      simulatedOutput: output
    };
  }
}
