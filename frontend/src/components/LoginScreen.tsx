import React, { useState } from 'react';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess,
  theme,
  onToggleTheme
}) => {
  const [email, setEmail] = useState('admin@birthhub360.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login(email, password);
      if (res.success) {
        api.setToken(res.token);
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Credenciais inválidas');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao comunicar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const setPresetUser = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-4 relative overflow-hidden transition-colors">
      {/* Botão de Alternância de Tema no Login */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-pill bg-surface border border-border text-muted hover:text-ink shadow-sm flex items-center space-x-2 text-xs font-mono transition-all"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4 h-4 text-neon-iris" />
              <span>Modo Escuro</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-neon-gold" />
              <span>Modo Claro</span>
            </>
          )}
        </button>
      </div>

      {/* Halo de Fundo 360 */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-neon-blue/10 via-neon-pink/10 to-neon-gold/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md card-neon p-8 border border-border shadow-2xl relative z-10 bg-surface">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-tr from-neon-gold via-neon-pink to-neon-blue p-[2px] shadow-sm mb-3">
            <div className="w-full h-full bg-bg rounded-full flex items-center justify-center">
              <span className="font-display font-black text-base neon-title-cyan">360°</span>
            </div>
          </div>
          <h1 className="font-display text-2xl font-black neon-title-brand">
            BIRTHUB 360°
          </h1>
          <p className="text-xs font-mono uppercase tracking-wider text-muted mt-1">
            Sistema Operacional de Revenue Intelligence
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-control bg-neon-danger/10 border border-neon-danger/30 text-xs text-neon-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted block mb-1.5">
              E-mail Corporativo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-control px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-neon-blue"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-muted block mb-1.5">
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-control px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-neon-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-neon-cta flex items-center justify-center space-x-2 py-3 mt-2 text-xs font-bold"
          >
            <span>{loading ? 'Autenticando...' : 'Acessar Central de Comando 360°'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Atalhos Rápidos para Teste Local */}
        <div className="mt-6 pt-5 border-t border-border text-center">
          <span className="text-[11px] font-mono text-muted block mb-2">
            Perfis Pré-configurados (Fase 01 Seed):
          </span>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPresetUser('admin@birthhub360.com')}
              className="px-2.5 py-1 bg-surface2 hover:bg-surface2/80 rounded-pill border border-neon-blue/30 text-[10px] font-mono text-neon-blue font-semibold"
            >
              ADMIN 360
            </button>
            <button
              onClick={() => setPresetUser('sdr@birthhub360.com')}
              className="px-2.5 py-1 bg-surface2 hover:bg-surface2/80 rounded-pill border border-neon-pink/30 text-[10px] font-mono text-neon-pink font-semibold"
            >
              SDR Operador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
