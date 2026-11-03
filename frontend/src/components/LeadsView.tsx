import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Building2,
  Target,
  Sparkles,
  TrendingUp,
  DollarSign,
  X,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

interface LeadsViewProps {
  leads: any[];
  companies: any[];
  contacts: any[];
  assignees: any[];
  onRefresh: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  companies,
  contacts,
  assignees,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [form, setForm] = useState({
    title: '',
    companyId: '',
    contactId: '',
    assignedToId: '',
    source: '',
    score: 60,
    estimatedValue: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const filteredLeads = leads.filter(l => {
    const matchSearch = !searchTerm.trim() ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.source && l.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.company && l.company.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.contact && l.contact.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setLoading(true);

    try {
      const res = await api.createLead({
        ...form,
        score: Number(form.score),
        companyId: form.companyId || undefined,
        contactId: form.contactId || undefined,
        assignedToId: form.assignedToId || undefined,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined
      });
      if (res.success) {
        setShowModal(false);
        setForm({
          title: '',
          companyId: '',
          contactId: '',
          assignedToId: '',
          source: '',
          score: 60,
          estimatedValue: '',
          notes: ''
        });
        onRefresh();
      } else {
        alert(res.error || 'Erro ao registrar lead');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deseja excluir o lead "${title}"?`)) return;
    try {
      const res = await api.deleteLead(id);
      if (res.success) onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const totalEstimated = filteredLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const avgScore = filteredLeads.length > 0 
    ? Math.round(filteredLeads.reduce((sum, l) => sum + l.score, 0) / filteredLeads.length) 
    : 0;
  const hotLeadsCount = filteredLeads.filter(l => l.score >= 75).length;

  return (
    <div className="space-y-6" data-testid="leads-view">
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-rose-500/10 text-neon-pink border border-rose-500/30">
              <Flame className="w-3 h-3" />
              ICP SCORING & PROSPECTING
            </span>
            <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
              PREDITIVO
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Leads & Inteligência de Prospecção
          </h1>
          <p className="text-xs text-muted">
            Priorização automática por fit comercial ICP e cadências de abordagem ativa.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-neon-cta flex items-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Novo Lead</span>
        </button>
      </div>

      {/* 3 BENTO CARDS DE STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="card-neon p-4">
          <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Leads Filtrados</span>
          <span className="text-xl font-bold text-ink mt-1 block">
            {filteredLeads.length} <span className="text-xs text-muted font-normal">/ {leads.length} total</span>
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Pipeline em cadência</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-neon-gold uppercase tracking-wider block font-semibold">Score ICP Médio</span>
          <span className="text-xl font-bold text-neon-gold mt-1 block">
            {avgScore} / 100
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold block">
            {hotLeadsCount} leads quentes (Score ≥ 75)
          </span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-neon-blue uppercase tracking-wider block font-semibold">Volume Estimado Total</span>
          <span className="text-xl font-bold text-ink mt-1 block">
            {formatCurrency(totalEstimated)}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Potencial financeiro mapeado</span>
        </div>
      </div>

      {/* TOOLBAR DE BUSCA E FILTROS */}
      <div className="card-neon p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar lead, empresa, contato ou origem..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-pink font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-surface2 border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
            >
              <option value="ALL">Todos os Status</option>
              <option value="NOVO">Novo</option>
              <option value="EM_QUALIFICACAO">Em Qualificação</option>
              <option value="QUALIFICADO">Qualificado</option>
              <option value="DESQUALIFICADO">Desqualificado</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-muted self-center">
          {filteredLeads.length} leads no radar
        </span>
      </div>

      {/* TABELA DE ALTA DENSIDADE */}
      <div className="card-neon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
              <tr>
                <th className="p-3.5 font-semibold">Título do Lead</th>
                <th className="p-3.5 font-semibold">Empresa / Contato</th>
                <th className="p-3.5 font-semibold">Responsável</th>
                <th className="p-3.5 font-semibold">ICP Score</th>
                <th className="p-3.5 font-semibold">Valor Estimado</th>
                <th className="p-3.5 font-semibold">Status Cadência</th>
                <th className="p-3.5 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.length > 0 ? (
                filteredLeads.map(lead => {
                  const scoreColor = lead.score >= 75 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : lead.score >= 50 
                    ? 'text-neon-gold' 
                    : 'text-neon-blue';

                  const barBg = lead.score >= 75 
                    ? 'bg-emerald-500' 
                    : lead.score >= 50 
                    ? 'bg-amber-500' 
                    : 'bg-sky-500';

                  return (
                    <tr key={lead.id} className="hover:bg-surface2/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-semibold text-ink block">{lead.title}</span>
                        <span className="text-[11px] text-muted font-mono">{lead.source || 'Origem Orgânica'}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="text-ink font-medium flex items-center gap-1 font-mono">
                          <Building2 className="w-3 h-3 text-neon-blue" />
                          <span>{lead.company?.name || 'Sem empresa vinculada'}</span>
                        </div>
                        <div className="text-[11px] text-muted">{lead.contact?.name || 'Sem decisor mapeado'}</div>
                      </td>
                      <td className="p-3.5 text-ink font-mono">
                        {lead.assignedTo?.name || 'Não alocado'}
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold w-12 ${scoreColor}`}>{lead.score}/100</span>
                          <div className="w-16 bg-surface h-1.5 rounded-full overflow-hidden border border-border/50">
                            <div
                              className={`h-full rounded-full ${barBg}`}
                              style={{ width: `${lead.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-ink">
                        {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : 'Sob Análise'}
                      </td>
                      <td className="p-3.5">
                        <span className="badge-telemetry bg-surface text-ink border border-border">
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDelete(lead.id, lead.title)}
                          className="p-1.5 text-muted hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                          title="Remover Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-muted font-mono">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NOVO LEAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl text-ink">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-display font-bold text-base text-ink">
                Registrar Novo Lead Qualificado
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full hover:bg-surface2 text-muted hover:text-ink flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-muted block mb-1">Título do Lead *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Expansão de Licenças VTech"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-neon-pink font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Empresa</label>
                  <select
                    value={form.companyId}
                    onChange={e => setForm({ ...form, companyId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  >
                    <option value="">Selecione...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Contato</label>
                  <select
                    value={form.contactId}
                    onChange={e => setForm({ ...form, contactId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  >
                    <option value="">Selecione...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">ICP Score (0 a 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.score}
                    onChange={e => setForm({ ...form, score: Number(e.target.value) })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={form.estimatedValue}
                    onChange={e => setForm({ ...form, estimatedValue: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Origem do Lead</label>
                  <input
                    type="text"
                    placeholder="Ex: Inbound, Outbound"
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Responsável Comercial</label>
                  <select
                    value={form.assignedToId}
                    onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  >
                    <option value="">Atribuir a mim...</option>
                    {assignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-control text-xs font-mono text-muted hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-neon-cta text-xs shadow-md disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
