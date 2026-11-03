import React, { useState } from 'react';
import { 
  Building2, 
  Flame, 
  TrendingUp, 
  DollarSign, 
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Activity,
  Sparkles,
  Clock,
  ChevronRight,
  Target,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Filter,
  BarChart3,
  Users
} from 'lucide-react';

interface DashboardViewProps {
  metrics: any;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ metrics, loading }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7D' | '30D' | 'QTD' | 'YTD'>('30D');

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-10 bg-surface rounded-card w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-36 bg-surface rounded-card border border-border"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-surface rounded-card border border-border"></div>
          <div className="lg:col-span-4 h-80 bg-surface rounded-card border border-border"></div>
        </div>
      </div>
    );
  }

  const summary = metrics?.summary || {
    totalCompanies: 0,
    totalContacts: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalPipelineAmount: 0,
    totalWonAmount: 0,
    totalLostAmount: 0,
    weightedForecast: 0,
    averageTicket: 0,
    winRate: 0
  };

  const stageDistribution = metrics?.stageDistribution || [];
  const repDistribution = metrics?.repDistribution || [];
  const activitiesMetrics = metrics?.activitiesMetrics || {
    totalActivities: 0,
    pendingActivities: 0,
    completedActivities: 0,
    overdueActivities: 0
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Sparklines SVG gerados matematicamente para estética de alta tecnologia
  const renderSparkline = (points: number[], color: string, fillColor: string) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    const fillCoords = `0,${height} ${coords} ${width},${height}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={fillCoords} fill={`url(#grad-${color})`} />
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

  const pipelinePoints = [32, 45, 41, 58, 62, 59, 74, 82];
  const wonPoints = [12, 19, 24, 30, 28, 42, 51, 65];
  const forecastPoints = [40, 48, 55, 60, 68, 71, 79, 88];
  const activityPoints = [22, 28, 35, 30, 45, 52, 48, 60];

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE COMANDO DO COCKPIT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse"></span>
              REVENUE INTELLIGENCE COCKPIT
            </span>
            <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" />
              RBAC & ORG ISOLATED
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Visão Geral de Receita & Orquestração Comercial
          </h1>
          <p className="text-xs text-muted">
            Telemetria sub-segundo do pipeline, probabilidade preditiva e cadência de fechamento.
          </p>
        </div>

        {/* Seletor Temporal Executivo */}
        <div className="flex items-center gap-2">
          <div className="bg-surface2 p-1 rounded-control border border-border flex items-center text-xs font-mono">
            {(['7D', '30D', 'QTD', 'YTD'] as const).map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1 rounded-control transition-all ${
                  selectedPeriod === p 
                    ? 'bg-surface text-ink font-bold shadow-sm' 
                    : 'text-muted hover:text-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TOP BENTO ROW — 4 KPIS COM MICRO-SPARKLINES SVG */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pipeline Aberto */}
        <div className="card-neon p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-muted">
              Pipeline Aberto
            </span>
            <div className="p-2 bg-sky-500/10 text-neon-blue rounded-control border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl font-display font-bold text-ink tracking-tight font-mono">
              {formatCurrency(summary.totalPipelineAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.8%
              </span>
              <span className="text-muted text-[11px]">vs mês anterior</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-border/60">
            <span className="text-[11px] text-muted font-mono">
              {summary.totalDeals} oportunidades ativas
            </span>
            {renderSparkline(pipelinePoints, '#0284C7', '#0284C7')}
          </div>
        </div>

        {/* KPI 2: Receita Fechada */}
        <div className="card-neon p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-muted">
              Receita Fechada (Won)
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-control border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl font-display font-bold text-ink tracking-tight font-mono">
              {formatCurrency(summary.totalWonAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.4%
              </span>
              <span className="text-muted text-[11px]">Win Rate: {summary.winRate.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-border/60">
            <span className="text-[11px] text-muted font-mono">
              Ticket Médio: {formatCurrency(summary.averageTicket)}
            </span>
            {renderSparkline(wonPoints, '#16A34A', '#16A34A')}
          </div>
        </div>

        {/* KPI 3: Weighted Forecast */}
        <div className="card-neon p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-muted">
              Forecast Ponderado
            </span>
            <div className="p-2 bg-amber-500/10 text-neon-gold rounded-control border border-amber-500/20">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl font-display font-bold text-ink tracking-tight font-mono">
              {formatCurrency(summary.weightedForecast)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="text-neon-gold font-semibold font-mono flex items-center">
                <Zap className="w-3.5 h-3.5" /> Probabilístico
              </span>
              <span className="text-muted text-[11px]">Previsibilidade sub-segundo</span>
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-border/60">
            <span className="text-[11px] text-muted font-mono">
              Ponderação 5 Estágios
            </span>
            {renderSparkline(forecastPoints, '#D97706', '#D97706')}
          </div>
        </div>

        {/* KPI 4: Cadência de Atividades */}
        <div className="card-neon p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-muted">
              Cadência de Execução
            </span>
            <div className="p-2 bg-purple-500/10 text-neon-iris rounded-control border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl font-display font-bold text-ink tracking-tight font-mono">
              {activitiesMetrics.completedActivities} / {activitiesMetrics.totalActivities}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {activitiesMetrics.overdueActivities > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {activitiesMetrics.overdueActivities} atrasadas
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 100% em dia
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t border-border/60">
            <span className="text-[11px] text-muted font-mono">
              {summary.totalLeads} leads em cadência
            </span>
            {renderSparkline(activityPoints, '#7C3AED', '#7C3AED')}
          </div>
        </div>
      </div>

      {/* MIDDLE BENTO ROW (12 COLUNAS): FUNIL PONDERADO + PERFORMANCE DE CLOSERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FUNIL DE 5 ESTÁGIOS DO SUPERVISOR (COL-SPAN-8) */}
        <div className="lg:col-span-8 card-neon p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-neon-blue" />
                  Distribuição & Velocidade do Funil Comercial
                </h3>
                <p className="text-xs text-muted">
                  Visão em cascata ponderada pelos 5 estágios normativos do Supervisor Núcleo.
                </p>
              </div>
              <span className="badge-telemetry bg-surface2 text-muted border border-border">
                {summary.totalDeals} NEGÓCIOS
              </span>
            </div>

            {/* BARRAS DE ESTÁGIOS */}
            <div className="space-y-3 my-4">
              {stageDistribution.map((st: any) => {
                const isWon = st.stage === 'FECHADO_GANHO';
                const isLost = st.stage === 'FECHADO_PERDIDO';
                const barColor = isWon 
                  ? 'bg-emerald-500' 
                  : isLost 
                  ? 'bg-rose-500/70' 
                  : 'bg-neon-blue';

                return (
                  <div key={st.stage} className="p-2.5 bg-surface2 rounded-control border border-border/70 hover:border-border transition-all">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                      <span className="font-semibold text-ink flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${barColor}`}></span>
                        {st.stage.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted">{st.count} negócios ({st.percentageOfTotalCount}%)</span>
                        <span className="font-bold text-ink">{formatCurrency(st.amount)}</span>
                      </div>
                    </div>
                    {/* Barra de Progresso de Alta Densidade */}
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/40">
                      <div 
                        className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(st.percentageOfTotalCount, 3)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted font-mono">
            <span>Supervisor SLA de Estágio: Máx 48h sem interação</span>
            <span className="text-neon-blue font-semibold">Taxa de Conversão Funil: {summary.winRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* PERFORMANCE DOS EXECUTIVOS & CLOSERS (COL-SPAN-4) */}
        <div className="lg:col-span-4 card-neon p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                  <Users className="w-4 h-4 text-neon-pink" />
                  Alocação de Squad RevOps
                </h3>
                <p className="text-xs text-muted">Gestão de carteira por Closer/SDR</p>
              </div>
            </div>

            <div className="space-y-3">
              {repDistribution.length > 0 ? (
                repDistribution.slice(0, 5).map((rep: any) => (
                  <div key={rep.userId} className="p-3 bg-surface2 rounded-control border border-border/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500/10 text-neon-blue font-mono font-bold text-xs flex items-center justify-center border border-sky-500/30">
                        {rep.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-ink">{rep.name}</div>
                        <div className="text-[11px] text-muted font-mono">
                          {rep.role} • {rep.openDealsCount} abertos / {rep.wonDealsCount} ganhos
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-ink">{formatCurrency(rep.pipelineAmount)}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Ganhos: {formatCurrency(rep.wonAmount)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-muted">
                  Nenhum responsável comercial alocado ainda.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border text-center">
            <span className="text-xs text-muted font-mono">
              Capacidade de atendimento balanceada pelo Supervisor
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM BENTO ROW (12 COLUNAS): NEGÓCIOS EM ANDAMENTO & LEADS ICP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEGÓCIOS NO PIPELINE */}
        <div className="card-neon p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-neon-blue" />
                Negócios Críticos em Negociação Ativa
              </h3>
              <p className="text-xs text-muted">Oportunidades com maior peso no fechamento</p>
            </div>
            <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
              RADAR
            </span>
          </div>

          <div className="space-y-2.5">
            {metrics?.recentDeals?.length > 0 ? (
              metrics.recentDeals.map((deal: any) => (
                <div key={deal.id} className="p-3 bg-surface2 rounded-control border border-border/80 flex items-center justify-between hover:border-sky-500/40 transition-all">
                  <div className="min-w-0 pr-3">
                    <span className="font-semibold text-xs text-ink truncate block">
                      {deal.title}
                    </span>
                    <span className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5 font-mono">
                      <span>{deal.company?.name || 'Cliente Direto'}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{deal.probability}% prob.</span>
                    </span>
                  </div>
                  <div className="text-right font-mono flex-shrink-0">
                    <span className="font-bold text-xs text-ink block">
                      {formatCurrency(deal.amount)}
                    </span>
                    <span className="text-[10px] uppercase text-muted">
                      {deal.stage.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted">
                Nenhum negócio ativo cadastrado no radar.
              </div>
            )}
          </div>
        </div>

        {/* LEADS & ICP SCORING */}
        <div className="card-neon p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-2">
                <Flame className="w-4 h-4 text-neon-pink" />
                Leads em Prospecção & Qualificação ICP
              </h3>
              <p className="text-xs text-muted">Pontuação preditiva calculada por IA</p>
            </div>
            <span className="badge-telemetry bg-rose-500/10 text-neon-pink border border-rose-500/30">
              CADÊNCIA
            </span>
          </div>

          <div className="space-y-2.5">
            {metrics?.recentLeads?.length > 0 ? (
              metrics.recentLeads.map((lead: any) => (
                <div key={lead.id} className="p-3 bg-surface2 rounded-control border border-border/80 flex items-center justify-between hover:border-rose-500/40 transition-all">
                  <div className="min-w-0 pr-3">
                    <span className="font-semibold text-xs text-ink truncate block">
                      {lead.title}
                    </span>
                    <span className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                      <span>{lead.company?.name || 'Sem empresa vinculada'}</span>
                      <span>•</span>
                      <span className="text-xs font-mono font-bold text-neon-gold">
                        ICP: {lead.score}/100
                      </span>
                    </span>
                  </div>
                  <span className="badge-telemetry bg-surface text-ink border border-border flex-shrink-0">
                    {lead.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted">
                Nenhum lead registrado no pipeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
