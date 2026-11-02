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
      <div className="bg-[#343735]/95 backdrop-blur-md text-white rounded-pill p-1.5 px-3 border border-black/40 shadow-2xl flex items-center space-x-1.5 md:space-x-2 text-xs font-mono">
        {/* Pesquisa Global */}
        <button
          onClick={onOpenSearch}
          title="Pesquisa Global (⌘K)"
          className="p-2 rounded-pill hover:bg-white/15 text-white/90 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <Search className="w-4 h-4 text-[#E5FF45]" />
          <span className="hidden lg:inline text-[11px] font-medium">Buscar</span>
        </button>

        <div className="w-[1px] h-5 bg-white/20 my-auto"></div>

        {/* Supervisor Command Center Trigger */}
        <button
          onClick={onOpenSupervisor}
          title="Abrir Supervisor Command Center"
          className="px-3 py-1.5 rounded-pill bg-[#E5FF45] text-[#343735] hover:bg-[#d8f238] font-bold text-xs transition-all flex items-center space-x-1.5 shadow-md"
        >
          <BrainCircuit className="w-4 h-4 text-[#343735]" />
          <span>Supervisor</span>
        </button>

        {/* Criar Oportunidade */}
        <button
          onClick={onOpenNewDeal}
          title="Criar Nova Oportunidade Comercial"
          className="p-2 rounded-pill hover:bg-white/15 text-white/90 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span className="hidden md:inline text-[11px]">Novo Negócio</span>
        </button>

        {/* Executar Agente */}
        <button
          onClick={onOpenAgents}
          title="Catálogo & Execução de Agentes"
          className="p-2 rounded-pill hover:bg-white/15 text-white/90 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <Bot className="w-4 h-4 text-white" />
          <span className="hidden md:inline text-[11px]">Agentes</span>
        </button>

        {/* Nova Automação */}
        <button
          onClick={onOpenAutomations}
          title="Central de Automações & Gatilhos"
          className="p-2 rounded-pill hover:bg-white/15 text-white/90 hover:text-white transition-all flex items-center space-x-1.5"
        >
          <Zap className="w-4 h-4 text-[#FFC107]" />
          <span className="hidden lg:inline text-[11px]">Automações</span>
        </button>

        <div className="w-[1px] h-5 bg-white/20 my-auto"></div>

        {/* Alternador de Modo de Visualização (Overview / Timeline / Flow) */}
        <div className="flex items-center bg-black/30 rounded-pill p-0.5 border border-white/10">
          <button
            onClick={() => onChangeViewMode('OVERVIEW')}
            title="Modo Overview: Cockpit Executivo 360°"
            className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'OVERVIEW'
                ? 'bg-[#F8F9F5] text-[#222522] shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            onClick={() => onChangeViewMode('TIMELINE')}
            title="Modo Timeline: Linha do Tempo Visual Conectada (Referência 360°)"
            className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'TIMELINE'
                ? 'bg-[#F8F9F5] text-[#222522] shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Timeline</span>
          </button>

          <button
            onClick={() => onChangeViewMode('FLOW')}
            title="Modo Flow: Fluxo Relacional de Agentes & Processos"
            className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-all flex items-center space-x-1 ${
              viewMode === 'FLOW'
                ? 'bg-[#F8F9F5] text-[#222522] shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flow</span>
          </button>
        </div>

        {/* Notificações / Status */}
        <div className="relative">
          <button
            title="Notificações & Alertas Prioritários"
            className="p-2 rounded-pill hover:bg-white/15 text-white/90 hover:text-white transition-all relative"
          >
            <Bell className="w-4 h-4 text-white" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E5FF45]"></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
