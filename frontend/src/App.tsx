import React, { useEffect, useState } from 'react';
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

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Navegação
  const [activePillar, setActivePillar] = useState('hub');
  const [activeModule, setActiveModule] = useState('pipeline');

  // Dados Reais da Aplicação
  const [metrics, setMetrics] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [assignees, setAssignees] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
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
      if (agRes.success) setAgents(agRes.data);
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

  const getPillarTitle = () => {
    const pMap: Record<string, string> = {
      hub: 'Hub Central (Cockpit 360°)',
      intelligence: 'Intelligence & ICP Scoring',
      sales: 'Sales Orchestration & Playbooks',
      realtime: 'Real-time Performance & Metas',
      forecast: 'Revenue Forecast & Dispersão',
      copilot: 'Copiloto IA & Roleplay',
      automations: 'Automações & Gatilhos',
      cadence: 'Cadência & Multicanal'
    };
    return pMap[activePillar] || 'Hub Central';
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

  return (
    <div className="flex h-screen bg-bg overflow-hidden text-ink transition-colors">
      {/* Sidebar com os 8 Pilares e Módulos */}
      <Sidebar
        activePillar={activePillar}
        setActivePillar={setActivePillar}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
      />

      {/* Área Central Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar
          user={currentUser}
          onLogout={handleLogout}
          activePillarLabel={getPillarTitle()}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supervisor Central Desacoplado Integrado */}
          <SupervisorPanel
            currentModule={activeModule}
            onRefreshData={loadAllData}
          />

          {/* Renderização Condicional dos Módulos Comerciais da Fase 02 */}
          {activeModule === 'overview' && (
            <DashboardView metrics={metrics} loading={loadingData} />
          )}

          {activeModule === 'pipeline' && (
            <PipelineKanbanView
              deals={deals}
              companies={companies}
              leads={leads}
              assignees={assignees}
              onRefresh={loadAllData}
            />
          )}

          {activeModule === 'companies' && (
            <CompaniesView companies={companies} onRefresh={loadAllData} />
          )}

          {activeModule === 'contacts' && (
            <ContactsView contacts={contacts} companies={companies} onRefresh={loadAllData} />
          )}

          {activeModule === 'leads' && (
            <LeadsView
              leads={leads}
              companies={companies}
              contacts={contacts}
              assignees={assignees}
              onRefresh={loadAllData}
            />
          )}

          {activeModule === 'activities' && (
            <ActivitiesView
              activities={activities}
              companies={companies}
              contacts={contacts}
              deals={deals}
              assignees={assignees}
              onRefresh={loadAllData}
            />
          )}

          {activeModule === 'revops' && (
            <RevOpsDashboardView metrics={metrics} loading={loadingData} />
          )}

          {activeModule === 'agents_catalog' && (
            <AgentsCatalogView agents={agents} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
