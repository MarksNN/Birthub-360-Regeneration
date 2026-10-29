import React from 'react';
import { 
  Compass, 
  BrainCircuit, 
  Workflow, 
  Activity, 
  TrendingUp, 
  Bot, 
  Zap, 
  GitFork,
  Users,
  Building2,
  Flame,
  CheckCircle2,
  Terminal,
  CalendarCheck,
  BarChart4
} from 'lucide-react';

interface SidebarProps {
  activePillar: string;
  setActivePillar: (pillar: string) => void;
  activeModule: string;
  setActiveModule: (mod: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePillar,
  setActivePillar,
  activeModule,
  setActiveModule
}) => {
  const pillars = [
    { id: 'hub', label: '1. Hub Central', icon: Compass, color: 'text-neon-blue' },
    { id: 'intelligence', label: '2. Intelligence & Scoring', icon: BrainCircuit, color: 'text-neon-iris' },
    { id: 'sales', label: '3. Sales Orchestration', icon: Workflow, color: 'text-neon-pink' },
    { id: 'realtime', label: '4. Real-time Performance', icon: Activity, color: 'text-neon-success' },
    { id: 'forecast', label: '5. Revenue Forecast', icon: TrendingUp, color: 'text-neon-gold' },
    { id: 'copilot', label: '6. Copiloto IA', icon: Bot, color: 'text-neon-iris' },
    { id: 'automations', label: '7. Automações & Gatilhos', icon: Zap, color: 'text-neon-blue' },
    { id: 'cadence', label: '8. Cadência & Engajamento', icon: GitFork, color: 'text-neon-pink' },
  ];

  const crmModules = [
    { id: 'overview', label: 'Cockpit Geral', icon: Activity },
    { id: 'pipeline', label: 'Pipeline & Funil', icon: CheckCircle2 },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'contacts', label: 'Contatos', icon: Users },
    { id: 'leads', label: 'Leads & Prospecção', icon: Flame },
    { id: 'activities', label: 'Atividades & Tarefas', icon: CalendarCheck },
    { id: 'revops', label: 'RevOps & Inteligência', icon: BarChart4 },
    { id: 'agents_catalog', label: 'Catálogo 394 Agentes', icon: Terminal },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-screen select-none transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center space-x-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-neon-gold via-neon-pink to-neon-blue p-[2px] shadow-sm">
          <div className="w-full h-full bg-bg rounded-full flex items-center justify-center">
            <span className="font-display font-black text-sm neon-title-cyan">360°</span>
          </div>
        </div>
        <div>
          <span className="font-display text-lg font-bold tracking-tight neon-title-brand">
            BIRTHUB 360°
          </span>
          <span className="block text-[10px] uppercase font-mono tracking-wider text-muted">
            Revenue Intelligence OS
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* NAVEGAÇÃO CRM E OPERACIONAL */}
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Módulos Comerciais (Fase 02)
          </span>
          <div className="mt-2 space-y-1">
            {crmModules.map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-control text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-surface2 text-neon-blue border border-neon-blue/30 font-semibold shadow-sm' 
                      : 'text-muted hover:bg-surface2/60 hover:text-ink'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-neon-blue' : 'text-muted'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* OS 8 PILARES DO ECOSSISTEMA */}
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            8 Pilares do Ecossistema
          </span>
          <div className="mt-2 space-y-1">
            {pillars.map(p => {
              const Icon = p.icon;
              const isActive = activePillar === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePillar(p.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-control text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-surface2 border border-neon-pink/40 text-neon-pink font-semibold shadow-sm' 
                      : 'text-muted hover:bg-surface2/40 hover:text-ink'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${p.color}`} />
                  <span className="truncate">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-border bg-surface2/50 text-[11px] font-mono text-muted flex justify-between items-center">
        <span>Fase 02: CRM & RevOps</span>
        <span className="w-2 h-2 rounded-full bg-neon-success animate-pulse"></span>
      </div>
    </aside>
  );
};
