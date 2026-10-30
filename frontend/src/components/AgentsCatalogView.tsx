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
  Sparkles
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
        <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono uppercase font-bold bg-neon-success/10 text-neon-success border border-neon-success/30 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>EXECUTABLE</span>
        </span>
      );
    }
    if (status === 'AVAILABLE') {
      return (
        <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono uppercase font-bold bg-neon-blue/10 text-neon-blue border border-neon-blue/30 flex items-center space-x-1">
          <Layers className="w-3 h-3" />
          <span>AVAILABLE</span>
        </span>
      );
    }
    if (status === 'DISABLED') {
      return (
        <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono uppercase font-bold bg-neon-danger/10 text-neon-danger border border-neon-danger/30 flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>DISABLED</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono uppercase font-bold bg-surface2 text-muted border border-border flex items-center space-x-1">
        <Clock className="w-3 h-3" />
        <span>REGISTERED</span>
      </span>
    );
  };

  return (
    <div className="space-y-6" data-testid="agents-catalog-view">
      {/* Header & Resumo Estatístico dos 394 Agentes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-iris">
            Catálogo Oficial & Governança dos {counts.total} Agentes
          </h2>
          <p className="text-xs text-muted">
            Mapeamento integral fiel (379 normalizados + 15 célula comercial) com separação entre REGISTERED, AVAILABLE, EXECUTABLE e DISABLED
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="px-3 py-2 rounded-control bg-surface border border-border">
            <span className="text-muted block text-[10px]">TOTAL OFICIAL</span>
            <span data-testid="catalog-total-count" className="text-sm font-bold neon-title-brand">
              {counts.total}
            </span>
          </div>
          <div className="px-3 py-2 rounded-control bg-surface border border-neon-success/30">
            <span className="text-muted block text-[10px]">EXECUTABLE</span>
            <span data-testid="catalog-executable-count" className="text-sm font-bold text-neon-success">
              {counts.executable}
            </span>
          </div>
          <div className="px-3 py-2 rounded-control bg-surface border border-neon-blue/30">
            <span className="text-muted block text-[10px]">AVAILABLE</span>
            <span data-testid="catalog-available-count" className="text-sm font-bold text-neon-blue">
              {counts.available}
            </span>
          </div>
          <div className="px-3 py-2 rounded-control bg-surface border border-border">
            <span className="text-muted block text-[10px]">REGISTERED</span>
            <span data-testid="catalog-registered-count" className="text-sm font-bold neon-title-gold">
              {counts.registered}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="card-neon p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            data-testid="agents-search-input"
            placeholder="Pesquisar nos 394 agentes por nome, código, função, domínio ou capacidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-control pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-neon-iris"
          />
        </div>

        <select
          data-testid="agents-domain-filter"
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          className="bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none"
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
          className="bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none"
        >
          <option value="ALL">Todos os Status Operacionais</option>
          <option value="EXECUTABLE">EXECUTABLE ({counts.executable})</option>
          <option value="AVAILABLE">AVAILABLE ({counts.available})</option>
          <option value="REGISTERED">REGISTERED ({counts.registered})</option>
          <option value="DISABLED">DISABLED ({counts.disabled})</option>
        </select>

        <select
          data-testid="agents-scope-filter"
          value={filterScope}
          onChange={(e) => setFilterScope(e.target.value)}
          className="bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none"
        >
          <option value="ALL">Todos os Escopos</option>
          <option value="SPECIALIZED">SPECIALIZED</option>
          <option value="UNIVERSAL">UNIVERSAL</option>
        </select>
      </div>

      {/* Contador de Exibição */}
      <div className="flex items-center justify-between text-xs font-mono text-muted px-1">
        <span>
          Exibindo <strong>{filtered.length}</strong> de <strong>{counts.total}</strong> agentes catalogados
        </span>
        {meta?.sourceSnapshot && <span>Snapshot: {meta.sourceSnapshot.slice(0, 10)}</span>}
      </div>

      {/* Grid de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => {
          const isExec = agent.operationalStatus === 'EXECUTABLE' && agent.isExecutable;
          const feedback = execFeedback[agent.agentCode];

          return (
            <div
              key={agent.agentCode}
              data-testid={`agent-card-${agent.agentCode}`}
              className="card-neon p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] text-muted uppercase truncate">
                    {agent.domain} • {agent.subgroup}
                  </span>
                  {renderStatusBadge(agent.operationalStatus, agent.isExecutable)}
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm neon-title-cyan">
                    {agent.name}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-pill text-[9px] font-mono uppercase font-bold ${
                      agent.scope === 'UNIVERSAL'
                        ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30'
                        : 'bg-neon-pink/10 text-neon-pink border border-neon-pink/30'
                    }`}
                  >
                    {agent.scope}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-mono text-[11px] text-muted">{agent.agentCode}</span>
                  {agent.characterRole && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-surface2 rounded text-neon-gold">
                      {agent.characterRole}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted mt-2 line-clamp-2">
                  {agent.description || agent.mission}
                </p>
              </div>

              <div className="pt-3 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted">Perfil Requerido:</span>
                  <span className="text-neon-gold font-semibold">{agent.requiredRole}</span>
                </div>

                {/* Capacidades Universais e Especializadas */}
                {agent.specializedCapabilities?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono text-muted block mb-1">
                      Capacidades Especializadas ({agent.specializedCapabilities.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {agent.specializedCapabilities.slice(0, 4).map((c: string) => (
                        <span
                          key={c}
                          className="text-[9px] px-1.5 py-0.5 bg-surface2 rounded text-neon-iris font-mono border border-border"
                        >
                          {c}
                        </span>
                      ))}
                      {agent.specializedCapabilities.length > 4 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-surface2 rounded text-muted font-mono">
                          +{agent.specializedCapabilities.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Ferramentas Associadas */}
                {agent.allowedTools?.length > 0 && (
                  <div className="flex items-center space-x-1 text-[10px] font-mono text-muted">
                    <Wrench className="w-3 h-3 text-neon-blue shrink-0" />
                    <span className="truncate">
                      Tools: {agent.allowedTools.slice(0, 3).join(', ')}
                    </span>
                  </div>
                )}

                {/* Ações: Inspecionar Metadados ou Executar (somente se EXECUTABLE) */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    data-testid={`inspect-agent-${agent.agentCode}`}
                    onClick={() => setSelectedAgent(agent)}
                    className="flex-1 py-1.5 px-2.5 rounded-control border border-border bg-surface2 hover:border-neon-blue text-[11px] font-mono text-ink flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Eye className="w-3 h-3 text-neon-blue" />
                    <span>Contrato & Metadados</span>
                  </button>

                  {isExec ? (
                    <button
                      type="button"
                      data-testid={`exec-agent-btn-${agent.agentCode}`}
                      disabled={executingCode === agent.agentCode}
                      onClick={() => handleTestExecute(agent)}
                      className="py-1.5 px-3 rounded-control bg-neon-success/15 border border-neon-success/40 hover:bg-neon-success/25 text-neon-success text-[11px] font-mono font-bold flex items-center space-x-1 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>{executingCode === agent.agentCode ? 'Executando...' : 'Executar'}</span>
                    </button>
                  ) : (
                    <span
                      title="Agente registrado em governança — execução bloqueada até homologação da ferramenta"
                      className="py-1.5 px-2.5 rounded-control bg-surface2/60 border border-border text-muted text-[10px] font-mono cursor-not-allowed"
                    >
                      Somente Registro
                    </span>
                  )}
                </div>

                {feedback && (
                  <div className="p-2 rounded bg-surface2 border border-neon-blue/30 text-[11px] font-mono text-ink">
                    {feedback.simulatedOutput || feedback.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes Completos do Agente */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div data-testid="agent-detail-modal" className="card-neon bg-surface max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-display text-lg font-bold neon-title-brand">
                  {selectedAgent.name}
                </h3>
                <span className="font-mono text-xs text-muted">
                  ID: {selectedAgent.agentCode} • Origem: {selectedAgent.origin} • Versão: {selectedAgent.sourceVersion?.slice(0, 8)}
                </span>
              </div>
              <button
                type="button"
                data-testid="close-agent-modal"
                onClick={() => setSelectedAgent(null)}
                className="px-3 py-1 rounded-control bg-surface2 text-xs font-mono text-muted hover:text-ink"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-surface2 p-3 rounded-control">
              <div>
                <span className="text-muted block">Domínio / Subgrupo:</span>
                <span className="text-ink font-semibold">
                  {selectedAgent.domain} / {selectedAgent.subgroup}
                </span>
              </div>
              <div>
                <span className="text-muted block">Status Operacional:</span>
                <span className="text-neon-blue font-bold">{selectedAgent.operationalStatus}</span>
              </div>
              <div>
                <span className="text-muted block">Escopo & Papel Mínimo:</span>
                <span className="text-neon-gold font-semibold">
                  {selectedAgent.scope} • {selectedAgent.requiredRole}
                </span>
              </div>
              <div>
                <span className="text-muted block">Referência de Prompt/Rota:</span>
                <span className="text-ink truncate block">{selectedAgent.promptRef}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-display font-semibold neon-title-cyan">Missão & Descrição</h4>
              <p className="text-muted">{selectedAgent.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-display font-semibold neon-title-iris mb-1">
                  Capacidades Universais
                </h4>
                <ul className="list-disc list-inside text-muted font-mono space-y-0.5">
                  {(selectedAgent.universalCapabilities || []).map((u: string) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-display font-semibold neon-title-pink mb-1">
                  Capacidades Especializadas
                </h4>
                <ul className="list-disc list-inside text-muted font-mono space-y-0.5">
                  {(selectedAgent.specializedCapabilities || []).map((s: string) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-display font-semibold neon-title-gold mb-1">Entradas Esperadas</h4>
                <ul className="list-disc list-inside text-muted space-y-0.5">
                  {(selectedAgent.inputs || []).map((inp: string) => (
                    <li key={inp}>{inp}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-display font-semibold neon-title-cyan mb-1">Saídas Esperadas</h4>
                <ul className="list-disc list-inside text-muted space-y-0.5">
                  {(selectedAgent.outputs || []).map((out: string) => (
                    <li key={out}>{out}</li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedAgent.dependencies?.length > 0 && (
              <div className="text-xs">
                <h4 className="font-display font-semibold neon-title-iris mb-1">
                  Dependências Documentadas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.dependencies.map((dep: string) => (
                    <span
                      key={dep}
                      className="px-2 py-0.5 bg-surface2 rounded border border-border font-mono text-[11px] text-muted"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
