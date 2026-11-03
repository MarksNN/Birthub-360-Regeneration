import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Mail, 
  Phone,
  Building2,
  ShieldCheck,
  Briefcase,
  X,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';

interface ContactsViewProps {
  contacts: any[];
  companies: any[];
  onRefresh: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ contacts, companies, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleTitle: '',
    companyId: ''
  });
  const [loading, setLoading] = useState(false);

  const filteredContacts = contacts.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.roleTitle && c.roleTitle.toLowerCase().includes(term)) ||
      (c.company && c.company.name.toLowerCase().includes(term));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);

    try {
      const res = await api.createContact({
        ...form,
        companyId: form.companyId || undefined
      });
      if (res.success) {
        setShowModal(false);
        setForm({ name: '', email: '', phone: '', roleTitle: '', companyId: '' });
        onRefresh();
      } else {
        alert(res.error || 'Erro ao cadastrar contato');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir o contato "${name}"?`)) return;
    try {
      const res = await api.deleteContact(id);
      if (res.success) onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6" data-testid="contacts-view">
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-purple-500/10 text-neon-iris border border-purple-500/30">
              <Users className="w-3 h-3" />
              DECISION MAKERS & STAKEHOLDERS
            </span>
            <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              LGPD COMPLIANT
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Decisores & Contatos Comerciais
          </h1>
          <p className="text-xs text-muted">
            Mapeamento de stakeholders de compras, executivos e influenciadores nas contas corporativas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-neon-cta flex items-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Contato</span>
        </button>
      </div>

      {/* STATS BENTO ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="card-neon p-4">
          <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Decisores Mapeados</span>
          <span className="text-xl font-bold text-ink mt-1 block">
            {filteredContacts.length} <span className="text-xs text-muted font-normal">/ {contacts.length} total</span>
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Contatos de alto nível</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-neon-blue uppercase tracking-wider block font-semibold">Canais de Contato</span>
          <span className="text-xl font-bold text-neon-blue mt-1 block flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> 100% Verificados
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">E-mails e telefones diretos</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-semibold">Contas Cobertas</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {new Set(contacts.map(c => c.companyId).filter(Boolean)).size} Empresas
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Com decisor vinculado</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="card-neon p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar decisor por nome, cargo, e-mail ou empresa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-iris font-mono"
          />
        </div>

        <span className="text-xs font-mono text-muted self-center">
          {filteredContacts.length} decisores listados
        </span>
      </div>

      {/* TABELA DE ALTA DENSIDADE */}
      <div className="card-neon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
              <tr>
                <th className="p-3.5 font-semibold">Nome do Decisor</th>
                <th className="p-3.5 font-semibold">Cargo / Função</th>
                <th className="p-3.5 font-semibold">Empresa Associada</th>
                <th className="p-3.5 font-semibold">Canais de Contato</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(c => (
                  <tr key={c.id} className="hover:bg-surface2/60 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-500/15 text-neon-iris font-mono font-bold text-xs flex items-center justify-center border border-purple-500/30">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-ink">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-muted font-mono">{c.roleTitle || 'Não especificado'}</td>
                    <td className="p-3.5 font-mono text-ink">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-neon-blue" />
                        {c.company?.name || 'Sem vínculo ativo'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-muted">
                      <div className="flex items-center gap-1 text-ink">
                        <Mail className="w-3 h-3 text-muted" />
                        <span>{c.email || '-'}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5">
                          <Phone className="w-3 h-3 text-muted" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {c.status || 'ATIVO'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-muted hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted font-mono">
                    Nenhum contato encontrado com os critérios fornecidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO CONTATO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl text-ink">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-display font-bold text-base text-ink">
                Novo Contato Decisor
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
                <label className="text-xs font-mono text-muted block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silveira"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-neon-iris font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-muted block mb-1">Empresa Associada</label>
                <select
                  value={form.companyId}
                  onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                >
                  <option value="">Selecione uma empresa...</option>
                  {companies.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    placeholder="carlos@empresa.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-muted block mb-1">Cargo / Função Decisória</label>
                <input
                  type="text"
                  placeholder="Ex: Chief Revenue Officer (CRO), VP de Vendas"
                  value={form.roleTitle}
                  onChange={e => setForm({ ...form, roleTitle: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono"
                />
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
                  {loading ? 'Salvando...' : 'Salvar Decisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
