import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  Building2, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  X,
  Target
} from 'lucide-react';
import { api } from '../services/api';

interface DealsViewProps {
  deals: any[];
  companies: any[];
  leads: any[];
  onRefresh: () => void;
}

export const DealsView: React.FC<DealsViewProps> = ({ deals, companies, leads, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  const [form, setForm] = useState({
    title: '',
    companyId: '',
    leadId: '',
    amount: '',
    stage: 'QUALIFICACAO',
    probability: 50
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setLoading(true);

    try {
      const res = await api.createDeal({
        ...form,
        amount: parseFloat(form.amount),
        probability: Number(form.probability),
        companyId: form.companyId || undefined,
        leadId: form.leadId || undefined
      });
      if (res.success) {
        setShowModal(false);
        setForm({ title: '', companyId: '', leadId: '', amount: '', stage: 'QUALIFICACAO', probability: 50 });
        onRefresh();
      } else {
        alert(res.error || 'Erro ao criar oportunidade');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const stages = [
    { id: 'PROSPECT', label: 'Prospecção' },
    { id: 'QUALIFICACAO', label: 'Qualificação' },
    { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada' },
    { id: 'NEGOCIACAO', label: 'Negociação' },
    { id: 'FECHADO_GANHO', label: 'Fechado Ganho' },
    { id: 'FECHADO_PERDIDO', label: 'Fechado Perdido' }
  ];

  const filteredDeals = deals.filter(deal => {
    const matchSearch = !searchTerm.trim() || 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.company?.name && deal.company.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStage = stageFilter === 'ALL' || deal.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const totalAmount = filteredDeals.reduce((sum, d) => sum + d.amount, 0);
  const wonAmount = filteredDeals.filter(d => d.stage === 'FECHADO_GANHO').reduce((sum, d) => sum + d.amount, 0);
  const weightedAmount = filteredDeals.reduce((sum, d) => sum + (d.stage !== 'FECHADO_PERDIDO' ? d.amount * (d.probability / 100) : 0), 0);

  return (
    <div className="space-y-6" data-testid="deals-view">
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-amber-500/10 text-neon-gold border border-amber-500/30">
              <Briefcase className="w-3 h-3" />
              DEALS & CONTRACTS
            </span>
            <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
              AUDITADO
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Contratos Comerciais & Oportunidades
          </h1>
          <p className="text-xs text-muted">
            Registro unificado de receita em andamento com cálculo de forecast ponderado por probabilidade.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-neon-cta flex items-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Oportunidade</span>
        </button>
      </div>

      {/* 3 BENTO CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="card-neon p-4">
          <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Volume em Exibição</span>
          <span className="text-xl font-bold text-ink mt-1 block">
            {formatCurrency(totalAmount)}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">{filteredDeals.length} oportunidades filtradas</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-neon-gold uppercase tracking-wider block font-semibold">Previsão Ponderada</span>
          <span className="text-xl font-bold text-neon-gold mt-1 block">
            {formatCurrency(weightedAmount)}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Probabilidade matemática</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-semibold">Receita Fechada Ganha</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(wonAmount)}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Contratos assinados</span>
        </div>
      </div>

      {/* TOOLBAR DE BUSCA E FILTROS */}
      <div className="card-neon p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por título ou conta..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="bg-surface2 border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
            >
              <option value="ALL">Todos os Estágios</option>
              {stages.map(st => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-muted self-center">
          {filteredDeals.length} de {deals.length} registros
        </span>
      </div>

      {/* TABELA DE ALTA DENSIDADE */}
      <div className="card-neon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
              <tr>
                <th className="p-3.5 font-semibold">Título do Negócio</th>
                <th className="p-3.5 font-semibold">Conta Associada</th>
                <th className="p-3.5 font-semibold">Valor (ARR / TCV)</th>
                <th className="p-3.5 font-semibold">Probabilidade</th>
                <th className="p-3.5 font-semibold">Estágio do Funil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeals.length > 0 ? (
                filteredDeals.map(deal => (
                  <tr key={deal.id} className="hover:bg-surface2/60 transition-colors">
                    <td className="p-3.5 font-semibold text-ink">
                      {deal.title}
                    </td>
                    <td className="p-3.5 font-mono text-muted">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-neon-blue" />
                        {deal.company?.name || 'Cliente Direto'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-ink">
                      {formatCurrency(deal.amount)}
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink w-8">{deal.probability}%</span>
                        <div className="w-16 bg-surface h-1.5 rounded-full overflow-hidden border border-border/50">
                          <div
                            className={`h-full rounded-full ${
                              deal.probability >= 80 
                                ? 'bg-emerald-500' 
                                : deal.probability >= 50
                                ? 'bg-amber-500' 
                                : 'bg-sky-500'
                            }`}
                            style={{ width: `${deal.probability}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`badge-telemetry ${
                        deal.stage === 'FECHADO_GANHO' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                          : deal.stage === 'FECHADO_PERDIDO'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-neon-gold border border-amber-500/30'
                      }`}>
                        {deal.stage.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-muted font-mono">
                    Nenhum negócio encontrado para os critérios selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NOVO NEGÓCIO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-display font-bold text-base text-ink">
                Novo Contrato / Oportunidade
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
                <label className="text-xs font-mono text-muted block mb-1">Título da Oportunidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Contrato Anual Torre de Controle"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-muted block mb-1">Empresa</label>
                <select
                  value={form.companyId}
                  onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                >
                  <option value="">Selecione uma conta...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="50000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Probabilidade ({form.probability}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.probability}
                    onChange={e => setForm({ ...form, probability: Number(e.target.value) })}
                    className="w-full mt-2 accent-neon-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-muted block mb-1">Estágio Inicial</label>
                <select
                  value={form.stage}
                  onChange={e => setForm({ ...form, stage: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                >
                  {stages.map(st => (
                    <option key={st.id} value={st.id}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
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
                  {loading ? 'Cadastrando...' : 'Confirmar Oportunidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
