import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Building 
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
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return l.title.toLowerCase().includes(term) ||
      (l.source && l.source.toLowerCase().includes(term)) ||
      (l.company && l.company.name.toLowerCase().includes(term)) ||
      (l.contact && l.contact.name.toLowerCase().includes(term));
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-pink">
            Leads & Oportunidades em Prospecção
          </h2>
          <p className="text-xs text-muted">Cadências de prospecção com cálculo de ICP Scoring e responsável</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar lead, empresa ou origem..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-pink w-64"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-neon-cta flex items-center space-x-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Lead</span>
          </button>
        </div>
      </div>

      <div className="card-neon overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
            <tr>
              <th className="p-4">Título do Lead</th>
              <th className="p-4">Empresa / Contato</th>
              <th className="p-4">Responsável</th>
              <th className="p-4">ICP Score</th>
              <th className="p-4">Valor Estimado</th>
              <th className="p-4">Status da Cadência</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeads.length > 0 ? (
              filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-surface2/50 transition-colors">
                  <td className="p-4">
                    <span className="font-semibold text-neon-pink block">{lead.title}</span>
                    <span className="text-[11px] text-muted">{lead.source || 'Origem não informada'}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-neon-blue font-medium">{lead.company?.name || 'Sem empresa'}</div>
                    <div className="text-[11px] text-muted">{lead.contact?.name || 'Sem contato'}</div>
                  </td>
                  <td className="p-4 text-ink font-medium">
                    {lead.assignedTo?.name || '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-neon-gold">{lead.score}/100</span>
                      <div className="w-16 bg-surface2 h-1.5 rounded-full overflow-hidden border border-border">
                        <div
                          className="bg-gradient-to-r from-neon-pink to-neon-gold h-full"
                          style={{ width: `${lead.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-ink">
                    {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '-'}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-pill bg-neon-blue/10 text-neon-blue border border-neon-blue/30 text-[10px] font-mono font-semibold">
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(lead.id, lead.title)}
                      className="p-1.5 text-muted hover:text-neon-danger rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  Nenhum lead encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-neon-pink/40 rounded-card p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display font-bold text-lg neon-title-pink mb-4">
              Registrar Novo Lead
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Título do Lead *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Expansão de Licenças VTech"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Empresa</label>
                  <select
                    value={form.companyId}
                    onChange={e => setForm({ ...form, companyId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  >
                    <option value="">Selecione...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Contato</label>
                  <select
                    value={form.contactId}
                    onChange={e => setForm({ ...form, contactId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
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
                  <label className="text-xs text-muted block mb-1">ICP Score (0 a 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.score}
                    onChange={e => setForm({ ...form, score: Number(e.target.value) })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={form.estimatedValue}
                    onChange={e => setForm({ ...form, estimatedValue: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Origem do Lead</label>
                  <input
                    type="text"
                    placeholder="Ex: Inbound, Indicação"
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Responsável Comercial</label>
                  <select
                    value={form.assignedToId}
                    onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  >
                    <option value="">Atribuir a mim...</option>
                    {assignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-pill bg-surface2 text-xs text-muted hover:text-ink border border-border"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-neon-cta text-xs"
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
