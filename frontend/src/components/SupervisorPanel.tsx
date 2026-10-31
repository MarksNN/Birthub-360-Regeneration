import React, { useState } from 'react';
import { Bot, Sparkles, ShieldAlert, Cpu, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';
import { SupervisorContextModule } from '../navigation/pillars';

interface SupervisorPanelProps {
  currentModule: string;
  supervisorContext?: SupervisorContextModule;
  pillarLabel?: string;
  onRefreshData?: () => void;
}

export const SupervisorPanel: React.FC<SupervisorPanelProps> = ({
  currentModule,
  supervisorContext,
  pillarLabel,
  onRefreshData
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [missionLoading, setMissionLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [missionResult, setMissionResult] = useState<any>(null);

  const resolveTargetModule = (): SupervisorContextModule => {
    if (supervisorContext) return supervisorContext;
    const moduleMap: Record<string, SupervisorContextModule> = {
      overview: 'HUB',
      companies: 'CRM',
      contacts: 'CRM',
      leads: 'INTELLIGENCE',
      pipeline: 'SALES_ORCHESTRATION',
      revops: 'REAL_TIME_PERFORMANCE',
      weighted_forecast: 'REVENUE_FORECAST',
      agents_catalog: 'COPILOT',
      activities: 'CADENCE'
    };
    return moduleMap[currentModule] || 'CRM';
  };

  const targetModule = resolveTargetModule();

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setExecutionResult(null);

    try {
      const res = await api.orchestrateSupervisor({
        targetModule,
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

  const handleMission = async () => {
    if (!prompt.trim()) return;
    setMissionLoading(true);
    setMissionResult(null);
    try {
      const res = await api.startSupervisorMission({ prompt });
      if (res.success) {
        setMissionResult(res.data);
      } else {
        setMissionResult({ error: res.error || 'Falha ao abrir a missão' });
      }
    } catch (err: any) {
      setMissionResult({ error: err.message || 'Falha de comunicação' });
    } finally {
      setMissionLoading(false);
    }
  };

  const handleDecision = async (decision: 'aprovada' | 'rejeitada') => {
    const mission = missionResult?.mission;
    const approval = mission?.approvals?.find((item: { status: string }) => item.status === 'pendente');
    if (!mission || !approval) return;
    setMissionLoading(true);
    try {
      const res = await api.decideSupervisorMission(mission.id, approval.id, decision);
      if (res.success) setMissionResult(res.data);
      else setMissionResult({ error: res.error || 'Decisão recusada' });
    } catch (err: any) {
      setMissionResult({ error: err.message || 'Falha de comunicação' });
    } finally {
      setMissionLoading(false);
    }
  };

  return (
    <div data-testid="supervisor-panel" className="card-neon p-5 mb-6 border border-neon-iris/30 bg-surface">
      {/* Header do Supervisor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-iris to-neon-blue flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-sm neon-title-iris">
              Supervisor 360° | Orquestrador de Agentes & Capacidades
            </span>
            <span className="block text-xs font-mono text-muted">
              Usuário → Supervisor → Agentes Especializados → Ferramentas → Resultado
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono px-3 py-1 bg-surface2 rounded-pill border border-border">
          <Cpu className="w-3.5 h-3.5 text-neon-blue" />
          <span className="text-muted">Contexto:</span>
          <span data-testid="supervisor-context-badge" className="text-neon-blue uppercase font-semibold">
            {targetModule} ({pillarLabel || currentModule})
          </span>
        </div>
      </div>

      {/* Formulário de Ação */}
      <form onSubmit={handleRun} className="flex gap-2">
        <input
          type="text"
          data-testid="supervisor-prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Solicite ao Supervisor uma operação em ${targetModule} (${currentModule})...`}
          className="flex-1 bg-surface2 border border-border rounded-control px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-neon-blue placeholder-muted/70 transition-colors"
        />
        <button
          type="submit"
          data-testid="supervisor-submit-btn"
          disabled={loading}
          className="btn-neon-cta flex items-center space-x-2 text-xs font-bold disabled:opacity-50"
        >
          {loading ? (
            <span>Orquestrando...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Solicitar ao Supervisor</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="supervisor-mission-btn"
          disabled={missionLoading}
          onClick={handleMission}
          className="px-3 py-1.5 text-[11px] font-mono rounded-control border border-neon-iris/40 text-neon-iris disabled:opacity-50"
        >
          {missionLoading ? 'Abrindo missão...' : 'Abrir missão governada'}
        </button>
        <span className="text-[10px] font-mono text-muted">
          A missão não executa escrita sem aprovação de ADMIN ou MANAGER.
        </span>
      </div>

      {missionResult && (
        <div
          data-testid="supervisor-mission-result"
          className="mt-3 p-3 rounded-card border border-neon-iris/30 bg-surface2/70 space-y-2"
        >
          {missionResult.error ? (
            <p className="text-xs text-neon-danger">{missionResult.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="text-muted">Missão</span>
                <span className="text-neon-iris">{missionResult.mission?.id}</span>
                <span className="px-2 py-0.5 rounded-pill border border-border">{missionResult.mission?.status}</span>
              </div>
              <p className="text-xs text-ink">{missionResult.mission?.objective}</p>
              {missionResult.mission?.finalResult?.limitations?.length > 0 && (
                <p className="text-[11px] text-neon-gold">
                  {missionResult.mission.finalResult.limitations.join(' ')}
                </p>
              )}
              {missionResult.crmCommit?.conflicts?.length > 0 && (
                <p className="text-[11px] text-neon-danger">
                  CRM não gravou: {missionResult.crmCommit.conflicts.join(', ')}
                </p>
              )}
              {missionResult.mission?.status === 'AGUARDANDO_APROVACAO' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision('aprovada')}
                    className="px-2 py-1 text-[11px] rounded-control bg-neon-success/15 text-neon-success"
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('rejeitada')}
                    className="px-2 py-1 text-[11px] rounded-control bg-neon-danger/15 text-neon-danger"
                  >
                    Rejeitar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Resultado da Orquestração */}
      {executionResult && (
        <div
          data-testid="supervisor-execution-result"
          className="mt-4 pt-4 border-t border-border bg-surface2/60 p-4 rounded-card border border-neon-blue/20 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono text-muted flex items-center space-x-2">
              <span>Agente Roteado:</span>
              <span className="text-neon-blue font-semibold">{executionResult.suggestedAgentName}</span>
              <span className="text-muted">({executionResult.suggestedAgentCode})</span>
            </span>

            <div className="flex items-center space-x-2">
              {executionResult.operationalStatus && (
                <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono uppercase font-bold bg-surface border border-border flex items-center space-x-1">
                  {executionResult.operationalStatus === 'EXECUTABLE' ? (
                    <CheckCircle2 className="w-3 h-3 text-neon-success" />
                  ) : (
                    <Clock className="w-3 h-3 text-neon-gold" />
                  )}
                  <span>{executionResult.operationalStatus}</span>
                </span>
              )}

              <span
                className={`px-2.5 py-0.5 rounded-pill text-[10px] font-mono uppercase font-bold flex items-center space-x-1 ${
                  executionResult.authorizationCheck?.hasPermission
                    ? 'bg-neon-success/10 text-neon-success border border-neon-success/30'
                    : 'bg-neon-danger/10 text-neon-danger border border-neon-danger/30'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>
                  {executionResult.authorizationCheck?.hasPermission
                    ? 'Autorizado (RBAC)'
                    : 'Permissão Insuficiente'}
                </span>
              </span>
            </div>
          </div>

          <p className="text-xs text-ink font-interface">{executionResult.simulatedOutput}</p>

          {executionResult.requiredTools?.length > 0 && (
            <div className="flex items-center space-x-2 text-[11px] font-mono text-muted pt-1">
              <span className="text-neon-gold">Ferramentas Associadas:</span>
              <div className="flex flex-wrap gap-1">
                {executionResult.requiredTools.map((t: string) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 bg-surface rounded text-[10px] text-neon-blue border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
