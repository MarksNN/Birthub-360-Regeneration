import React from 'react';
import {
  LogOut,
  Bell,
  Shield,
  Sparkles,
  Sun,
  Moon,
  Menu,
  Building2,
  ShieldCheck
} from 'lucide-react';

interface TopbarProps {
  user: any;
  onLogout: () => void;
  activePillarLabel: string;
  activeSubmoduleLabel?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  user,
  onLogout,
  activePillarLabel,
  activeSubmoduleLabel,
  theme,
  onToggleTheme,
  onOpenMobileMenu
}) => {
  return (
    <header className="h-16 bg-surface border-b border-border px-4 md:px-6 flex items-center justify-between transition-colors z-20">
      {/* Indicador do Pilar de Contexto + Botão de Menu Mobile */}
      <div className="flex items-center space-x-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            data-testid="mobile-menu-trigger"
            onClick={onOpenMobileMenu}
            aria-label="Abrir navegação"
            className="md:hidden p-2 rounded-control border border-border text-muted hover:text-ink hover:bg-surface2"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center space-x-2 px-3 py-1.5 bg-surface2 rounded-pill border border-border">
          <Sparkles className="w-3.5 h-3.5 text-neon-blue" />
          <span data-testid="active-pillar-indicator" className="text-xs font-mono font-semibold text-ink">
            {activePillarLabel}
            {activeSubmoduleLabel ? (
              <span className="text-muted font-normal"> • {activeSubmoduleLabel}</span>
            ) : ''}
          </span>
        </div>
      </div>

      {/* Ferramentas e Perfil do Usuário */}
      <div className="flex items-center space-x-4">
        {/* Alternador de Tema (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-muted hover:text-ink hover:bg-surface2 rounded-control border border-border transition-colors flex items-center space-x-2 text-xs font-mono"
          title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-neon-iris" />
              <span className="hidden sm:inline">Modo Escuro</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-neon-gold" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          )}
        </button>

        {/* Organização Ativa */}
        <div className="hidden md:flex flex-col text-right font-mono">
          <span className="text-xs font-semibold text-ink flex items-center justify-end gap-1">
            <Building2 className="w-3 h-3 text-neon-blue" />
            {user?.organization?.name || 'Organização Principal'}
          </span>
          <span className="text-[10px] text-muted">
            Plano {user?.organization?.plan || 'ENTERPRISE'} • Multi-Tenant
          </span>
        </div>

        {/* Notificações / Alertas */}
        <button 
          title="Notificações do Supervisor"
          className="p-2 text-muted hover:text-ink hover:bg-surface2 rounded-control border border-border transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-pink animate-pulse"></span>
        </button>

        {/* Perfil & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-500/15 text-neon-blue font-mono font-bold text-xs flex items-center justify-center border border-sky-500/30">
              {(user?.name || 'U').substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left font-mono">
              <span className="text-xs font-bold text-ink">
                {user?.name || 'Operador'}
              </span>
              <span className="text-[10px] uppercase text-muted flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{user?.role || 'SDR'}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Encerrar Sessão"
            className="p-2 text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface2 rounded-control border border-border transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
