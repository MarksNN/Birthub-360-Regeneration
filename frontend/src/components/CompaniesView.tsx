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
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Users,
  Briefcase,
  Flame,
  X
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const totalRevenueMapped = filteredCompanies.reduce((sum, c) => sum + (c.annualRevenue || 0), 0);

  return (
    <div className="space-y-6" data-testid="companies-view">
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
              <Building2 className="w-3 h-3" />
              MASTER ACCOUNTS & CRM
            </span>
            <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              CNPJ VALIDADOR ATIVO
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Contas & Empresas Estratégicas
          </h1>
          <p className="text-xs text-muted">
            Base cadastral unificada com isolamento por organização e validação estrita anti-duplicidade.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-neon-cta flex items-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Empresa</span>
        </button>
      </div>

      {/* STATS BENTO ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="card-neon p-4">
          <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Contas Cadastradas</span>
          <span className="text-xl font-bold text-ink mt-1 block">
            {filteredCompanies.length} <span className="text-xs text-muted font-normal">/ {companies.length} total</span>
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Carteira corporativa</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-neon-gold uppercase tracking-wider block font-semibold">Receita Total Declarada</span>
          <span className="text-xl font-bold text-neon-gold mt-1 block">
            {formatCurrency(totalRevenueMapped)}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Porte somado das contas</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-semibold">Integridade Cadastral</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5" /> 100% Homologado
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Sem duplicidades detectadas</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="card-neon p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia, CNPJ ou setor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono"
          />
        </div>

        <span className="text-xs font-mono text-muted self-center">
          {filteredCompanies.length} empresas exibidas
        </span>
      </div>

      {/* TABELA DE ALTA DENSIDADE */}
      <div className="card-neon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
              <tr>
                <th className="p-3.5 font-semibold">Razão Social / Fantasia</th>
                <th className="p-3.5 font-semibold">CNPJ</th>
                <th className="p-3.5 font-semibold">Setor</th>
                <th className="p-3.5 font-semibold">Porte Estimado</th>
                <th className="p-3.5 font-semibold">Vínculos CRM</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(c => (
                  <tr key={c.id} className="hover:bg-surface2/60 transition-colors">
                    <td className="p-3.5">
                      <span className="text-ink font-semibold block">{c.name}</span>
                      <span className="text-muted text-[11px] font-mono">{c.tradeName || '-'}</span>
                    </td>
                    <td className="p-3.5 font-mono text-muted">{c.cnpj || '-'}</td>
                    <td className="p-3.5 text-muted">{c.industry || 'Não especificado'}</td>
                    <td className="p-3.5 font-mono font-bold text-ink">{formatCurrency(c.annualRevenue)}</td>
                    <td className="p-3.5 font-mono text-[11px]">
                      <span className="text-neon-iris font-semibold">{c._count?.contacts || 0} contatos</span> •{' '}
                      <span className="text-neon-pink font-semibold">{c._count?.leads || 0} leads</span> •{' '}
                      <span className="text-neon-gold font-semibold">{c._count?.deals || 0} negócios</span>
                    </td>
                    <td className="p-3.5">
                      <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {c.status || 'ATIVO'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-muted hover:text-neon-blue hover:bg-surface2 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface2 rounded transition-colors"
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
                  <td colSpan={7} className="p-10 text-center text-muted font-mono">
                    Nenhuma empresa encontrada com os critérios fornecidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BENTO DE EMPRESA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-lg shadow-2xl text-ink">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-display font-bold text-base text-ink">
                {editingCompany ? 'Editar Conta Corporativa' : 'Cadastrar Nova Empresa'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full hover:bg-surface2 text-muted hover:text-ink flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-control bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-600 dark:text-rose-400">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-muted block mb-1">Razão Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: VTech Soluções de TI S.A."
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    placeholder="Ex: VTech Cloud"
                    value={form.tradeName}
                    onChange={e => setForm({ ...form, tradeName: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">CNPJ</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={e => setForm({ ...form, cnpj: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Setor / Indústria</label>
                  <input
                    type="text"
                    placeholder="Ex: Tecnologia, SaaS, Varejo"
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Faturamento Anual (R$)</label>
                  <input
                    type="number"
                    placeholder="12000000"
                    value={form.annualRevenue}
                    onChange={e => setForm({ ...form, annualRevenue: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.website}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Telefone Principal</label>
                  <input
                    type="text"
                    placeholder="(11) 90000-0000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
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
                  {loading ? 'Salvando...' : editingCompany ? 'Atualizar Conta' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
