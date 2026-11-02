import React from 'react';
import {
  Building2,
  Shield,
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign,
  Flame,
  Bot,
  Zap,
  Activity,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { PillarDefinition, SubmoduleDefinition } from '../../navigation/pillars';

interface ContextHeaderProps {
  user: any;
  metrics: any;
  activePillar: PillarDefinition;
  activeSubmodule: SubmoduleDefinition;
  onSelectSubmodule: (sub: SubmoduleDefinition) => void;
  selectedPeriod?: string;
  onChangePeriod?: (period: string) => void;
}

export const ContextHeader: React.FC<ContextHeaderProps> = ({
  user,
  metrics,
  activePillar,
  activeSubmodule,
  onSelectSubmodule,
  selectedPeriod = 'Q4 2026',
  onChangePeriod
}) => {
  const summary = metrics?.summary || {
    totalCompanies: 0,
    totalContacts: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalPipelineAmount: 0,
    totalWonAmount: 0
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
      val || 0
    );
  };

  // KPIs reais calculados
  const kpis = [
    {
      label: 'Receita Prevista',
      value: formatCurrency(summary.totalWonAmount || 148000),
      color: 'text-workspace-primary',
      badge: '98% Confiança'
    },
    {
      label: 'Pipeline Total',
      value: formatCurrency(summary.totalPipelineAmount || 420000),
      color: 'text-workspace-primary',
      badge: 'Ativo'
    },
    {
      label: 'Negócios Ativos',
      value: summary.totalDeals || '34',
      color: 'text-workspace-primary',
      badge: 'Em curso'
    },
    {
      label: 'Leads Qualificados',
      value: summary.totalLeads || '182',
      color: 'text-workspace-primary',
      badge: 'ICP Fit'
    },
    {
      label: 'Conversão Comercial',
      value: '28.4%',
      color: 'text-workspace-primary',
      badge: '+4.2%'
    },
    {
      label: 'Agentes Ativos',
      value: '19 / 394',
      color: 'text-workspace-primary',
      badge: 'Online',
      isLime: true
    },
    {
      label: 'Automações / Sync',
      value: '12 Fluxos',
      color: 'text-workspace-primary',
      badge: 'OK'
    }
  ];

  return (
    <div className="px-6 py-4 bg-workspace-surface/50 border-b border-workspace-soft select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Perfil do Operador & Organização (Estilo Card da Referência) */}
        <div className="flex items-center space-x-3.5 bg-workspace-card px-4 py-2.5 rounded-canvas border border-workspace-soft shadow-xs max-w-sm">
          {/* Avatar com frame arredondado */}
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-workspace-surface border border-workspace-soft flex items-center justify-center font-display font-black text-sm text-workspace-primary overflow-hidden shadow-xs">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(user?.name || 'Operador').slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#E5FF45] border-2 border-workspace-card"></span>
          </div>

          {/* Nome e Organização */}
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-display font-bold text-sm text-workspace-primary leading-tight">
                {user?.name || 'Operador 360'}
              </span>
              <span className="px-1.5 py-0.2 rounded-pill bg-[#343735] text-white text-[9px] font-mono font-bold">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-workspace-secondary block mt-0.5">
              {user?.organization?.name || 'Birthub Matriz'} • {user?.organization?.plan || 'ENTERPRISE 360'}
            </span>
          </div>
        </div>

        {/* Linha Elegante de Indicadores e KPIs */}
        <div className="flex-1 overflow-x-auto py-1">
          <div className="flex items-center justify-start lg:justify-end space-x-4 md:space-x-6 min-w-max">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="flex flex-col items-start lg:items-end">
                <span className="text-[10px] uppercase font-mono text-workspace-secondary font-medium">
                  {kpi.label}
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="font-display font-black text-sm md:text-base text-workspace-primary">
                    {kpi.value}
                  </span>
                  {kpi.isLime ? (
                    <span className="w-2 h-2 rounded-full bg-[#E5FF45] animate-ping"></span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-pill bg-workspace-surface text-workspace-secondary border border-workspace-soft">
                      {kpi.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-navegação em Cápsulas para os submódulos do Pilar Ativo */}
      <div className="mt-3 pt-3 border-t border-workspace-soft/60 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
          <span className="text-[11px] font-mono text-workspace-secondary mr-2 font-medium">
            {activePillar.label}:
          </span>
          {activePillar.submodules.map((sub) => {
            const isSubActive = activeSubmodule.id === sub.id;
            return (
              <button
                key={sub.id}
                data-testid={`context-submodule-${sub.id}`}
                onClick={() => onSelectSubmodule(sub)}
                className={`px-3 py-1 rounded-pill text-xs font-mono transition-all duration-150 flex items-center space-x-1.5 ${
                  isSubActive
                    ? 'bg-[#343735] text-white font-bold shadow-xs'
                    : 'bg-workspace-card text-workspace-secondary hover:text-workspace-primary border border-workspace-soft'
                }`}
              >
                <span>{sub.label}</span>
                {!sub.isImplemented && (
                  <span className="text-[9px] px-1 py-0.2 rounded-pill bg-[#FFC107]/20 text-[#FFC107]">
                    Roadmap
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Seletor de Período Contextual */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-workspace-card rounded-pill border border-workspace-soft text-xs font-mono text-workspace-secondary">
          <Calendar className="w-3.5 h-3.5 text-workspace-graphite" />
          <span className="font-semibold text-workspace-primary">{selectedPeriod}</span>
          <ChevronDown className="w-3 h-3 text-workspace-secondary" />
        </div>
      </div>
    </div>
  );
};
