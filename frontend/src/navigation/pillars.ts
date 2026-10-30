export type UserRoleType = 'ADMIN' | 'MANAGER' | 'CLOSER' | 'SDR' | 'BDR' | 'VIEWER';

export type SupervisorContextModule =
  | 'CRM'
  | 'HUB'
  | 'INTELLIGENCE'
  | 'SALES_ORCHESTRATION'
  | 'REAL_TIME_PERFORMANCE'
  | 'REVENUE_FORECAST'
  | 'COPILOT'
  | 'AUTOMATIONS'
  | 'CADENCE';

export interface SubmoduleDefinition {
  id: string;
  label: string;
  path: string;
  pillarId: string;
  supervisorContext: SupervisorContextModule;
  minRole: UserRoleType;
  isImplemented: boolean;
  plannedPhase?: string;
  description: string;
}

export interface PillarDefinition {
  id: string;
  label: string; // PROIBIDO usar prefixos numerados como "1.", "2.", "Pilar 1"
  subtitle: string;
  colorClass: string;
  supervisorContext: SupervisorContextModule;
  submodules: SubmoduleDefinition[];
}

export const ROLE_LEVEL: Record<UserRoleType, number> = {
  VIEWER: 1,
  BDR: 2,
  SDR: 2,
  CLOSER: 3,
  MANAGER: 4,
  ADMIN: 5
};

export function hasRolePermission(userRole: string | undefined, minRole: UserRoleType): boolean {
  const userLvl = ROLE_LEVEL[(userRole as UserRoleType) || 'VIEWER'] || 1;
  const reqLvl = ROLE_LEVEL[minRole] || 1;
  return userLvl >= reqLvl;
}

