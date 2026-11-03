import React from 'react';
import {
  Calendar,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Bot,
  Activity
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
  selectedPeriod = 'Q4 2026'
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

  // KPIs executivos do Cockpit 360°
  const kpis = [
    {
      label: 'Receita Fechada (ARR)',
      value: formatCurrency(summary.totalWonAmount || 148000),
      badge: '98% Confiança',
      tone: 'blue'
    },
    {
      label: 'Pipeline Total Ponderado',
      value: formatCurrency(summary.totalPipelineAmount || 420000),
      badge: 'Ativo',
      tone: 'pink'
    },
    {
      label: 'Negócios em Curso',
      value: String(summary.totalDeals || 34),
      badge: '6 Estágios',
      tone: 'gold'
    },
    {
      label: 'Leads Qualificados',
      value: String(summary.totalLeads || 182),
      badge: 'ICP Fit > 80',
      tone: 'iris'
    },
    {
      label: 'Win Rate Global',
      value: '28.4%',
      badge: '+4.2% MoM',
      tone: 'emerald'
    },
    {
      label: 'Enxame Autônomo',
      value: '19 / 394',
      badge: 'Online',
      tone: 'iris',
      isPulse: true
    },
    {
      label: 'Webhooks & Sync',
      value: '12 Fluxos',
      badge: 'RLS OK',
      tone: 'blue'
    }
  ];

  const getBadgeStyle = (tone: string) => {
    switch (tone) {
      case 'blue':
        return 'bg-neon-blue/10 text-neon-blue border-neon-blue/30';
      case 'pink':
        return 'bg-neon-pink/10 text-neon-pink border-neon-pink/30';
      case 'gold':
        return 'bg-neon-gold/10 text-neon-gold border-neon-gold/30';
      case 'iris':
        return 'bg-neon-iris/10 text-neon-iris border-neon-iris/30';
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    }
  };

  return (
    <div className="px-6 py-3.5 bg-surface/90 backdrop-blur-md border-b border-border select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Identidade do Operador & Tenant RLS */}
        <div className="flex items-center space-x-3.5 bg-surface2/80 px-3.5 py-2 rounded-card border border-border shadow-xs max-w-sm">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/15 border border-neon-blue/30 flex items-center justify-center font-display font-bold text-xs text-neon-blue overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(user?.name || 'OP').slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface"></span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-display font-bold text-xs text-ink truncate">
                {user?.name || 'Operador 360'}
              </span>
              <span className="px-2 py-0.5 rounded-pill bg-neon-iris/15 text-neon-iris border border-neon-iris/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted block mt-0.5 truncate">
              {user?.organization?.name || 'Birthub Matriz'} • {user?.organization?.plan || 'ENTERPRISE 360'}
            </span>
          </div>
        </div>

        {/* Telemetria Executiva Horizontal */}
        <div className="flex-1 overflow-x-auto py-1">
          <div className="flex items-center justify-start lg:justify-end space-x-5 md:space-x-6 min-w-max">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="flex flex-col items-start lg:items-end">
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted font-semibold">
                  {kpi.label}
                </span>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="font-mono font-bold text-sm text-ink tabular-nums">
                    {kpi.value}
                  </span>
                  {kpi.isPulse ? (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-pill bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{kpi.badge}</span>
                    </span>
                  ) : (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-pill border ${getBadgeStyle(kpi.tone)}`}>
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
      <div className="mt-3 pt-2.5 border-t border-border/70 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neon-blue mr-2 font-bold">
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
                    ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/40 font-bold shadow-xs'
                    : 'bg-surface2/60 text-muted hover:text-ink border border-border'
                }`}
              >
                <span>{sub.label}</span>
                {!sub.isImplemented && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-pill bg-neon-gold/15 text-neon-gold border border-neon-gold/30">
                    Roadmap
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Seletor de Período Contextual */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-surface2/80 rounded-pill border border-border text-xs font-mono text-muted shrink-0">
          <Calendar className="w-3.5 h-3.5 text-neon-blue" />
          <span className="font-bold text-ink">{selectedPeriod}</span>
          <ChevronDown className="w-3 h-3 text-muted" />
        </div>
      </div>
    </div>
  );
};
