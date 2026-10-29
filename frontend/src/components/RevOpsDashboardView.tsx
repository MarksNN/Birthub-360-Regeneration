import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3, 
  Users, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Percent
} from 'lucide-react';

interface RevOpsDashboardViewProps {
  metrics: any;
  loading: boolean;
}

export const RevOpsDashboardView: React.FC<RevOpsDashboardViewProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="h-32 bg-surface rounded-card border border-border"></div>
        ))}
      </div>
    );
  }

  const { summary, stageDistribution, repDistribution, activitiesSummary, overdueActivitiesList } = metrics;

  const formatCurrency = (val: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
  };

  const kpis = [
    {
      label: 'Pipeline Ativo (Aberto)',
      value: formatCurrency(summary.totalPipelineAmount),
      subtext: `${summary.openDealsCount} negócios em negociação`,
      icon: TrendingUp,
      color: 'text-neon-blue',
      titleClass: 'neon-title-cyan'
    },
    {
      label: 'Receita Prevista Ponderada',
      value: formatCurrency(summary.weightedForecast),
      subtext: 'Valor ajustado por probabilidade',
      icon: Target,
      color: 'text-neon-gold',
      titleClass: 'neon-title-gold'
    },
    {
      label: 'Receita Fechada (Ganha)',
      value: formatCurrency(summary.totalWonAmount),
      subtext: `${summary.wonDealsCount} contratos faturados`,
      icon: DollarSign,
      color: 'text-neon-success',
      titleClass: 'neon-title-cyan'
    },
    {
      label: 'Taxa de Conversão (Win Rate)',
      value: `${summary.winRate}%`,
      subtext: `Ticket Médio: ${formatCurrency(summary.averageTicket)}`,
      icon: Percent,
      color: 'text-neon-pink',
      titleClass: 'neon-title-pink'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4 Indicadores Principais de RevOps */}
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

      {/* Grid: Conversão por Etapa do Funil & Distribuição por Responsável */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Etapas do Funil */}
        <div className="card-neon p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm neon-title-cyan">
                Distribuição e Conversão por Etapa
              </h3>
              <p className="text-xs text-muted">Volume e percentual de receita retida por fase do pipeline</p>
            </div>
            <BarChart3 className="w-4 h-4 text-neon-blue" />
          </div>

          <div className="space-y-3">
            {stageDistribution && stageDistribution.map((st: any) => (
              <div key={st.stage} className="p-3 bg-surface2 rounded-control border border-border flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-ink">{st.stage.replace('_', ' ')}</span>
                    <span className="font-mono text-muted">{st.count} negócios ({st.percentageOfTotalCount}%)</span>
                  </div>
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="bg-gradient-to-r from-neon-blue to-neon-gold h-full"
                      style={{ width: `${Math.min(st.percentageOfTotalCount * 2, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs font-bold text-neon-gold min-w-24">
                  {formatCurrency(st.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Responsável Comercial */}
        <div className="card-neon p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm neon-title-gold">
                Performance por Responsável Comercial
              </h3>
              <p className="text-xs text-muted">Pipeline ativo, negócios fechados e receita ponderada por AE</p>
            </div>
            <Users className="w-4 h-4 text-neon-gold" />
          </div>

          <div className="space-y-3">
            {repDistribution && repDistribution.length > 0 ? (
              repDistribution.map((rep: any) => (
                <div key={rep.userId} className="p-3 bg-surface2 rounded-control border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-neon-blue block">
                      {rep.name}
                    </span>
                    <span className="text-[11px] text-muted font-mono">
                      {rep.role} • {rep.dealsCount} negócios ({rep.wonDealsCount} ganhos)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-ink block">
                      {formatCurrency(rep.pipelineAmount)}
                    </span>
                    <span className="text-[10px] font-mono text-neon-success block">
                      Forecast Ponderado: {formatCurrency(rep.weightedAmount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted">
                Nenhum responsável comercial com oportunidades atribuídas.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertas e Atividades Comerciais Atrasadas */}
      <div className="card-neon p-5 border-l-4 border-l-neon-danger">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-neon-danger" />
            <h3 className="font-display font-bold text-sm text-neon-danger">
              Gargalos de Cadência & Atividades Atrasadas ({activitiesSummary?.overdue || 0})
            </h3>
          </div>
          <span className="text-xs font-mono text-muted">
            {activitiesSummary?.pending || 0} pendências totais
          </span>
        </div>

        <p className="text-xs text-muted mb-4">
          Oportunidades em aberto com tarefas de follow-up vencidas podem esfriar no pipeline e reduzir a taxa de conversão.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overdueActivitiesList && overdueActivitiesList.length > 0 ? (
            overdueActivitiesList.map((act: any) => (
              <div key={act.id} className="p-3 bg-surface2 rounded-control border border-neon-danger/20 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-ink block">{act.title}</span>
                  <span className="text-[11px] text-muted">
                    Vencido em: <strong className="text-neon-danger font-mono">{new Date(act.dueDate).toLocaleDateString('pt-BR')}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-pill bg-neon-danger/10 text-neon-danger font-mono text-[10px] font-bold">
                  {act.type}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-4 text-xs text-neon-success font-medium">
              Nenhuma atividade em atraso no momento. O pipeline comercial está com as cadências em dia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
