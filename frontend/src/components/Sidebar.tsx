import React, { useState } from 'react';
import {
  Compass,
  BrainCircuit,
  Workflow,
  Activity,
  TrendingUp,
  Bot,
  Zap,
  GitFork,
  ChevronDown,
  ChevronRight,
  Lock,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { EIGHT_PILLARS, PillarDefinition, SubmoduleDefinition, hasRolePermission } from '../navigation/pillars';

interface SidebarProps {
  activePillarId: string;
  activeSubmodule: SubmoduleDefinition;
  userRole: string;
  onNavigate: (pillar: PillarDefinition, submodule: SubmoduleDefinition) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const PILLAR_ICONS: Record<string, React.FC<{ className?: string }>> = {
  hub: Compass,
  intelligence: BrainCircuit,
  sales: Workflow,
  realtime: Activity,
  forecast: TrendingUp,
  copilot: Bot,
  automations: Zap,
  cadence: GitFork
};

export const Sidebar: React.FC<SidebarProps> = ({
  activePillarId,
  activeSubmodule,
  userRole,
  onNavigate,
  mobileOpen = false,
  onCloseMobile
}) => {
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const p of EIGHT_PILLARS) {
      initial[p.id] = true;
    }
    return initial;
  });

  const toggleExpandPillar = (pillarId: string) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  const handleSelectPillarHeader = (pillar: PillarDefinition) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [pillar.id]: true
    }));
    if (pillar.submodules.length > 0) {
      onNavigate(pillar, pillar.submodules[0]);
    }
  };

  const sidebarContent = (
    <aside
      data-testid="sidebar-nav"
      className="w-72 bg-surface border-r border-border flex flex-col h-screen select-none transition-colors"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-sky-500/15 text-neon-blue border border-sky-500/30 flex items-center justify-center font-display font-bold text-xs shadow-xs">
            <span>360°</span>
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-tight text-ink">
              BIRTHUB 360°
            </span>
            <span className="block text-[10px] uppercase font-mono tracking-wider text-muted">
              Revenue Intelligence OS
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 rounded-control text-muted hover:text-ink hover:bg-surface2"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navegação Oficial dos Oito Pilares */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        <div className="px-2 pb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
            Pilares do Ecossistema
          </span>
          <span className="badge-telemetry bg-surface2 text-ink border border-border text-[10px]">
            {userRole}
          </span>
        </div>

        {EIGHT_PILLARS.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.id] || Compass;
          const isPillarActive = activePillarId === pillar.id;
          const isExpanded = expandedPillars[pillar.id] ?? true;

          return (
            <div
              key={pillar.id}
              data-testid={`pillar-group-${pillar.id}`}
              className={`rounded-card border transition-all ${
                isPillarActive
                  ? 'border-neon-blue/30 bg-surface2/60 shadow-xs'
                  : 'border-transparent hover:border-border/60'
              }`}
            >
              {/* Cabeçalho do Pilar */}
              <div className="flex items-center justify-between px-2.5 py-2">
                <button
                  type="button"
                  data-testid={`pillar-btn-${pillar.id}`}
                  onClick={() => handleSelectPillarHeader(pillar)}
                  className="flex items-center space-x-2.5 flex-1 text-left group"
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isPillarActive ? 'text-neon-blue' : pillar.colorClass}`} />
                  <div className="min-w-0 flex-1">
                    <span
                      className={`block font-display text-xs font-bold truncate ${
                        isPillarActive ? 'text-neon-blue' : 'text-ink'
                      }`}
                    >
                      {pillar.label}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  data-testid={`pillar-toggle-${pillar.id}`}
                  aria-label={`Alternar submódulos de ${pillar.label}`}
                  onClick={() => toggleExpandPillar(pillar.id)}
                  className="p-1 rounded text-muted hover:text-ink hover:bg-surface"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Lista de Submódulos do Pilar */}
              {isExpanded && (
                <div className="px-2 pb-2 space-y-1 border-t border-border/40 pt-1.5">
                  {pillar.submodules.map((sub) => {
                    const isSubActive = activeSubmodule.id === sub.id;
                    const permitted = hasRolePermission(userRole, sub.minRole);

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        data-testid={`submodule-btn-${sub.id}`}
                        onClick={() => {
                          onNavigate(pillar, sub);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-control text-xs font-medium transition-all ${
                          isSubActive
                            ? 'bg-surface text-neon-blue border border-neon-blue/40 font-semibold shadow-xs'
                            : 'text-muted hover:bg-surface/60 hover:text-ink'
                        }`}
                      >
                        <span className="truncate text-left">{sub.label}</span>

                        <div className="flex items-center space-x-1 shrink-0 ml-2">
                          {!permitted ? (
                            <span
                              title={`Requer perfil ${sub.minRole}`}
                              className="text-rose-600 dark:text-rose-400 flex items-center"
                            >
                              <Lock className="w-3 h-3" />
                            </span>
                          ) : sub.isImplemented ? (
                            <CheckCircle2
                              className={`w-3 h-3 ${
                                isSubActive ? 'text-neon-blue' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            />
                          ) : (
                            <span
                              title={`Planejado para ${sub.plannedPhase || 'Próxima Fase'}`}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface2 text-neon-gold border border-amber-500/30 flex items-center space-x-0.5"
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>{sub.plannedPhase || 'Futuro'}</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border bg-surface2/50 text-[11px] font-mono text-muted flex justify-between items-center">
        <span>Birthub 360° • 8 Pilares</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
