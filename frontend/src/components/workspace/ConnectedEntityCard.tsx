import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Bot,
  Activity,
  CheckCircle2,
  Calendar,
  Sparkles,
  Scale,
  Zap,
  ArrowUpRight,
  Clock
} from 'lucide-react';

export interface ConnectedEntityCardProps {
  id: string;
  category: string;
  title: string;
  badge?: string;
  badgeColor?: 'lime' | 'graphite' | 'danger' | 'blue';
  metricValue?: string;
  metricLabel?: string;
  delta?: string;
  chartType?: 'wave' | 'sparkline' | 'bars' | 'status' | 'ecg';
  chartData?: number[];
  tags?: string[];
  agentName?: string;
  timestamp?: string;
  onClick?: () => void;
  className?: string;
}

export const ConnectedEntityCard: React.FC<ConnectedEntityCardProps> = ({
  category,
  title,
  badge,
  badgeColor = 'lime',
  metricValue,
  metricLabel,
  delta,
  chartType = 'wave',
  tags = [],
  agentName,
  timestamp,
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-workspace-card rounded-canvas p-5 border border-workspace-soft shadow-sm hover:shadow-md transition-all duration-300 relative group cursor-pointer ${className}`}
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-soft)',
        borderRadius: '24px'
      }}
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-workspace-secondary font-medium block">
            {category}
          </span>
          <h3 className="font-display text-base font-bold neon-title-cyan mt-0.5 leading-tight transition-colors">
            {title}
          </h3>
        </div>

        {/* Top-right Icon Badge */}
        <div className="w-8 h-8 rounded-full bg-workspace-surface flex items-center justify-center border border-workspace-soft text-workspace-secondary group-hover:border-workspace-graphite group-hover:text-workspace-graphite transition-colors">
          <Scale className="w-4 h-4" />
        </div>
      </div>

      {/* Conteúdo Central Gráfico ou Métrico */}
      {chartType === 'wave' && (
        <div className="my-3 py-2 px-1 relative">
          <svg
            viewBox="0 0 240 60"
            className="w-full h-14 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`grad-lime-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E5FF45" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#E5FF45" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id={`grad-grey-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#747972" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#747972" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Gray baseline wave */}
            <path
              d="M 0,42 Q 40,30 80,45 T 160,35 T 240,40 L 240,60 L 0,60 Z"
              fill={`url(#grad-grey-${title.replace(/\s+/g, '')})`}
            />
            <path
              d="M 0,42 Q 40,30 80,45 T 160,35 T 240,40"
              fill="none"
              stroke="#B4BAB0"
              strokeWidth="2"
            />

            {/* Neon lime active peak wave */}
            <path
              d="M 60,40 Q 110,10 160,18 Q 190,26 240,35 L 240,60 L 60,60 Z"
              fill={`url(#grad-lime-${title.replace(/\s+/g, '')})`}
            />
            <path
              d="M 60,40 Q 110,10 160,18 Q 190,26 240,35"
              fill="none"
              stroke="#A8D600"
              strokeWidth="2.5"
            />

            {/* Peak node indicator */}
            <circle cx="160" cy="18" r="4" fill="#343735" />
            <circle cx="160" cy="18" r="2.5" fill="#E5FF45" />
          </svg>

          {/* Central pill value overlay like in the reference */}
          {badge && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-workspace-graphite text-white text-[11px] font-mono font-bold px-3 py-1 rounded-pill shadow-md border border-black/20 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-workspace-lime animate-pulse"></span>
              <span>{badge}</span>
            </div>
          )}
        </div>
      )}

      {chartType === 'ecg' && (
        <div className="my-3 py-2 px-1 relative">
          <svg
            viewBox="0 0 240 50"
            className="w-full h-12 overflow-visible"
            preserveAspectRatio="none"
          >
            <path
              d="M 0,25 L 50,25 L 60,10 L 70,40 L 80,5 L 90,30 L 100,25 L 140,25 L 150,8 L 160,42 L 170,12 L 180,25 L 240,25"
              fill="none"
              stroke="#343735"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Red alert peak */}
            <circle cx="160" cy="42" r="3" fill="#EF4444" />
          </svg>
        </div>
      )}

      {/* Footer com Métricas e Variação */}
      <div className="mt-3 pt-3 border-t border-workspace-soft flex items-center justify-between text-xs">
        <div>
          {metricLabel && (
            <span className="text-[10px] uppercase font-mono text-workspace-secondary block">
              {metricLabel}
            </span>
          )}
          {metricValue && (
            <span className="font-display font-black text-sm text-workspace-primary">
              {metricValue}
            </span>
          )}
        </div>

        {delta && (
          <div className="flex items-center space-x-1 font-mono font-bold text-xs px-2 py-0.5 rounded-pill bg-[#E5FF45]/20 text-[#343735] border border-[#E5FF45]/40">
            <span>{delta}</span>
            <ArrowUpRight className="w-3 h-3 text-[#343735]" />
          </div>
        )}

        {agentName && (
          <div className="flex items-center space-x-1 text-[11px] font-mono text-workspace-secondary">
            <Bot className="w-3.5 h-3.5 text-workspace-graphite" />
            <span>{agentName}</span>
          </div>
        )}
      </div>

      {/* Tags contextuais */}
      {tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-pill bg-workspace-surface text-[10px] font-mono text-workspace-secondary border border-workspace-soft"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
