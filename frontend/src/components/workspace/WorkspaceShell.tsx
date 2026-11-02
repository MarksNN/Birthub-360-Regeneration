import React, { useState, useEffect } from 'react';
import { CapsuleNavigation } from './CapsuleNavigation';
import { ContextHeader } from './ContextHeader';
import { IntelligenceCanvas } from './IntelligenceCanvas';
import { FloatingActionBar, WorkspaceViewMode } from './FloatingActionBar';
import { SupervisorCommandPanel } from './SupervisorCommandPanel';
import { DetailDrawer } from './DetailDrawer';
import { Sidebar } from '../Sidebar';
import {
  EIGHT_PILLARS,
  PillarDefinition,
  SubmoduleDefinition
} from '../../navigation/pillars';
import { Search, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface WorkspaceShellProps {
  user: any;
  activePillar: PillarDefinition;
  activeSubmodule: SubmoduleDefinition;
  onNavigate: (pillar: PillarDefinition, submodule: SubmoduleDefinition) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  metrics: any;
  loadingData: boolean;
  deals: any[];
  companies: any[];
  leads: any[];
  activities: any[];
  assignees: any[];
  agents: any[];
  agentsMeta: any;
  onRefreshData: () => void;
  children: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  user,
  activePillar,
  activeSubmodule,
  onNavigate,
  onLogout,
  theme,
  onToggleTheme,
  metrics,
  loadingData,
  deals,
  companies,
  leads,
  activities,
  assignees,
  agents,
  agentsMeta,
  onRefreshData,
  children
}) => {
  // Modo de visualização do Canvas (Overview, Timeline, Flow)
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>(() => {
    return activeSubmodule.id === 'overview' ? 'TIMELINE' : 'OVERVIEW';
  });

  useEffect(() => {
    if (activeSubmodule.id === 'overview') {
      setViewMode('TIMELINE');
    } else {
      setViewMode('OVERVIEW');
    }
  }, [activeSubmodule.id]);

  // Estado do Command Center do Supervisor
  const [supervisorOpen, setSupervisorOpen] = useState(false);

  // Estado da Gaveta de Detalhes
  const [detailItem, setDetailItem] = useState<any>(null);

  // Estado da Pesquisa Global
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar oficial: Mantida docada ou colapsada com acesso aos 8 pilares
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Atalho de teclado global: ⌘K / Ctrl+K para busca, ⌘S para Supervisor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setSupervisorOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSupervisorOpen(false);
        setDetailItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenNewDeal = () => {
    // Navega para o Pipeline e pode acionar o modal de novo deal
    const salesPillar = EIGHT_PILLARS.find((p) => p.id === 'sales') || EIGHT_PILLARS[2];
    const pipeSub = salesPillar.submodules.find((s) => s.id === 'pipeline') || salesPillar.submodules[0];
    onNavigate(salesPillar, pipeSub);
    setViewMode('OVERVIEW');
  };

  const handleOpenAgents = () => {
    const copilotPillar = EIGHT_PILLARS.find((p) => p.id === 'copilot') || EIGHT_PILLARS[5];
    const catSub = copilotPillar.submodules.find((s) => s.id === 'agents_catalog') || copilotPillar.submodules[1];
    onNavigate(copilotPillar, catSub);
    setViewMode('OVERVIEW');
  };

  const handleOpenAutomations = () => {
    const autoPillar = EIGHT_PILLARS.find((p) => p.id === 'automations') || EIGHT_PILLARS[6];
    const intSub = autoPillar.submodules.find((s) => s.id === 'integration_hub') || autoPillar.submodules[0];
    onNavigate(autoPillar, intSub);
    setViewMode('OVERVIEW');
  };

  // Itens filtrados para busca global
  const searchResults = searchQuery.trim()
    ? [
        ...companies
          .filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((c) => ({ type: 'Empresa', title: c.name, sub: c.cnpj || 'Conta B2B' })),
        ...deals
          .filter((d) => d.title?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((d) => ({
            type: 'Negócio',
            title: d.title,
            sub: `R$ ${(d.amount || 0).toLocaleString('pt-BR')} • ${d.stage}`
          })),
        ...leads
          .filter((l) => l.title?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((l) => ({ type: 'Lead', title: l.title, sub: `ICP Score: ${l.icpScore || 85}` }))
      ]
    : [];

  return (
    <div
      className="min-h-screen w-screen p-2 md:p-4 lg:p-6 flex items-center justify-center transition-colors overflow-hidden select-none"
      style={{ backgroundColor: 'var(--bg-canvas-outer)' }}
    >
      {/* ========================================================================= */}
      {/* GRANDE CONTÊINER COM MOLDURA GRAFITE SOFISTICADA E CANTOS ARREDONDADOS      */}
      {/* (REINTERPRETAÇÃO FIEL DO CANVAS VISUAL DA REFERÊNCIA)                     */}
      {/* ========================================================================= */}
      <div
        className="w-full h-[96vh] max-w-[1780px] bg-workspace-surface flex flex-col overflow-hidden relative shadow-2xl transition-all"
        style={{
          borderRadius: '36px',
          border: '12px solid var(--graphite-frame)',
          backgroundColor: 'var(--surface-main)'
        }}
      >
        {/* TOP NAVIGATION EM CÁPSULAS FLUTUANTES */}
        <CapsuleNavigation
          activePillar={activePillar}
          activeSubmodule={activeSubmodule}
          onNavigate={(p, s) => {
            onNavigate(p, s);
          }}
          pillars={EIGHT_PILLARS}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSupervisor={() => setSupervisorOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* CONTEXT HEADER COM INDICADORES REAIS & PERFIL */}
        <ContextHeader
          user={user}
          metrics={metrics}
          activePillar={activePillar}
          activeSubmodule={activeSubmodule}
          onSelectSubmodule={(sub) => onNavigate(activePillar, sub)}
        />

        {/* ÁREA CENTRAL PRINCIPAL: DUAL NAVIGATION (SIDEBAR COMPATÍVEL + CANVAS) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar Lateral dos 8 Pilares (Preservação total de contratos, RBAC e testes) */}
          <div
            className={`transition-all duration-300 ease-in-out border-r border-workspace-soft h-full flex flex-col shrink-0 ${
              sidebarExpanded ? 'w-64 xl:w-72' : 'w-0 overflow-hidden'
            }`}
          >
            <Sidebar
              activePillarId={activePillar.id}
              activeSubmodule={activeSubmodule}
              userRole={user.role}
              onNavigate={(p, s) => {
                onNavigate(p, s);
                // Se o usuário selecionou uma página na sidebar, visualiza o módulo diretamente
                setViewMode('OVERVIEW');
              }}
              mobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>

          {/* Botão de Toggle da Sidebar */}
          <button
            onClick={() => setSidebarExpanded((prev) => !prev)}
            title={sidebarExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
            aria-label={sidebarExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
            className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-workspace-card/80 backdrop-blur-sm border border-workspace-soft text-workspace-secondary hover:text-workspace-primary shadow-xs transition-transform"
          >
            {sidebarExpanded ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            )}
          </button>

          {/* CANVAS CENTRAL DE INTELIGÊNCIA */}
          <main className="flex-1 h-full overflow-hidden relative">
            <IntelligenceCanvas
              viewMode={viewMode}
              activeSubmodule={activeSubmodule}
              metrics={metrics}
              loading={loadingData}
              deals={deals}
              companies={companies}
              leads={leads}
              activities={activities}
              agents={agents}
              onOpenCardDetail={(item) => setDetailItem(item)}
              onOpenNewDeal={handleOpenNewDeal}
              onOpenSupervisor={() => setSupervisorOpen(true)}
            >
              {children}
            </IntelligenceCanvas>
          </main>
        </div>

        {/* FLOATING ACTION BAR INFERIOR */}
        <FloatingActionBar
          viewMode={viewMode}
          onChangeViewMode={(mode) => setViewMode(mode)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenSupervisor={() => setSupervisorOpen(true)}
          onOpenNewDeal={handleOpenNewDeal}
          onOpenAgents={handleOpenAgents}
          onOpenAutomations={handleOpenAutomations}
        />

        {/* SUPERVISOR COMMAND CENTER INTEGRADO */}
        <SupervisorCommandPanel
          isOpen={supervisorOpen}
          onClose={() => setSupervisorOpen(false)}
          currentModule={activeSubmodule.id}
          supervisorContext={activeSubmodule.supervisorContext}
          onRefreshData={onRefreshData}
        />

        {/* DRAWER LATERAL DE DETALHES DE ENTIDADES */}
        <DetailDrawer
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
          item={detailItem}
          onAction={(action, payload) => {
            if (action === 'INSPECT' && payload?.stage) {
              const salesPillar = EIGHT_PILLARS.find((p) => p.id === 'sales') || EIGHT_PILLARS[2];
              const pipeSub = salesPillar.submodules.find((s) => s.id === 'pipeline') || salesPillar.submodules[0];
              onNavigate(salesPillar, pipeSub);
              setViewMode('OVERVIEW');
            }
          }}
        />

        {/* MODAL DE PESQUISA GLOBAL (⌘K) */}
        {searchOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="w-full max-w-xl bg-workspace-card rounded-canvas border border-workspace-soft shadow-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderRadius: '24px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-workspace-soft flex items-center space-x-3">
                <Search className="w-5 h-5 text-workspace-secondary" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Pesquisar contas, contatos, leads, agentes ou automações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm font-mono text-workspace-primary placeholder:text-workspace-secondary"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1 rounded-full text-workspace-secondary hover:text-workspace-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {searchResults.length > 0 ? (
                  searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-control hover:bg-workspace-surface cursor-pointer flex items-center justify-between text-xs font-mono transition-colors"
                      onClick={() => setSearchOpen(false)}
                    >
                      <div>
                        <span className="font-bold text-workspace-primary block">{res.title}</span>
                        <span className="text-[10px] text-workspace-secondary">{res.sub}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-pill bg-[#343735] text-white text-[9px]">
                        {res.type}
                      </span>
                    </div>
                  ))
                ) : searchQuery ? (
                  <div className="p-6 text-center text-xs font-mono text-workspace-secondary">
                    Nenhum resultado encontrado para &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-mono text-workspace-secondary">
                    Digite o nome de uma empresa, oportunidade ou lead para buscar
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
