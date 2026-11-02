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
  AlertCircle
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
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-workspace-card rounded-canvas border-2 border-workspace-graphite shadow-2xl overflow-hidden text-workspace-primary"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderRadius: '28px'
        }}
      >
        {/* Header do Painel de Comando */}
        <div className="p-6 bg-[#343735] text-white flex items-center justify-between border-b border-black/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#E5FF45] text-[#343735] flex items-center justify-center font-bold shadow-md">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="supervisor-panel-title" className="font-display font-black text-lg neon-title-cyan">
                  Supervisor 360° — Command Center
                </h2>
                <span className="px-2 py-0.5 rounded-pill bg-[#E5FF45] text-[#343735] text-[10px] font-mono font-black">
                  ORCHESTRATOR
                </span>
              </div>
              <span className="text-xs text-white/70 font-mono">
                Contexto Ativo: <span className="text-[#E5FF45] font-semibold">{supervisorContext}</span> • 394 Agentes Catalogados
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
            <span className="text-[11px] font-mono uppercase tracking-wider text-workspace-secondary font-medium block">
              Missões Rápidas Recomendadas:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(qp)}
                  className="text-left p-3 rounded-control bg-workspace-surface hover:bg-white/80 dark:hover:bg-black/30 border border-workspace-soft text-xs text-workspace-primary transition-all flex items-start space-x-2 group"
                >
                  <Sparkles className="w-4 h-4 text-[#343735] dark:text-[#E5FF45] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
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
                className="w-full p-4 rounded-card bg-workspace-surface border border-workspace-soft focus:border-[#343735] dark:focus:border-[#E5FF45] focus:outline-none text-sm font-mono leading-relaxed resize-none shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('EXECUTE')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-mono font-medium transition-all ${
                    activeTab === 'EXECUTE'
                      ? 'bg-[#343735] text-white shadow-sm'
                      : 'text-workspace-secondary hover:bg-workspace-surface'
                  }`}
                >
                  Consulta Direta
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('MISSION')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-mono font-medium transition-all ${
                    activeTab === 'MISSION'
                      ? 'bg-[#343735] text-white shadow-sm'
                      : 'text-workspace-secondary hover:bg-workspace-surface'
                  }`}
                >
                  Missão Autônoma & Delegação
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="px-4 py-2 rounded-pill text-xs font-mono text-workspace-secondary hover:text-workspace-primary"
                >
                  Limpar
                </button>

                {activeTab === 'EXECUTE' ? (
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    data-testid="supervisor-submit-btn"
                    className="px-5 py-2 rounded-pill bg-[#E5FF45] hover:bg-[#d6f030] text-[#343735] font-bold text-xs font-mono shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#343735] border-t-transparent rounded-full animate-spin"></div>
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
                    className="px-5 py-2 rounded-pill bg-[#343735] hover:bg-black text-[#E5FF45] font-bold text-xs font-mono shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#E5FF45] border-t-transparent rounded-full animate-spin"></div>
                        <span>Delegando...</span>
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

          {/* Resultado de Execução Estruturado e Conectado */}
          {executionResult && (
            <div
              data-testid="supervisor-execution-result"
              className="p-5 rounded-canvas bg-workspace-surface border border-workspace-soft space-y-4 animate-in fade-in duration-300"
              style={{ borderRadius: '24px' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-workspace-soft">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E5FF45] animate-pulse"></span>
                  <h3 className="font-display font-bold text-sm text-workspace-primary">
                    Síntese do Supervisor & Agente Alocado
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-pill bg-[#343735] text-white text-[10px] font-mono">
                  {executionResult.suggestedAgentCode || 'SUPERVISOR_KERNEL'}
                </span>
              </div>

              {/* Grid Conectada de Evidências */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-card bg-workspace-card border border-workspace-soft">
                  <span className="text-[10px] font-mono text-workspace-secondary uppercase block">
                    Agente Responsável
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Bot className="w-4 h-4 text-workspace-graphite" />
                    <span className="font-bold text-xs text-workspace-primary">
                      {executionResult.suggestedAgentName || 'Closer Sales AI'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-card bg-workspace-card border border-workspace-soft">
                  <span className="text-[10px] font-mono text-workspace-secondary uppercase block">
                    Status Operacional
                  </span>
                  <span className="font-mono text-xs font-bold text-workspace-primary mt-1 block">
                    {executionResult.operationalStatus || 'EXECUTABLE'}
                  </span>
                </div>

                <div className="p-3 rounded-card bg-workspace-card border border-workspace-soft">
                  <span className="text-[10px] font-mono text-workspace-secondary uppercase block">
                    Permissão RBAC
                  </span>
                  <span className="font-mono text-xs font-bold text-[#16A34A] mt-1 block">
                    {executionResult.authorizationCheck?.hasPermission ? 'AUTORIZADO' : 'HOMOLOGADO'}
                  </span>
                </div>
              </div>

              {/* Raciocínio & Output do Agente */}
              <div className="p-4 rounded-control bg-workspace-card border border-workspace-soft font-mono text-xs leading-relaxed space-y-2">
                <div className="flex items-center space-x-2 text-workspace-secondary font-bold">
                  <Terminal className="w-4 h-4 text-[#343735] dark:text-[#E5FF45]" />
                  <span>Resultado e Plano de Ação Gerado:</span>
                </div>
                <div className="whitespace-pre-wrap text-workspace-primary">
                  {executionResult.simulatedOutput ||
                    executionResult.humanSynthesis ||
                    JSON.stringify(executionResult, null, 2)}
                </div>
              </div>
            </div>
          )}

          {/* Resultado de Missão Autônoma */}
          {missionResult && (
            <div className="p-5 rounded-canvas bg-workspace-surface border border-workspace-soft space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <h3 className="font-display font-bold text-sm text-workspace-primary">
                  Missão Criada e Registrada no PostgreSQL
                </h3>
              </div>
              <p className="text-xs font-mono text-workspace-secondary">
                ID da Missão: <span className="font-bold text-workspace-primary">{missionResult.id || 'mission-live'}</span> •
                Status: <span className="text-[#E5FF45] bg-[#343735] px-2 py-0.5 rounded-pill font-bold">{missionResult.status || 'STARTED'}</span>
              </p>
              <pre className="p-3 rounded-control bg-workspace-card border border-workspace-soft text-[11px] font-mono overflow-x-auto text-workspace-primary">
                {JSON.stringify(missionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
