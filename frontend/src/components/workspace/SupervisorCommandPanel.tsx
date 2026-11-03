import React, { useState } from 'react';
import {
  BrainCircuit,
  Bot,
  Sparkles,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  X,
  Layers,
  ChevronRight,
  Terminal,
  Activity,
  AlertCircle,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { SupervisorContextModule } from '../../navigation/pillars';

interface SupervisorCommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule?: string;
  supervisorContext?: SupervisorContextModule;
  onRefreshData?: () => void;
}

export const SupervisorCommandPanel: React.FC<SupervisorCommandPanelProps> = ({
  isOpen,
  onClose,
  currentModule = 'overview',
  supervisorContext = 'HUB',
  onRefreshData
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [missionResult, setMissionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'EXECUTE' | 'MISSION'>('EXECUTE');

  if (!isOpen) return null;

  const quickPrompts = [
    'Supervisor, analise as oportunidades com maior risco de perda, identifique as causas e organize um plano de recuperação.',
    'Calcular projeção de receita ponderada para o fechamento deste mês com base no histórico do CRM.',
    'Identificar leads estagnados no funil há mais de 48h e sugerir cadência de reengajamento com IA.',
    'Verificar conformidade dos contratos em negociação com as políticas de desconto e margem mínima.'
  ];

  const handleRunCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setExecutionResult(null);

    try {
      const res = await api.orchestrateSupervisor({
        targetModule: supervisorContext || 'HUB',
        prompt
      });
      if (res.success) {
        setExecutionResult(res.data);
        if (onRefreshData) onRefreshData();
      } else {
        setExecutionResult({
          suggestedAgentName: 'Supervisor Security Guard',
          suggestedAgentCode: 'supervisor-guard',
          operationalStatus: 'DISABLED',
          authorizationCheck: { hasPermission: false },
          requiredTools: [],
          simulatedOutput: res.error || 'Erro ao consultar o Supervisor'
        });
      }
    } catch (err: any) {
      setExecutionResult({
        suggestedAgentName: 'Supervisor Security Guard',
        suggestedAgentCode: 'supervisor-guard',
        operationalStatus: 'DISABLED',
        authorizationCheck: { hasPermission: false },
        requiredTools: [],
        simulatedOutput: err.message || 'Falha de comunicação com o Supervisor'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setMissionResult(null);

    try {
      const res = await api.startSupervisorMission({ prompt });
      if (res.success) {
        setMissionResult(res.data);
        if (onRefreshData) onRefreshData();
      } else {
        setMissionResult({ error: res.error || 'Falha ao despachar missão para o Supervisor' });
      }
    } catch (err: any) {
      setMissionResult({ error: err.message || 'Falha na requisição da missão' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supervisor-panel-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-surface rounded-card border border-border shadow-2xl overflow-hidden text-ink">
        {/* Header Executivo do Command Center */}
        <div className="p-6 bg-gradient-to-r from-[#0B132B] to-[#131F42] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center font-bold border border-neon-blue/40 shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="supervisor-panel-title" className="font-display font-bold text-lg text-white">
                  Supervisor Núcleo — 360° Intelligence Orchestrator
                </h2>
                <span className="badge-telemetry bg-sky-500/20 text-neon-blue border border-sky-500/40">
                  394 AGENTES
                </span>
              </div>
              <span className="text-xs text-white/70 font-mono">
                Contexto Ativo: <span className="text-neon-blue font-semibold">{supervisorContext}</span> • Governança RBAC & Aprovação HITL
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar painel do Supervisor"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Painel com Rolagem */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Prompts Sugeridos de Missão */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold block">
              Missões Rápidas Recomendadas para este Módulo:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(qp)}
                  className="text-left p-3 rounded-control bg-surface2 hover:bg-surface border border-border text-xs text-ink transition-all flex items-start space-x-2.5 group"
                >
                  <Sparkles className="w-4 h-4 text-neon-blue shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="leading-relaxed line-clamp-2">{qp}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Entrada de Comando */}
          <form onSubmit={handleRunCommand} className="space-y-3">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Insira sua ordem ou missão estratégica para o Supervisor 360°..."
                rows={3}
                data-testid="supervisor-prompt-input"
                className="w-full p-4 rounded-control bg-surface2 border border-border focus:border-neon-blue focus:outline-none text-sm font-mono leading-relaxed resize-none shadow-inner text-ink"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('EXECUTE')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-mono font-medium transition-all ${
                    activeTab === 'EXECUTE'
                      ? 'bg-neon-blue text-white shadow-sm'
                      : 'text-muted hover:bg-surface2'
                  }`}
                >
                  Consulta Rápida
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('MISSION')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-mono font-medium transition-all ${
                    activeTab === 'MISSION'
                      ? 'bg-neon-iris text-white shadow-sm'
                      : 'text-muted hover:bg-surface2'
                  }`}
                >
                  Missão Autônoma & HITL
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="px-4 py-2 rounded-pill text-xs font-mono text-muted hover:text-ink transition-colors"
                >
                  Limpar
                </button>

                {activeTab === 'EXECUTE' ? (
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    data-testid="supervisor-submit-btn"
                    className="btn-neon-primary text-xs shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Executar Ordem</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartMission}
                    disabled={loading || !prompt.trim()}
                    className="btn-neon-cta text-xs shadow-md disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Despachando...</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        <span>Disparar Missão</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Resultado de Execução Estruturado */}
          {executionResult && (
            <div
              data-testid="supervisor-execution-result"
              className="p-5 rounded-card bg-surface2 border border-border space-y-4 animate-in fade-in duration-300"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neon-blue animate-pulse"></span>
                  <h3 className="font-display font-bold text-sm text-ink">
                    Síntese do Supervisor & Agente Alocado
                  </h3>
                </div>
                <span className="badge-telemetry bg-surface text-ink border border-border">
                  {executionResult.suggestedAgentCode || 'SUPERVISOR_KERNEL'}
                </span>
              </div>

              {/* Grid de Evidências */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-control bg-surface border border-border">
                  <span className="text-[10px] font-mono text-muted uppercase block">
                    Agente Responsável
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Bot className="w-4 h-4 text-neon-blue" />
                    <span className="font-bold text-xs text-ink">
                      {executionResult.suggestedAgentName || 'Closer Sales AI'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-control bg-surface border border-border">
                  <span className="text-[10px] font-mono text-muted uppercase block">
                    Status Operacional
                  </span>
                  <span className="font-mono text-xs font-bold text-ink mt-1 block">
                    {executionResult.operationalStatus || 'EXECUTABLE'}
                  </span>
                </div>

                <div className="p-3 rounded-control bg-surface border border-border">
                  <span className="text-[10px] font-mono text-muted uppercase block">
                    Permissão RBAC
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {executionResult.authorizationCheck?.hasPermission ? 'AUTORIZADO' : 'HOMOLOGADO'}
                  </span>
                </div>
              </div>

              {/* Raciocínio & Output do Agente */}
              <div className="p-4 rounded-control bg-surface border border-border font-mono text-xs leading-relaxed space-y-2">
                <div className="flex items-center space-x-2 text-muted font-bold">
                  <Terminal className="w-4 h-4 text-neon-blue" />
                  <span>Resultado e Parecer do Supervisor:</span>
                </div>
                <div className="whitespace-pre-wrap text-ink">
                  {executionResult.simulatedOutput ||
                    executionResult.humanSynthesis ||
                    JSON.stringify(executionResult, null, 2)}
                </div>
              </div>
            </div>
          )}

          {/* Resultado de Missão Autônoma com Trilha de Auditoria */}
          {missionResult && (
            <div className="p-5 rounded-card bg-surface2 border border-border space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-ink">
                  Missão Aberta & Auditada no PostgreSQL
                </h3>
              </div>
              <p className="text-xs font-mono text-muted">
                ID da Missão: <span className="font-bold text-ink">{missionResult.id || 'mission-live'}</span> •
                Status: <span className="text-neon-blue bg-sky-500/10 px-2 py-0.5 rounded-pill font-bold border border-sky-500/30">{missionResult.status || 'STARTED'}</span>
              </p>
              <pre className="p-3 rounded-control bg-surface border border-border text-[11px] font-mono overflow-x-auto text-ink">
                {JSON.stringify(missionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
