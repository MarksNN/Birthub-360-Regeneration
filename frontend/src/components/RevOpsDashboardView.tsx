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
  Percent,
  CheckCircle2,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface RevOpsDashboardViewProps {
  metrics: any;
  loading: boolean;
}

export const RevOpsDashboardView: React.FC<RevOpsDashboardViewProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-surface rounded-card border border-border"></div>
          ))}
        </div>
      </div>
    );
  }

  const { summary, stageDistribution, repDistribution, activitiesSummary, overdueActivitiesList } = metrics;

  const formatCurrency = (val: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
  };

  const renderSparkline = (points: number[], color: string, fillColor: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 110;
    const height = 32;
    
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    const fillCoords = `0,${height} ${coords} ${width},${height}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`rev-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={fillCoords} fill={`url(#rev-grad-${color})`} />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  const pipelinePoints = [42, 51, 48, 65, 70, 68, 85, 92];
  const forecastPoints = [35, 42, 50, 58, 64, 72, 78, 86];
  const wonPoints = [15, 22, 30, 38, 45, 52, 60, 74];
  const winRatePoints = [18, 20, 24, 22, 28, 31, 29, 34];

  const kpis = [
    {
      label: 'Pipeline Ativo (Aberto)',
      value: formatCurrency(summary.totalPipelineAmount),
      subtext: `${summary.openDealsCount} negócios em curso`,
      icon: TrendingUp,
      color: 'text-neon-blue',
      badgeBg: 'bg-sky-500/10 border-sky-500/20',
      sparkline: renderSparkline(pipelinePoints, '#0284C7', '#0284C7')
    },
    {
      label: 'Receita Prevista Ponderada',
      value: formatCurrency(summary.weightedForecast),
      subtext: 'Ponderação matemática por estágio',
      icon: Target,
      color: 'text-neon-gold',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
      sparkline: renderSparkline(forecastPoints, '#D97706', '#D97706')
    },
    {
      label: 'Receita Fechada (Won ARR)',
      value: formatCurrency(summary.totalWonAmount),
      subtext: `${summary.wonDealsCount} contratos fechados`,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
      sparkline: renderSparkline(wonPoints, '#16A34A', '#16A34A')
    },
    {
      label: 'Taxa de Conversão (Win Rate)',
      value: `${summary.winRate}%`,
      subtext: `Ticket Médio: ${formatCurrency(summary.averageTicket)}`,
      icon: Percent,
      color: 'text-neon-pink',
      badgeBg: 'bg-rose-500/10 border-rose-500/20',
      sparkline: renderSparkline(winRatePoints, '#D91B7C', '#D91B7C')
    }
  ];

  return (
    <div className="space-y-6" data-testid="revops-dashboard-view">
      {/* HEADER EXECUTIVO DE REVOPS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
              <Zap className="w-3 h-3" />
              REVOPS INTELLIGENCE
            </span>
            <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" />
              GOVERNANÇA SUB-SEGUNDO
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Cockpit de Performance Comercial & RevOps
          </h1>
          <p className="text-xs text-muted">
            Métricas de tração comercial, velocidade de pipeline, produtividade dos executivos e mitigação de risco de perdas.
          </p>
        </div>
      </div>

      {/* 4 INDICADORES PRINCIPAIS DE REVOPS COM SPARKLINE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card-neon p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase font-mono font-semibold text-muted">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-control border ${kpi.badgeBg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="my-1">
                <span className="font-display text-2xl font-bold text-ink tracking-tight font-mono">
                  {kpi.value}
                </span>
                <span className="block text-xs text-muted mt-1 font-mono">
                  {kpi.subtext}
                </span>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-[10px] text-muted font-mono">Tendência MTD</span>
                {kpi.sparkline}
              </div>
            </div>
          );
        })}
      </div>

      {/* GRID DE DISTRIBUIÇÃO DO FUNIL & PERFORMANCE POR RESPONSÁVEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DISTRIBUIÇÃO E CONVERSÃO POR ETAPA (COL-SPAN-7) */}
        <div className="lg:col-span-7 card-neon p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-neon-blue" />
                  Distribuição & Retenção de Receita por Estágio
                </h3>
                <p className="text-xs text-muted">Volume financeiro acumulado em cada fase do funil</p>
              </div>
            </div>

            <div className="space-y-3">
              {stageDistribution && stageDistribution.map((st: any) => (
                <div key={st.stage} className="p-3 bg-surface2 rounded-control border border-border/80 flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center justify-between text-xs mb-1 font-mono">
                      <span className="font-semibold text-ink">{st.stage.replace('_', ' ')}</span>
                      <span className="text-muted">{st.count} negócios ({st.percentageOfTotalCount}%)</span>
                    </div>
                    <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border/40">
                      <div
                        className="bg-neon-blue h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(st.percentageOfTotalCount, 3)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs font-bold text-ink min-w-24">
                    {formatCurrency(st.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted font-mono">
            <span>Conversão Total do Funil: {summary.winRate}%</span>
            <span className="text-neon-blue font-semibold">Ticket Médio: {formatCurrency(summary.averageTicket)}</span>
          </div>
        </div>

        {/* PERFORMANCE POR RESPONSÁVEL COMERCIAL (COL-SPAN-5) */}
        <div className="lg:col-span-5 card-neon p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                  <Users className="w-4 h-4 text-neon-gold" />
                  Produtividade por Closer / SDR
                </h3>
                <p className="text-xs text-muted">Volume de pipeline e negócios faturados</p>
              </div>
            </div>

            <div className="space-y-3">
              {repDistribution && repDistribution.length > 0 ? (
                repDistribution.map((rep: any) => (
                  <div key={rep.userId} className="p-3 bg-surface2 rounded-control border border-border/80 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-ink block">
                        {rep.name}
                      </span>
                      <span className="text-[11px] text-muted font-mono">
                        {rep.role} • {rep.dealsCount} deals ({rep.wonDealsCount} ganhos)
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-ink block">
                        {formatCurrency(rep.pipelineAmount)}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                        Ponderado: {formatCurrency(rep.weightedAmount)}
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

          <div className="pt-3 border-t border-border text-center">
            <span className="text-xs text-muted font-mono">
              Governança de capacidade e metas integradas ao Supervisor
            </span>
          </div>
        </div>
      </div>

      {/* ALERTAS DE GARGALO & ATIVIDADES ATRASADAS */}
      <div className="card-neon p-6 border-l-4 border-l-rose-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="font-display font-bold text-sm text-ink">
              Gargalos de Cadência & Atividades Vencidas ({activitiesSummary?.overdue || 0})
            </h3>
          </div>
          <span className="badge-telemetry bg-surface2 text-muted border border-border">
            {activitiesSummary?.pending || 0} pendências totais
          </span>
        </div>

        <p className="text-xs text-muted mb-4">
          Oportunidades em aberto com tarefas de follow-up vencidas podem esfriar no pipeline e reduzir a taxa de conversão.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overdueActivitiesList && overdueActivitiesList.length > 0 ? (
            overdueActivitiesList.map((act: any) => (
              <div key={act.id} className="p-3 bg-surface2 rounded-control border border-rose-500/20 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-semibold text-ink block">{act.title}</span>
                  <span className="text-[11px] text-muted">
                    Vencido em: <strong className="text-rose-600 dark:text-rose-400 font-bold">{new Date(act.dueDate).toLocaleDateString('pt-BR')}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-pill bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                  {act.type}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Nenhuma atividade em atraso. Cadências comerciais 100% em dia.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
