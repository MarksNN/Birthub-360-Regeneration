import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Mail, 
  Phone 
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-iris">
            Decisores & Contatos Comerciais
          </h2>
          <p className="text-xs text-muted">Stakeholders de compras, executivos e influenciadores</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar contato ou empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-iris w-64"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-neon-cta flex items-center space-x-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      <div className="card-neon overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
            <tr>
              <th className="p-4">Nome do Decisor</th>
              <th className="p-4">Cargo / Função</th>
              <th className="p-4">Empresa Associada</th>
              <th className="p-4">Canais de Contato</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredContacts.length > 0 ? (
              filteredContacts.map(c => (
                <tr key={c.id} className="hover:bg-surface2/50 transition-colors">
                  <td className="p-4 font-semibold text-neon-iris">{c.name}</td>
                  <td className="p-4 text-ink">{c.roleTitle || 'Não especificado'}</td>
                  <td className="p-4 text-neon-blue font-medium">{c.company?.name || 'Sem vínculo'}</td>
                  <td className="p-4 text-muted font-mono">
                    <div>{c.email || '-'}</div>
                    <div className="text-[11px] text-muted">{c.phone || '-'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-pill bg-neon-success/10 text-neon-success border border-neon-success/30 text-[10px] font-mono font-semibold">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
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
                <td colSpan={6} className="p-8 text-center text-muted">
                  Nenhum contato cadastrado com os critérios de busca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-neon-iris/40 rounded-card p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display font-bold text-lg neon-title-iris mb-4">
              Novo Contato Decisor
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Empresa</label>
                <select
                  value={form.companyId}
                  onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                >
                  <option value="">Selecione uma empresa...</option>
                  {companies.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Cargo / Título</label>
                <input
                  type="text"
                  placeholder="Ex: Diretor de TI, Head de Compras"
                  value={form.roleTitle}
                  onChange={e => setForm({ ...form, roleTitle: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                />
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
                  {loading ? 'Salvando...' : 'Salvar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
