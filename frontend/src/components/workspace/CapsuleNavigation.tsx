import React from 'react';
import {
  Sparkles,
  Search,
  Sun,
  Moon,
  Menu,
  Shield,
  Layers,
  Bot,
  TrendingUp,
  Workflow,
  Building2,
  Zap,
  Activity,
  Flame,
  Globe
} from 'lucide-react';
import { PillarDefinition, SubmoduleDefinition } from '../../navigation/pillars';

interface CapsuleNavigationProps {
  activePillar: PillarDefinition;
  activeSubmodule: SubmoduleDefinition;
  onNavigate: (pillar: PillarDefinition, submodule: SubmoduleDefinition) => void;
  pillars: PillarDefinition[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMobileMenu?: () => void;
  onOpenSupervisor?: () => void;
  onOpenSearch?: () => void;
}

export const CapsuleNavigation: React.FC<CapsuleNavigationProps> = ({
  activePillar,
  activeSubmodule,
  onNavigate,
  pillars,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  onOpenSupervisor,
  onOpenSearch
}) => {
  // Mapeamento dos 9 módulos estratégicos em cápsulas elegantes
  const primaryCapsules = [
    { label: 'Visão 360°', pillarId: 'hub', submoduleId: 'overview', icon: Sparkles },
    { label: 'CRM', pillarId: 'hub', submoduleId: 'companies', icon: Building2 },
    { label: 'Prospecção', pillarId: 'intelligence', submoduleId: 'leads', icon: Flame },
    { label: 'Pipeline', pillarId: 'sales', submoduleId: 'pipeline', icon: Workflow },
    { label: 'Automações', pillarId: 'automations', submoduleId: 'integration_hub', icon: Zap },
    { label: 'Supervisor', pillarId: 'copilot', submoduleId: 'commercial_matrix_v31', icon: Bot },
    { label: 'Agentes', pillarId: 'copilot', submoduleId: 'agents_catalog', icon: Bot },
    { label: 'Integrações', pillarId: 'automations', submoduleId: 'integration_hub', icon: Globe },
    { label: 'Inteligência Comercial', pillarId: 'realtime', submoduleId: 'revops', icon: TrendingUp }
  ];

  const handleSelectCapsule = (cap: typeof primaryCapsules[0]) => {
    const targetPillar = pillars.find((p) => p.id === cap.pillarId) || pillars[0];
    const targetSub = targetPillar.submodules.find((s) => s.id === cap.submoduleId) || targetPillar.submodules[0];
    onNavigate(targetPillar, targetSub);
  };

  return (
    <header className="px-4 py-3 flex items-center justify-between border-b border-workspace-soft select-none z-20">
      {/* Esquerda: Identidade Birthub 360 + Título da Vista */}
      <div className="flex items-center space-x-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            data-testid="mobile-menu-trigger"
            onClick={onOpenMobileMenu}
            aria-label="Abrir menu lateral"
            className="md:hidden p-2 rounded-pill border border-workspace-soft text-workspace-secondary hover:text-workspace-primary"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Marca em Cápsula Arredondada */}
        <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-workspace-card rounded-pill border border-workspace-soft shadow-xs">
          <div className="w-6 h-6 rounded-full bg-[#343735] text-white flex items-center justify-center font-display font-black text-[10px]">
            <span className="text-[#E5FF45]">360°</span>
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-workspace-primary">
            Birthub 360
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-pill bg-[#E5FF45]/30 text-[#343735] font-black border border-[#E5FF45]/50">
            INTELLIGENCE WORKSPACE
          </span>
        </div>
      </div>

      {/* Centro / Direita: Cápsulas de Navegação com cantos arredondados */}
      <nav className="hidden xl:flex items-center space-x-1.5 overflow-x-auto py-1 px-2">
        {/* Barra de Pesquisa Rápida em Cápsula */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-workspace-card rounded-pill border border-workspace-soft text-workspace-secondary hover:text-workspace-primary text-xs font-mono shadow-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-workspace-graphite" />
            <span>Buscar</span>
            <kbd className="text-[9px] bg-workspace-surface px-1.5 py-0.5 rounded border border-workspace-soft">
              ⌘K
            </kbd>
          </button>
        )}

        {primaryCapsules.map((cap, idx) => {
          const Icon = cap.icon;
          const isActive =
            activeSubmodule.id === cap.submoduleId ||
            (activePillar.id === cap.pillarId && activeSubmodule.id.startsWith(cap.submoduleId));

          return (
            <button
              key={idx}
              onClick={() => handleSelectCapsule(cap)}
              className={`px-3 py-1.5 rounded-pill text-xs font-mono font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-workspace-card text-workspace-primary shadow-sm font-bold border border-workspace-graphite'
                  : 'text-workspace-secondary hover:text-workspace-primary hover:bg-workspace-card/60'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-workspace-graphite dark:text-[#E5FF45]' : 'text-workspace-secondary'
                }`}
              />
              <span>{cap.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Direita: Ferramentas do Usuário e Tema */}
      <div className="flex items-center space-x-2">
        {/* Alternador de Tema */}
        <button
          onClick={onToggleTheme}
          aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
          className="p-2 rounded-pill bg-workspace-card border border-workspace-soft text-workspace-secondary hover:text-workspace-primary transition-colors shadow-xs"
          title={`Alternar tema`}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-workspace-graphite" />
          ) : (
            <Sun className="w-4 h-4 text-[#FFC107]" />
          )}
        </button>

        {/* Supervisor Fast Action */}
        {onOpenSupervisor && (
          <button
            onClick={onOpenSupervisor}
            className="px-3 py-1.5 rounded-pill bg-[#E5FF45] hover:bg-[#d8f238] text-[#343735] font-mono font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Supervisor</span>
          </button>
        )}
      </div>
    </header>
  );
};
