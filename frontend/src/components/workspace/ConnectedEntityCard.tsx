import React from 'react';
import {
  Bot,
  Scale,
  ArrowUpRight
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
  metricValue,
  metricLabel,
  delta,
  chartType = 'wave',
  tags = [],
  agentName,
  onClick,
  className = ''
}) => {
  const safeId = title.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      onClick={onClick}
      className={`card-neon p-5 border border-border hover:border-neon-blue/40 transition-all duration-200 relative group cursor-pointer ${className}`}
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold block">
            {category}
          </span>
          <h3 className="font-display text-sm font-bold neon-title-blue mt-0.5 leading-tight transition-colors">
            {title}
          </h3>
        </div>

        {/* Top-right Icon Badge */}
        <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center border border-border text-muted group-hover:border-neon-blue/40 group-hover:text-neon-blue transition-colors">
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
              <linearGradient id={`grad-blue-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--neon-blue)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id={`grad-iris-${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--neon-iris)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--neon-iris)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Baseline wave */}
            <path
              d="M 0,42 Q 40,30 80,45 T 160,35 T 240,40 L 240,60 L 0,60 Z"
              fill={`url(#grad-iris-${safeId})`}
            />
            <path
              d="M 0,42 Q 40,30 80,45 T 160,35 T 240,40"
              fill="none"
              stroke="var(--neon-iris)"
              strokeOpacity="0.45"
              strokeWidth="1.75"
            />

            {/* Neon Blue active peak wave */}
            <path
              d="M 60,40 Q 110,10 160,18 Q 190,26 240,35 L 240,60 L 60,60 Z"
              fill={`url(#grad-blue-${safeId})`}
            />
            <path
              d="M 60,40 Q 110,10 160,18 Q 190,26 240,35"
              fill="none"
              stroke="var(--neon-blue)"
              strokeWidth="2.25"
            />

            {/* Peak node indicator */}
            <circle cx="160" cy="18" r="4" fill="var(--bg-surface)" stroke="var(--neon-blue)" strokeWidth="2" />
          </svg>

          {/* Central pill value overlay */}
          {badge && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0B132B] text-[#F8FAFC] text-[11px] font-mono font-bold px-3 py-1 rounded-pill shadow-md border border-neon-blue/40 flex items-center space-x-1.5 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
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
              stroke="var(--neon-pink)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="160" cy="42" r="3.5" fill="var(--neon-gold)" />
          </svg>
        </div>
      )}

      {/* Footer com Métricas e Variação */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
        <div>
          {metricLabel && (
            <span className="text-[10px] uppercase font-mono text-muted block">
              {metricLabel}
            </span>
          )}
          {metricValue && (
            <span className="font-mono font-bold text-xs text-ink tabular-nums">
              {metricValue}
            </span>
          )}
        </div>

        {delta && (
          <div className="flex items-center space-x-1 font-mono font-bold text-[11px] px-2 py-0.5 rounded-pill bg-neon-blue/10 text-neon-blue border border-neon-blue/30">
            <span>{delta}</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        )}

        {agentName && (
          <div className="flex items-center space-x-1 text-[11px] font-mono text-neon-iris font-semibold">
            <Bot className="w-3.5 h-3.5 text-neon-iris" />
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
              className="px-2 py-0.5 rounded-pill bg-surface2 text-[10px] font-mono text-muted border border-border"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
