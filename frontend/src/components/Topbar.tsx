import React from 'react';
import { 
  LogOut, 
  Bell, 
  Shield, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

interface TopbarProps {
  user: any;
  onLogout: () => void;
  activePillarLabel: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  user, 
  onLogout, 
  activePillarLabel,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between transition-colors">
      {/* Context Pillar Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1 bg-surface2 rounded-pill border border-border">
          <Sparkles className="w-3.5 h-3.5 text-neon-blue" />
          <span className="text-xs font-mono font-medium neon-title-cyan">
            Pilar Ativo: {activePillarLabel}
          </span>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center space-x-4">
        {/* Toggle Theme (Light / Dark) */}
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

        {/* Organização */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-neon-blue">
            {user?.organization?.name || 'Organização Principal'}
          </span>
          <span className="text-[10px] font-mono text-muted">
            Plano {user?.organization?.plan || 'ENTERPRISE'}
          </span>
        </div>

        {/* Notificações / Status */}
        <button className="p-2 text-muted hover:text-neon-blue hover:bg-surface2 rounded-control transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-pink"></span>
        </button>

        {/* User Badge */}
        <div className="flex items-center space-x-3 pl-3 border-l border-border">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold neon-title-pink">
              {user?.name || 'Operador'}
            </span>
            <span className="text-[10px] font-mono uppercase text-neon-gold flex items-center justify-end space-x-1">
              <Shield className="w-2.5 h-2.5" />
              <span>{user?.role || 'SDR'}</span>
            </span>
          </div>
          
          <button
            onClick={onLogout}
            title="Encerrar Sessão"
            className="p-2 text-muted hover:text-neon-danger hover:bg-surface2 rounded-control transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
