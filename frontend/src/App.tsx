import React, { useEffect, useState } from 'react';
import { Lock, Clock, Layers } from 'lucide-react';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoginScreen } from './components/LoginScreen';
import { SupervisorPanel } from './components/SupervisorPanel';
import { DashboardView } from './components/DashboardView';
import { CompaniesView } from './components/CompaniesView';
import { ContactsView } from './components/ContactsView';
import { LeadsView } from './components/LeadsView';
import { PipelineKanbanView } from './components/PipelineKanbanView';
import { ActivitiesView } from './components/ActivitiesView';
import { RevOpsDashboardView } from './components/RevOpsDashboardView';
import { AgentsCatalogView } from './components/AgentsCatalogView';
import { IntegrationHubView } from './components/IntegrationHubView';
import {
  findSubmoduleByPath,
  PillarDefinition,
  SubmoduleDefinition,
  hasRolePermission
} from './navigation/pillars';

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // MODO LIGHT COMO PADRÃO
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('birthhub_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('birthhub_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Navegação Real Baseada em Rotas (window.location.pathname + History API)
  const initialRoute = findSubmoduleByPath(window.location.pathname);
  const [activePillar, setActivePillar] = useState<PillarDefinition>(initialRoute.pillar);
  const [activeSubmodule, setActiveSubmodule] = useState<SubmoduleDefinition>(initialRoute.submodule);

  useEffect(() => {
    // Garantir que se estiver na raiz '/', atualize a URL para a rota canônica inicial
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({}, '', initialRoute.submodule.path);
    }

    const handlePopState = () => {
      const resolved = findSubmoduleByPath(window.location.pathname);
      setActivePillar(resolved.pillar);
      setActiveSubmodule(resolved.submodule);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (pillar: PillarDefinition, submodule: SubmoduleDefinition) => {
    setActivePillar(pillar);
    setActiveSubmodule(submodule);
    if (window.location.pathname !== submodule.path) {
      window.history.pushState({}, '', submodule.path);
    }
  };

  // Dados Reais da Aplicação
  const [metrics, setMetrics] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsMeta, setAgentsMeta] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    const token = api.getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success) {
        setCurrentUser(res.user);
        loadAllData();
      } else {
        api.clearToken();
      }
    } catch {
      api.clearToken();
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [mRes, compRes, contRes, lRes, dRes, actRes, assRes, agRes] = await Promise.all([
        api.getDashboardMetrics(),
        api.getCompanies(),
        api.getContacts(),
        api.getLeads(),
        api.getDeals(),
        api.getActivities(),
        api.getAssignees(),
        api.getAgentsCatalog()
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (compRes.success) setCompanies(compRes.data);
      if (contRes.success) setContacts(contRes.data);
      if (lRes.success) setLeads(lRes.data);
      if (dRes.success) setDeals(dRes.data);
      if (actRes.success) setActivities(actRes.data);
      if (assRes.success) setAssignees(assRes.data);
      if (agRes.success) {
        setAgents(agRes.data);
        setAgentsMeta(agRes.meta);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadAllData();
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const userHasAccess = hasRolePermission(currentUser.role, activeSubmodule.minRole);

  return (
    <div className="flex h-screen bg-bg overflow-hidden text-ink transition-colors">
      {/* Sidebar Oficial com os 8 Pilares e Submódulos */}
      <Sidebar
        activePillarId={activePillar.id}
        activeSubmodule={activeSubmodule}
        userRole={currentUser.role}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área Central Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar
          user={currentUser}
          onLogout={handleLogout}
          activePillarLabel={activePillar.label}
          activeSubmoduleLabel={activeSubmodule.label}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supervisor Central Desacoplado com Contexto do Pilar/Submódulo */}
          <SupervisorPanel
            currentModule={activeSubmodule.id}
            supervisorContext={activeSubmodule.supervisorContext}
            pillarLabel={`${activePillar.label} / ${activeSubmodule.label}`}
            onRefreshData={loadAllData}
          />

          {/* Verificação de Permissão RBAC na Navegação */}
          {!userHasAccess ? (
            <div
              data-testid="module-access-denied"
              className="card-neon p-8 text-center space-y-3 border border-neon-danger/40"
            >
              <div className="w-12 h-12 rounded-full bg-neon-danger/10 text-neon-danger flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="font-display text-lg font-bold neon-title-pink">
                Acesso Restrito por Perfil (RBAC)
              </h2>
              <p className="text-xs text-muted max-w-md mx-auto">
                O módulo <strong>{activeSubmodule.label}</strong> no pilar{' '}
                <strong>{activePillar.label}</strong> requer o perfil mínimo{' '}
                <span className="font-mono text-neon-gold font-bold">{activeSubmodule.minRole}</span>. Seu perfil atual é{' '}
                <span className="font-mono text-neon-blue font-bold">{currentUser.role}</span>.
              </p>
            </div>
          ) : !activeSubmodule.isImplemented ? (
            /* Representação Explícita de Funcionalidade Futura (Sem fingir operacionalidade) */
            <div
              data-testid="planned-module-view"
              className="card-neon p-8 space-y-4 border border-neon-gold/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-neon-gold/10 text-neon-gold flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold neon-title-gold">
                      {activeSubmodule.label} — Funcionalidade Planejada ({activeSubmodule.plannedPhase || 'Roadmap'})
                    </h2>
                    <span className="text-xs font-mono text-muted">
                      Pilar: {activePillar.label} • Rota: {activeSubmodule.path}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-pill text-xs font-mono font-bold bg-neon-gold/15 text-neon-gold border border-neon-gold/30">
                  ROADMAP OFICIAL ({activeSubmodule.plannedPhase || 'PRÓXIMA FASE'})
                </span>
              </div>

              <p className="text-sm text-muted">{activeSubmodule.description}</p>

              <div className="p-4 rounded-control bg-surface2 border border-border text-xs font-mono space-y-1">
                <div className="flex items-center space-x-2 text-neon-blue font-semibold">
                  <Layers className="w-4 h-4" />
                  <span>Governança de Transparência Birthub 360°</span>
                </div>
                <p className="text-muted">
                  Este módulo faz parte da arquitetura oficial de 8 pilares e está catalogado para entrega na{' '}
                  <strong>{activeSubmodule.plannedPhase || 'Fase 03'}</strong>. Nenhuma operação simulada ou mockada é exibida como funcional antes da homologação de suas ferramentas de backend.
                </p>
              </div>
            </div>
          ) : (
            /* Renderização dos Módulos Reais Implementados */
            <>
              {activeSubmodule.id === 'overview' && (
                <DashboardView metrics={metrics} loading={loadingData} />
              )}

              {activeSubmodule.id === 'pipeline' && (
                <PipelineKanbanView
                  deals={deals}
                  companies={companies}
                  leads={leads}
                  assignees={assignees}
                  onRefresh={loadAllData}
                />
              )}

              {activeSubmodule.id === 'companies' && (
                <CompaniesView companies={companies} onRefresh={loadAllData} />
              )}

              {activeSubmodule.id === 'contacts' && (
                <ContactsView contacts={contacts} companies={companies} onRefresh={loadAllData} />
              )}

              {activeSubmodule.id === 'leads' && (
                <LeadsView
                  leads={leads}
                  companies={companies}
                  contacts={contacts}
                  assignees={assignees}
                  onRefresh={loadAllData}
                />
              )}

              {activeSubmodule.id === 'activities' && (
                <ActivitiesView
                  activities={activities}
                  companies={companies}
                  contacts={contacts}
                  deals={deals}
                  assignees={assignees}
                  onRefresh={loadAllData}
                />
              )}

              {(activeSubmodule.id === 'revops' || activeSubmodule.id === 'weighted_forecast') && (
                <RevOpsDashboardView metrics={metrics} loading={loadingData} />
              )}

              {activeSubmodule.id === 'agents_catalog' && (
                <AgentsCatalogView
                  agents={agents}
                  meta={agentsMeta}
                  userRole={currentUser.role}
                  onRefresh={loadAllData}
                />
              )}

              {(activeSubmodule.id === 'integration_hub' || activeSubmodule.id === 'triggers_hub') && (
                <IntegrationHubView
                  userRole={currentUser.role}
                  onRefreshData={loadAllData}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
