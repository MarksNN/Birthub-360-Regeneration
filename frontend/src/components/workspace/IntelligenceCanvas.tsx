import React from 'react';
import { TimelineRail } from './TimelineRail';
import { FlowView } from './FlowView';
import { WorkspaceViewMode } from './FloatingActionBar';
import { DashboardView } from '../DashboardView';
import { SubmoduleDefinition } from '../../navigation/pillars';

interface IntelligenceCanvasProps {
  viewMode: WorkspaceViewMode;
  activeSubmodule: SubmoduleDefinition;
  metrics: any;
  loading: boolean;
  deals: any[];
  companies: any[];
  leads: any[];
  activities: any[];
  agents: any[];
  onOpenCardDetail: (item: any) => void;
  onOpenNewDeal: () => void;
  onOpenSupervisor: () => void;
  children?: React.ReactNode;
}

export const IntelligenceCanvas: React.FC<IntelligenceCanvasProps> = ({
  viewMode,
  activeSubmodule,
  metrics,
  loading,
  deals,
  companies,
  leads,
  activities,
  agents,
  onOpenCardDetail,
  onOpenNewDeal,
  onOpenSupervisor,
  children
}) => {
  // Se o usuário está em um submódulo específico (ex: pipeline, empresas, contatos, leads, agentes)
  if (activeSubmodule.id !== 'overview') {
    if (viewMode === 'TIMELINE') {
      return (
        <TimelineRail
          deals={deals}
          companies={companies}
          leads={leads}
          activities={activities}
          agents={agents}
          onOpenCardDetail={onOpenCardDetail}
          onOpenNewDeal={onOpenNewDeal}
        />
      );
    }
    if (viewMode === 'FLOW') {
      return (
        <div className="w-full h-full overflow-y-auto p-4 md:p-6 pb-24">
          <FlowView
            onOpenSupervisor={onOpenSupervisor}
            onOpenNewDeal={onOpenNewDeal}
          />
        </div>
      );
    }
    // Modo padrão no submódulo: exibe os componentes e tabelas reais do módulo
    return (
      <div className="w-full h-full p-4 md:p-6 overflow-y-auto pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </div>
    );
  }

  // Quando na rota principal '/hub/overview' (Cockpit 360°):
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col justify-between bg-workspace-surface/30">
      {/* MODO 1: OVERVIEW — Cockpit Executivo 360° */}
      {viewMode === 'OVERVIEW' && (
        <div className="w-full h-full overflow-y-auto p-4 md:p-6 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">
            <DashboardView metrics={metrics} loading={loading} />
          </div>
        </div>
      )}

      {/* MODO 2: TIMELINE — Inspirada Diretamente na Imagem de Referência */}
      {viewMode === 'TIMELINE' && (
        <TimelineRail
          deals={deals}
          companies={companies}
          leads={leads}
          activities={activities}
          agents={agents}
          onOpenCardDetail={onOpenCardDetail}
          onOpenNewDeal={onOpenNewDeal}
        />
      )}

      {/* MODO 3: FLOW — Visualização Relacional de Processos e Agentes */}
      {viewMode === 'FLOW' && (
        <div className="w-full h-full overflow-y-auto p-4 md:p-6 pb-24">
          <FlowView
            onOpenSupervisor={onOpenSupervisor}
            onOpenNewDeal={onOpenNewDeal}
          />
        </div>
      )}
    </div>
  );
};
