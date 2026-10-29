import React from 'react';
import { 
  Building2, 
  Flame, 
  TrendingUp, 
  DollarSign, 
  Briefcase
} from 'lucide-react';

interface DashboardViewProps {
  metrics: any;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="h-32 bg-surface rounded-card border border-border"></div>
        ))}
      </div>
    );
  }

  const summary = metrics?.summary || {
    totalCompanies: 0,
    totalContacts: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalPipelineAmount: 0,
    totalWonAmount: 0
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const kpis = [
    {
      label: 'Pipeline Ativo',
      value: formatCurrency(summary.totalPipelineAmount),
      subtext: `${summary.totalDeals} oportunidades em curso`,
      icon: TrendingUp,
      color: 'text-neon-blue',
      titleClass: 'neon-title-cyan'
    },
    {
      label: 'Receita Fechada',
      value: formatCurrency(summary.totalWonAmount),
      subtext: 'Contratos fechados e faturados',
      icon: DollarSign,
      color: 'text-neon-success',
      titleClass: 'neon-title-gold'
    },
    {
      label: 'Leads no Radar',
      value: summary.totalLeads,
      subtext: 'Prospecções e cadências ativas',
      icon: Flame,
      color: 'text-neon-pink',
      titleClass: 'neon-title-pink'
    },
    {
      label: 'Empresas & Contas',
      value: summary.totalCompanies,
      subtext: `${summary.totalContacts} decisores mapeados`,
      icon: Building2,
      color: 'text-neon-iris',
      titleClass: 'neon-title-iris'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card-neon p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-mono font-medium text-muted">
                  {kpi.label}
                </span>
                <div className="p-2 bg-surface2 rounded-control border border-border">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>

              <div>
                <span className={`font-display text-2xl font-black ${kpi.titleClass}`}>
                  {kpi.value}
                </span>
                <span className="block text-xs text-muted mt-1 font-mono">
                  {kpi.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de Dados Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Recentes */}
        <div className="card-neon p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm neon-title-cyan">
                Leads Recentes em Qualificação
              </h3>
              <p className="text-xs text-muted">Priorização orientada por ICP Scoring</p>
            </div>
            <Flame className="w-4 h-4 text-neon-pink" />
          </div>

          <div className="space-y-3">
            {metrics?.recentLeads?.length > 0 ? (
              metrics.recentLeads.map((lead: any) => (
                <div key={lead.id} className="p-3 bg-surface2 rounded-control border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-neon-blue block">
                      {lead.title}
                    </span>
                    <span className="text-[11px] text-muted">
                      {lead.company?.name || 'Sem empresa vinculada'} • Score: <strong className="text-neon-gold">{lead.score}/100</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-surface text-neon-blue border border-neon-blue/30 font-semibold">
                    {lead.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted">
                Nenhum lead registrado até o momento.
              </div>
            )}
          </div>
        </div>

        {/* Negócios no Pipeline */}
        <div className="card-neon p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm neon-title-pink">
                Oportunidades em Negociação
              </h3>
              <p className="text-xs text-muted">Forecast com probabilidade de conversão</p>
            </div>
            <Briefcase className="w-4 h-4 text-neon-blue" />
          </div>

          <div className="space-y-3">
            {metrics?.recentDeals?.length > 0 ? (
              metrics.recentDeals.map((deal: any) => (
                <div key={deal.id} className="p-3 bg-surface2 rounded-control border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-neon-pink block">
                      {deal.title}
                    </span>
                    <span className="text-[11px] text-muted">
                      {deal.company?.name || 'Cliente'} • Probabilidade: <strong className="text-neon-success">{deal.probability}%</strong>
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-neon-gold">
                    {formatCurrency(deal.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted">
                Nenhuma oportunidade cadastrada no funil.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