export const EIGHT_PILLARS: PillarDefinition[] = [
  {
    id: 'hub',
    label: 'Hub Central',
    subtitle: 'Cockpit Consolidado 360° & Alertas',
    colorClass: 'text-neon-blue',
    supervisorContext: 'HUB',
    submodules: [
      {
        id: 'overview',
        label: 'Cockpit 360°',
        path: '/hub/overview',
        pillarId: 'hub',
        supervisorContext: 'HUB',
        minRole: 'VIEWER',
        isImplemented: true,
        description: 'Visão consolidada de indicadores, alertas prioritários e saúde comercial.'
      },
      {
        id: 'companies',
        label: 'Empresas & Contas',
        path: '/hub/companies',
        pillarId: 'hub',
        supervisorContext: 'CRM',
        minRole: 'SDR',
        isImplemented: true,
        description: 'Gestão de contas corporativas B2B, CNPJ, faturamento e vínculo multi-tenant.'
      },
      {
        id: 'contacts',
        label: 'Contatos & Decisores',
        path: '/hub/contacts',
        pillarId: 'hub',
        supervisorContext: 'CRM',
        minRole: 'SDR',
        isImplemented: true,
        description: 'Diretório de interlocutores e decisores vinculados às empresas do tenant.'
      }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence & Scoring',
    subtitle: 'Propensão Preditiva & ICP Matching',
    colorClass: 'text-neon-iris',
    supervisorContext: 'INTELLIGENCE',
    submodules: [
      {
        id: 'leads',
        label: 'Leads & ICP Scoring',
        path: '/intelligence/leads',
        pillarId: 'intelligence',
        supervisorContext: 'INTELLIGENCE',
        minRole: 'SDR',
        isImplemented: true,
        description: 'Qualificação de leads com pontuação de ICP, origem e distribuição comercial.'
      },
      {
        id: 'icp_matrix',
        label: 'Matriz Preditiva ICP',
        path: '/intelligence/icp-matrix',
        pillarId: 'intelligence',
        supervisorContext: 'INTELLIGENCE',
        minRole: 'MANAGER',
        isImplemented: false,
        plannedPhase: 'Fase 03',
        description: 'Calibração automática de pesos de propensão e enriquecimento externo de contas.'
      }
    ]
  },
  {
    id: 'sales',
    label: 'Sales Orchestration',
    subtitle: 'Pipeline Kanban, Negócios & Playbooks',
    colorClass: 'text-neon-pink',
    supervisorContext: 'SALES_ORCHESTRATION',
    submodules: [
      {
        id: 'pipeline',
        label: 'Pipeline & Funil Kanban',
        path: '/sales/pipeline',
        pillarId: 'sales',
        supervisorContext: 'SALES_ORCHESTRATION',
        minRole: 'SDR',
        isImplemented: true,
        description: 'Funil visual com Drag-and-Drop, probabilidades por estágio, motivo de perda e histórico.'
      },
      {
        id: 'playbooks',
        label: 'Playbooks & Matriz de Objeções',
        path: '/sales/playbooks',
        pillarId: 'sales',
        supervisorContext: 'SALES_ORCHESTRATION',
        minRole: 'CLOSER',
        isImplemented: false,
        plannedPhase: 'Fase 03',
        description: 'Roteiros dinâmicos de abordagem e contorno assistido de objeções em tempo real.'
      }
    ]
  },
  {
    id: 'realtime',
    label: 'Real-time Performance',
    subtitle: 'RevOps, Metas & Produtividade ao Vivo',
    colorClass: 'text-neon-success',
    supervisorContext: 'REAL_TIME_PERFORMANCE',
    submodules: [
      {
        id: 'revops',
        label: 'RevOps & Performance',
        path: '/realtime/revops',
        pillarId: 'realtime',
        supervisorContext: 'REAL_TIME_PERFORMANCE',
        minRole: 'CLOSER',
        isImplemented: true,
        description: 'Métricas calculadas no PostgreSQL: Win Rate, Ticket Médio, Conversão e Ranking por Rep.'
      },
      {
        id: 'live_sla',
        label: 'Monitoramento de SLA & Metas',
        path: '/realtime/sla',
        pillarId: 'realtime',
        supervisorContext: 'REAL_TIME_PERFORMANCE',
        minRole: 'MANAGER',
        isImplemented: false,
        plannedPhase: 'Fase 03',
        description: 'Painel de tempo de primeira resposta (Speed-to-Lead) e alertas de gargalo operacional.'
      }
    ]
  },
  {
    id: 'forecast',
    label: 'Revenue Forecast',
    subtitle: 'Projeção Ponderada & Análise Win/Loss',
    colorClass: 'text-neon-gold',
    supervisorContext: 'REVENUE_FORECAST',
    submodules: [
      {
        id: 'weighted_forecast',
        label: 'Forecast Ponderado & Funil',
        path: '/forecast/weighted',
        pillarId: 'forecast',
        supervisorContext: 'REVENUE_FORECAST',
        minRole: 'MANAGER',
        isImplemented: true,
        description: 'Projeção financeira ponderada por probabilidade de fechamento e dispersão de pipeline.'
      },
      {
        id: 'scenarios',
        label: 'Simulador Monte Carlo & Coortes',
        path: '/forecast/scenarios',
        pillarId: 'forecast',
        supervisorContext: 'REVENUE_FORECAST',
        minRole: 'ADMIN',
        isImplemented: false,
        plannedPhase: 'Fase 04',
        description: 'Modelagem estocástica de cenários conservador, base e agressivo por trimestre.'
      }
    ]
  },
  {
    id: 'copilot',
    label: 'Copiloto IA',
    subtitle: 'Supervisor 360° & Catálogo de 394 Agentes',
    colorClass: 'text-neon-iris',
    supervisorContext: 'COPILOT',
    submodules: [
      {
        id: 'agents_catalog',
        label: 'Catálogo dos 394 Agentes',
        path: '/copilot/agents-catalog',
        pillarId: 'copilot',
        supervisorContext: 'COPILOT',
        minRole: 'VIEWER',
        isImplemented: true,
        description: 'Registro oficial dos 394 agentes (379 normalizados + 15 célula comercial), filtros e status.'
      },
      {
        id: 'roleplay_simulator',
        label: 'Simulador de Roleplay Comercial',
        path: '/copilot/roleplay',
        pillarId: 'copilot',
        supervisorContext: 'COPILOT',
        minRole: 'SDR',
        isImplemented: false,
        plannedPhase: 'Fase 04',
        description: 'Treinamento interativo de vendas com comprador sintético e avaliação de discurso.'
      }
    ]
  },
  {
    id: 'automations',
    label: 'Automações & Gatilhos',
    subtitle: 'Regras de Negócio & Integrações Bidirecionais',
    colorClass: 'text-neon-blue',
    supervisorContext: 'AUTOMATIONS',
    submodules: [
      {
        id: 'triggers_hub',
        label: 'Orquestrador de Gatilhos & Sync',
        path: '/automations/triggers',
        pillarId: 'automations',
        supervisorContext: 'AUTOMATIONS',
        minRole: 'ADMIN',
        isImplemented: false,
        plannedPhase: 'Fase 03',
        description: 'Regras automatizadas de distribuição de leads, alertas de estagnação e webhooks.'
      }
    ]
  },
  {
    id: 'cadence',
    label: 'Cadência & Engajamento',
    subtitle: 'Atividades Comerciais, Tarefas & Follow-ups',
    colorClass: 'text-neon-pink',
    supervisorContext: 'CADENCE',
    submodules: [
      {
        id: 'activities',
        label: 'Atividades, Ligações & Follow-ups',
        path: '/cadence/activities',
        pillarId: 'cadence',
        supervisorContext: 'CADENCE',
        minRole: 'SDR',
        isImplemented: true,
        description: 'Gestão operacional de tarefas, ligações registradas, reuniões, vencimentos e pendências.'
      },
      {
        id: 'multichannel_sequences',
        label: 'Sequências Multicanal (E-mail/WhatsApp)',
        path: '/cadence/sequences',
        pillarId: 'cadence',
        supervisorContext: 'CADENCE',
        minRole: 'SDR',
        isImplemented: false,
        plannedPhase: 'Fase 03',
        description: 'Automação de cadências multicanal com disparo programado e rastreamento de engajamento.'
      }
    ]
  }
];

export const ALL_SUBMODULES: SubmoduleDefinition[] = EIGHT_PILLARS.flatMap((p) => p.submodules);

export function findSubmoduleByPath(pathname: string): { pillar: PillarDefinition; submodule: SubmoduleDefinition } {
  const cleanPath = pathname.trim() || '/sales/pipeline';
  for (const pillar of EIGHT_PILLARS) {
    for (const sub of pillar.submodules) {
      if (sub.path === cleanPath || sub.id === cleanPath.replace(/^\//, '')) {
        return { pillar, submodule: sub };
      }
    }
  }
  // Default route: Sales Orchestration -> Pipeline
  return {
    pillar: EIGHT_PILLARS[2],
    submodule: EIGHT_PILLARS[2].submodules[0]
  };
}
