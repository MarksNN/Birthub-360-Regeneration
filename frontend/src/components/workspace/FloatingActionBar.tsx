import React from 'react';
import {
  Search,
  BrainCircuit,
  PlusCircle,
  Bot,
  Zap,
  Filter,
  Layers,
  Bell,
  History,
  LayoutGrid,
  Clock,
  GitBranch
} from 'lucide-react';

export type WorkspaceViewMode = 'OVERVIEW' | 'TIMELINE' | 'FLOW';

interface FloatingActionBarProps {
  viewMode: WorkspaceViewMode;
  onChangeViewMode: (mode: WorkspaceViewMode) => void;
  onOpenSearch: () => void;
  onOpenSupervisor: () => void;
  onOpenNewDeal: () => void;
  onOpenAgents: () => void;
  onOpenAutomations: () => void;
  onOpenFilters?: () => void;
  notificationCount?: number;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  viewMode,
  onChangeViewMode,
  onOpenSearch,
  onOpenSupervisor,
  onOpenNewDeal,
  onOpenAgents,
  onOpenAutomations,
  onOpenFilters,
  notificationCount = 3
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 select-none">
      <div className="bg-[#0B132B]/90 dark:bg-[#131F42]/95 backdrop-blur-md text-white rounded-pill p-1.5 px-3 border border-white/10 dark:border-white/15 shadow-2xl flex items-center space-x-1.5 md:space-x-2 text-xs font-mono">
        {/* Pesquisa Global */}
        <button
          onClick={onOpenSearch}
          title="Pesquisa Global (⌘K)"
          className="p-2 rounded-pill hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <Search className="w-4 h-4 text-neon-blue" />
          <span className="hidden lg:inline text-[11px] font-medium">Buscar (⌘K)</span>
        </button>

        <div className="w-[1px] h-5 bg-white/15 my-auto"></div>

        {/* Supervisor Command Center Trigger */}
        <button
          onClick={onOpenSupervisor}
          title="Abrir Supervisor Command Center"
          className="px-3.5 py-1.5 rounded-pill bg-neon-blue hover:opacity-90 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-md"
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Supervisor</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        {/* Criar Oportunidade */}
        <button
          onClick={onOpenNewDeal}
          title="Criar Nova Oportunidade Comercial"
          className="p-2 rounded-pill hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4 text-neon-pink" />
          <span className="hidden md:inline text-[11px]">Novo Negócio</span>
        </button>

        {/* Executar Agente */}
        <button
          onClick={onOpenAgents}
          title="Catálogo & Execução dos 394 Agentes"
          className="p-2 rounded-pill hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <Bot className="w-4 h-4 text-neon-iris" />
          <span className="hidden md:inline text-[11px]">394 Agentes</span>
        </button>

        {/* Nova Automação */}
        <button
          onClick={onOpenAutomations}
          title="Central de Automações & Gatilhos"
          className="p-2 rounded-pill hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <Zap className="w-4 h-4 text-neon-gold" />
          <span className="hidden lg:inline text-[11px]">Automações</span>
        </button>

        <div className="w-[1px] h-5 bg-white/15 my-auto"></div>

        {/* Alternador de Modo de Visualização (Overview / Timeline / Flow) */}
        <div className="flex items-center bg-black/40 rounded-pill p-0.5 border border-white/10">
          <button
            onClick={() => onChangeViewMode('OVERVIEW')}
            title="Modo Overview: Cockpit Executivo 360°"
            className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'OVERVIEW'
                ? 'bg-neon-blue text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cockpit</span>
          </button>

          <button
            onClick={() => onChangeViewMode('TIMELINE')}
            title="Modo Timeline: Trilho de Negócios e Agentes"
            className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'TIMELINE'
                ? 'bg-neon-blue text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trilho</span>
          </button>

          <button
            onClick={() => onChangeViewMode('FLOW')}
            title="Modo Flow: Grafo Relacional do Pipeline"
            className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'FLOW'
                ? 'bg-neon-blue text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grafo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
