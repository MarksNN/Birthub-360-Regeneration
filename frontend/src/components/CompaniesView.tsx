import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Filter, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

interface CompaniesViewProps {
  companies: any[];
  onRefresh: () => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({ companies, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    tradeName: '',
    cnpj: '',
    industry: '',
    website: '',
    phone: '',
    annualRevenue: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredCompanies = companies.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(term)) ||
      (c.cnpj && c.cnpj.includes(term)) ||
      (c.industry && c.industry.toLowerCase().includes(term));
  });

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setForm({ name: '', tradeName: '', cnpj: '', industry: '', website: '', phone: '', annualRevenue: '' });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleOpenEdit = (comp: any) => {
    setEditingCompany(comp);
    setForm({
      name: comp.name || '',
      tradeName: comp.tradeName || '',
      cnpj: comp.cnpj || '',
      industry: comp.industry || '',
      website: comp.website || '',
      phone: comp.phone || '',
      annualRevenue: comp.annualRevenue ? comp.annualRevenue.toString() : ''
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        ...form,
        annualRevenue: form.annualRevenue ? parseFloat(form.annualRevenue) : null
      };

      let res;
      if (editingCompany) {
        res = await api.updateCompany(editingCompany.id, payload);
      } else {
        res = await api.createCompany(payload);
      }

      if (res.success) {
        setShowModal(false);
        onRefresh();
      } else {
        setErrorMessage(res.error || 'Erro ao salvar empresa');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha na requisição');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a empresa "${name}"? Todas as entidades vinculadas serão afetadas.`)) {
      return;
    }
    try {
      const res = await api.deleteCompany(id);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || 'Erro ao excluir');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header com Busca e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-cyan">
            Contas & Empresas Estratégicas
          </h2>
          <p className="text-xs text-muted">
            Base cadastral com validação estrita de duplicidade de CNPJ e isolamento multi-tenant
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por razão, CNPJ, setor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-blue w-64"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn-neon-cta flex items-center space-x-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Empresa</span>
          </button>
        </div>
      </div>

      {/* Tabela de Empresas */}
      <div className="card-neon overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
            <tr>
              <th className="p-4">Razão Social / Nome Fantasia</th>
              <th className="p-4">CNPJ</th>
              <th className="p-4">Setor / Indústria</th>
              <th className="p-4">Porte (Receita Anual)</th>
              <th className="p-4">Vínculos CRM</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map(c => (
                <tr key={c.id} className="hover:bg-surface2/50 transition-colors">
                  <td className="p-4 font-medium">
                    <span className="text-neon-blue font-semibold block">{c.name}</span>
                    <span className="text-muted text-[11px]">{c.tradeName || '-'}</span>
                  </td>
                  <td className="p-4 font-mono text-ink">{c.cnpj || '-'}</td>
                  <td className="p-4 text-muted">{c.industry || '-'}</td>
                  <td className="p-4 font-mono text-ink">{formatCurrency(c.annualRevenue)}</td>
                  <td className="p-4 font-mono">
                    <span className="text-neon-iris font-semibold">{c._count?.contacts || 0} contatos</span> •{' '}
                    <span className="text-neon-pink font-semibold">{c._count?.leads || 0} leads</span> •{' '}
                    <span className="text-neon-gold font-semibold">{c._count?.deals || 0} negócios</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-pill bg-neon-success/10 text-neon-success border border-neon-success/30 text-[10px] font-mono font-semibold">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-muted hover:text-neon-blue hover:bg-surface rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-muted hover:text-neon-danger hover:bg-surface rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  Nenhuma empresa encontrada com os filtros informados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro / Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-neon-blue/40 rounded-card p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display font-bold text-lg neon-title-cyan mb-4">
              {editingCompany ? 'Editar Conta Empresarial' : 'Nova Conta Empresarial'}
            </h3>

            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-control bg-neon-danger/10 border border-neon-danger/30 text-xs text-neon-danger">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Razão Social *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={form.tradeName}
                  onChange={e => setForm({ ...form, tradeName: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">CNPJ (Com Validação)</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={e => setForm({ ...form, cnpj: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Setor / Mercado</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Telefone Comercial</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Receita Anual Estimada (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 5000000"
                    value={form.annualRevenue}
                    onChange={e => setForm({ ...form, annualRevenue: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Website Oficial</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
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
                  {loading ? 'Processando...' : editingCompany ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
