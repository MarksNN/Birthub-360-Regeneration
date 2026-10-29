import React, { useState } from 'react';
import { Search, CheckCircle2, Clock } from 'lucide-react';

interface AgentsCatalogViewProps {
  agents: any[];
}

export const AgentsCatalogView: React.FC<AgentsCatalogViewProps> = ({ agents }) => {
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('ALL');

  const domains = Array.from(new Set(agents.map(a => a.domain)));

  const filtered = agents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                        a.agentCode.toLowerCase().includes(search.toLowerCase()) ||
                        a.description?.toLowerCase().includes(search.toLowerCase());
    const matchDomain = filterDomain === 'ALL' || a.domain === filterDomain;
    return matchSearch && matchDomain;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-iris">
            Catálogo & Registro de Agentes (Mapeamento 394)
          </h2>
          <p className="text-xs text-muted">
            Governança, escopo (Universal vs Especializado) e ferramentas autorizadas por papel
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar agente por nome ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-surface border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-iris"
            />
          </div>

          <select
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
            className="bg-surface border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none"
          >
            <option value="ALL">Todos os Domínios</option>
            {domains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(agent => (
          <div key={agent.id || agent.agentCode} className="card-neon p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-muted uppercase">
                  {agent.domain} • {agent.subgroup}
                </span>
                <span className={`px-2 py-0.5 rounded-pill text-[10px] font-mono uppercase font-bold ${
                  agent.scope === 'UNIVERSAL' 
                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30' 
                    : 'bg-neon-pink/10 text-neon-pink border border-neon-pink/30'
                }`}>
                  {agent.scope}
                </span>
              </div>

              <h4 className="font-display font-bold text-sm neon-title-cyan">
                {agent.name}
              </h4>
              <span className="font-mono text-[11px] text-muted block">
                {agent.agentCode}
              </span>

              <p className="text-xs text-muted mt-2 line-clamp-2">
                {agent.description || 'Agente mapeado no catálogo de 394 capacidades operacionais.'}
              </p>
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted">Perfil Requerido:</span>
                <span className="text-neon-gold font-semibold">{agent.requiredRole}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted">Status de Execução:</span>
                {agent.isExecutable ? (
                  <span className="text-neon-success flex items-center space-x-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Executável Fase 01</span>
                  </span>
                ) : (
                  <span className="text-muted flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Catálogo & Registro</span>
                  </span>
                )}
              </div>

              {agent.capabilities?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {agent.capabilities.map((c: string) => (
                    <span key={c} className="text-[9px] px-1.5 py-0.5 bg-surface2 rounded text-neon-iris font-mono border border-border">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
