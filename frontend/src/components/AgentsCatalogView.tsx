import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Play,
  Layers,
  Wrench,
  Eye,
  XCircle,
  Sparkles,
  Bot,
  ShieldCheck,
  ChevronRight,
  Terminal,
  Activity,
  Zap,
  Filter,
  X
} from 'lucide-react';
import { api } from '../services/api';

interface AgentsCatalogViewProps {
  agents: any[];
  meta?: any;
  userRole?: string;
  onRefresh?: () => void;
}

export const AgentsCatalogView: React.FC<AgentsCatalogViewProps> = ({
  agents,
  meta,
  userRole = 'SDR',
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterScope, setFilterScope] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [executingCode, setExecutingCode] = useState<string | null>(null);
  const [execFeedback, setExecFeedback] = useState<Record<string, any>>({});

  const domains = useMemo(
    () => Array.from(new Set(agents.map((a) => a.domain))).sort(),
    [agents]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      const matchDomain = filterDomain === 'ALL' || a.domain === filterDomain;
      const matchStatus = filterStatus === 'ALL' || a.operationalStatus === filterStatus;
      const matchScope = filterScope === 'ALL' || a.scope === filterScope;

      if (!matchDomain || !matchStatus || !matchScope) return false;
      if (!q) return true;

      const inName = a.name?.toLowerCase().includes(q);
      const inCode = a.agentCode?.toLowerCase().includes(q);
      const inDesc = a.description?.toLowerCase().includes(q);
      const inMission = a.mission?.toLowerCase().includes(q);
      const inSubgroup = a.subgroup?.toLowerCase().includes(q);
      const inCapabilities = (a.capabilities || []).some((c: string) =>
        c.toLowerCase().includes(q)
      );
      const inTools = (a.allowedTools || []).some((t: string) =>
        t.toLowerCase().includes(q)
      );

      return inName || inCode || inDesc || inMission || inSubgroup || inCapabilities || inTools;
    });
  }, [agents, search, filterDomain, filterStatus, filterScope]);

  const counts = useMemo(() => {
    const total = agents.length;
    const executable = agents.filter((a) => a.operationalStatus === 'EXECUTABLE').length;
    const available = agents.filter((a) => a.operationalStatus === 'AVAILABLE').length;
    const registered = agents.filter((a) => a.operationalStatus === 'REGISTERED').length;
    const disabled = agents.filter((a) => a.operationalStatus === 'DISABLED' || !a.isActive).length;
    return { total, executable, available, registered, disabled };
  }, [agents]);

  const handleTestExecute = async (agent: any) => {
    if (agent.operationalStatus !== 'EXECUTABLE' || !agent.isExecutable) return;
    setExecutingCode(agent.agentCode);
    try {
      const res = await api.orchestrateSupervisor({
        targetModule: 'COPILOT',
        agentCode: agent.agentCode,
        prompt: `Executar diagnóstico operacional autorizado com o agente ${agent.name} (${agent.agentCode})`
      });
      if (res.success) {
        setExecFeedback((prev) => ({ ...prev, [agent.agentCode]: res.data }));
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      setExecFeedback((prev) => ({
        ...prev,
        [agent.agentCode]: { error: err.message }
      }));
    } finally {
      setExecutingCode(null);
    }
  };

  const renderStatusBadge = (status: string, isExecutable: boolean) => {
    if (status === 'EXECUTABLE' && isExecutable) {
      return (
        <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>EXECUTABLE</span>
        </span>
      );
    }
    if (status === 'AVAILABLE') {
      return (
        <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
          <Layers className="w-3 h-3" />
          <span>AVAILABLE</span>
        </span>
      );
    }
    if (status === 'DISABLED') {
      return (
        <span className="badge-telemetry bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3" />
          <span>DISABLED</span>
        </span>
      );
    }
    return (
      <span className="badge-telemetry bg-surface2 text-muted border border-border">
        <Clock className="w-3 h-3" />
        <span>REGISTERED</span>
      </span>
    );
  };

  return (
    <div className="space-y-6" data-testid="agents-catalog-view">
      {/* HEADER DE COMANDO DOS 394 AGENTES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-purple-500/10 text-neon-iris border border-purple-500/30">
              <Bot className="w-3 h-3" />
              SWARM INTELLIGENCE OS
            </span>
            <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" />
              CAPABILITY GATED
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Catálogo & Governança dos 394 Agentes Autônomos
          </h1>
          <p className="text-xs text-muted">
            Matriz completa de agentes especializados com segregação de privilégios, ferramentas e contratos machine-readable.
          </p>
        </div>

        {/* 4 BENTO CARDS DE STATS NO TOPO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-control bg-surface border border-border">
            <span className="text-muted block text-[10px] uppercase font-semibold">Total Oficial</span>
            <span data-testid="catalog-total-count" className="text-base font-bold text-ink">
              {counts.total}
            </span>
          </div>
          <div className="p-2.5 rounded-control bg-surface border border-emerald-500/30">
            <span className="text-muted block text-[10px] uppercase font-semibold">Executáveis</span>
            <span data-testid="catalog-executable-count" className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {counts.executable}
            </span>
          </div>
          <div className="p-2.5 rounded-control bg-surface border border-sky-500/30">
            <span className="text-muted block text-[10px] uppercase font-semibold">Disponíveis</span>
            <span data-testid="catalog-available-count" className="text-base font-bold text-neon-blue">
              {counts.available}
            </span>
          </div>
          <div className="p-2.5 rounded-control bg-surface border border-amber-500/30">
            <span className="text-muted block text-[10px] uppercase font-semibold">Registrados</span>
            <span data-testid="catalog-registered-count" className="text-base font-bold text-neon-gold">
              {counts.registered}
            </span>
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA & FILTROS MULTI-CRITÉRIO */}
      <div className="card-neon p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            data-testid="agents-search-input"
            placeholder="Pesquisar nos 394 agentes por nome, código, função, domínio ou capacidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-control pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-neon-iris font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            data-testid="agents-domain-filter"
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
          >
            <option value="ALL">Todos os Domínios ({domains.length})</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d} ({agents.filter((a) => a.domain === d).length})
              </option>
            ))}
          </select>

          <select
            data-testid="agents-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
          >
            <option value="ALL">Todos os Status</option>
            <option value="EXECUTABLE">EXECUTABLE ({counts.executable})</option>
            <option value="AVAILABLE">AVAILABLE ({counts.available})</option>
            <option value="REGISTERED">REGISTERED ({counts.registered})</option>
            <option value="DISABLED">DISABLED ({counts.disabled})</option>
          </select>

          <select
            data-testid="agents-scope-filter"
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
          >
            <option value="ALL">Todos os Escopos</option>
            <option value="SPECIALIZED">SPECIALIZED</option>
            <option value="UNIVERSAL">UNIVERSAL</option>
          </select>
        </div>
      </div>

      {/* METADADOS DA BUSCA */}
      <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
        <span>
          Filtrados: <strong className="text-ink">{filtered.length}</strong> de <strong className="text-ink">{counts.total}</strong> agentes do ecossistema
        </span>
        {meta?.sourceSnapshot && <span>Snapshot: {meta.sourceSnapshot.slice(0, 10)}</span>}
      </div>

      {/* GRID DE AGENTES (BENTO CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => {
          const isExec = agent.operationalStatus === 'EXECUTABLE' && agent.isExecutable;
          const feedback = execFeedback[agent.agentCode];

          return (
            <div
              key={agent.agentCode}
              data-testid={`agent-card-${agent.agentCode}`}
              className="card-neon p-5 flex flex-col justify-between space-y-3.5 hover:border-purple-500/40 transition-all"
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] text-muted uppercase tracking-wider truncate">
                    {agent.domain} • {agent.subgroup}
                  </span>
                  {renderStatusBadge(agent.operationalStatus, agent.isExecutable)}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-ink truncate">
                    {agent.name}
                  </h3>
                  <span
                    className={`badge-telemetry shrink-0 text-[9px] ${
                      agent.scope === 'UNIVERSAL'
                        ? 'bg-sky-500/10 text-neon-blue border border-sky-500/30'
                        : 'bg-purple-500/10 text-neon-iris border border-purple-500/30'
                    }`}
                  >
                    {agent.scope}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-[11px] text-muted">{agent.agentCode}</span>
                  {agent.characterRole && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface2 rounded text-neon-gold border border-border">
                      {agent.characterRole}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted mt-2.5 line-clamp-2 leading-relaxed">
                  {agent.description || agent.mission}
                </p>
              </div>

              {/* Rodapé do Card com Capacidades & Ações */}
              <div className="pt-3 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted">Perfil Mínimo:</span>
                  <span className="text-ink font-semibold">{agent.requiredRole}</span>
                </div>

                {/* Capacidades */}
                {agent.specializedCapabilities?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono text-muted block mb-1">
                      Capacidades ({agent.specializedCapabilities.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {agent.specializedCapabilities.slice(0, 3).map((c: string) => (
                        <span
                          key={c}
                          className="text-[9px] px-1.5 py-0.5 bg-surface2 rounded text-neon-iris font-mono border border-border"
                        >
                          {c}
                        </span>
                      ))}
                      {agent.specializedCapabilities.length > 3 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-surface2 rounded text-muted font-mono">
                          +{agent.specializedCapabilities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Ferramentas Associadas */}
                {agent.allowedTools?.length > 0 && (
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-muted">
                    <Wrench className="w-3 h-3 text-neon-blue shrink-0" />
                    <span className="truncate">
                      Tools: {agent.allowedTools.slice(0, 3).join(', ')}
                    </span>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    data-testid={`inspect-agent-${agent.agentCode}`}
                    onClick={() => setSelectedAgent(agent)}
                    className="flex-1 py-1.5 px-2.5 rounded-control border border-border bg-surface2 hover:bg-surface text-[11px] font-mono text-ink flex items-center justify-center space-x-1.5 transition-colors font-semibold"
                  >
                    <Eye className="w-3 h-3 text-neon-blue" />
                    <span>Dossiê & Contrato</span>
                  </button>

                  {isExec ? (
                    <button
                      type="button"
                      data-testid={`exec-agent-btn-${agent.agentCode}`}
                      disabled={executingCode === agent.agentCode}
                      onClick={() => handleTestExecute(agent)}
                      className="py-1.5 px-3 rounded-control bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>{executingCode === agent.agentCode ? 'Executando...' : 'Executar'}</span>
                    </button>
                  ) : (
                    <span
                      title="Agente em governança — execução restrita a autorização no supervisor"
                      className="py-1.5 px-2.5 rounded-control bg-surface2/60 border border-border text-muted text-[10px] font-mono cursor-not-allowed"
                    >
                      Em Governança
                    </span>
                  )}
                </div>

                {feedback && (
                  <div className="p-2.5 rounded-control bg-surface2 border border-sky-500/30 text-[11px] font-mono text-ink animate-in fade-in">
                    {feedback.simulatedOutput || feedback.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE DOSSIÊ COMPLETO DO AGENTE */}
      {selectedAgent && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div data-testid="agent-detail-modal" className="card-neon bg-surface max-w-2xl w-full p-6 max-h-[88vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-telemetry bg-purple-500/10 text-neon-iris border border-purple-500/30">
                    CONTRATO MACHINE-READABLE
                  </span>
                  <span className="text-xs font-mono text-muted">{selectedAgent.domain}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-ink">
                  {selectedAgent.name}
                </h3>
                <span className="font-mono text-xs text-muted">
                  Código: {selectedAgent.agentCode} • Origem: {selectedAgent.origin}
                </span>
              </div>
              <button
                type="button"
                data-testid="close-agent-modal"
                onClick={() => setSelectedAgent(null)}
                className="w-8 h-8 rounded-full hover:bg-surface2 text-muted hover:text-ink flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-surface2 p-3.5 rounded-control border border-border">
              <div>
                <span className="text-muted block text-[10px] uppercase">Domínio / Subgrupo:</span>
                <span className="text-ink font-semibold">
                  {selectedAgent.domain} / {selectedAgent.subgroup}
                </span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Status Operacional:</span>
                <span className="text-neon-blue font-bold">{selectedAgent.operationalStatus}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Papel Requerido (RBAC):</span>
                <span className="text-ink font-semibold">{selectedAgent.requiredRole}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px] uppercase">Escopo de Atuação:</span>
                <span className="text-neon-iris font-semibold">{selectedAgent.scope}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1">
                  Missão Estratégica:
                </h4>
                <p className="text-xs text-muted p-3 bg-surface2 rounded-control border border-border leading-relaxed font-mono">
                  {selectedAgent.mission || selectedAgent.description}
                </p>
              </div>

              {selectedAgent.systemPrompt && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1">
                    Prompt Mestre do Agente:
                  </h4>
                  <pre className="text-[11px] font-mono text-ink p-3 bg-surface2 rounded-control border border-border overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                    {selectedAgent.systemPrompt}
                  </pre>
                </div>
              )}

              {selectedAgent.allowedTools?.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1">
                    Ferramentas Conectadas ({selectedAgent.allowedTools.length}):
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.allowedTools.map((t: string) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-surface2 rounded-control border border-border text-[11px] font-mono text-neon-blue flex items-center gap-1"
                      >
                        <Wrench className="w-3 h-3" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-[11px] font-mono text-muted">
                Governança Auditável pelo Supervisor Núcleo
              </span>
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="btn-neon-primary text-xs shadow-xs"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
