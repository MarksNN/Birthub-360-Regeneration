import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../services/api';

interface DealsViewProps {
  deals: any[];
  companies: any[];
  leads: any[];
  onRefresh: () => void;
}

export const DealsView: React.FC<DealsViewProps> = ({ deals, companies, leads, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
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
        alert(res.error || 'Erro ao criar negócio');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const stages = [
    { id: 'PROSPECT', label: 'Prospecção' },
    { id: 'QUALIFICACAO', label: 'Qualificação' },
    { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada' },
    { id: 'NEGOCIACAO', label: 'Negociação' },
    { id: 'FECHADO_GANHO', label: 'Fechado Ganho' },
    { id: 'FECHADO_PERDIDO', label: 'Fechado Perdido' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-gold">
            Pipeline de Negócios & Contratos
          </h2>
          <p className="text-xs text-muted">Gestão de oportunidades comerciais com valor e probabilidade</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-neon-cta flex items-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Negócio</span>
        </button>
      </div>

      <div className="card-neon overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
            <tr>
              <th className="p-4">Título do Negócio</th>
              <th className="p-4">Empresa Associada</th>
              <th className="p-4">Valor (ARR / TCV)</th>
              <th className="p-4">Probabilidade</th>
              <th className="p-4">Etapa do Funil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deals.length > 0 ? (
              deals.map(deal => (
                <tr key={deal.id} className="hover:bg-surface2/50 transition-colors">
                  <td className="p-4 font-semibold text-neon-gold">
                    {deal.title}
                  </td>
                  <td className="p-4 text-neon-blue font-medium">
                    {deal.company?.name || 'Cliente'}
                  </td>
                  <td className="p-4 font-mono font-bold text-ink">
                    {formatCurrency(deal.amount)}
                  </td>
                  <td className="p-4 font-mono">
                    <span className="text-neon-success font-bold">{deal.probability}%</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-pill text-[10px] font-mono font-semibold ${
                      deal.stage === 'FECHADO_GANHO' 
                        ? 'bg-neon-success/10 text-neon-success border border-neon-success/30' 
                        : deal.stage === 'FECHADO_PERDIDO'
                        ? 'bg-neon-danger/10 text-neon-danger border border-neon-danger/30'
                        : 'bg-neon-gold/10 text-neon-gold border border-neon-gold/30'
                    }`}>
                      {deal.stage.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">
                  Nenhum negócio no pipeline. Registre uma oportunidade para acompanhar a receita.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-neon-gold/40 rounded-card p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display font-bold text-lg neon-title-gold mb-4">
              Novo Negócio Comercial
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Título da Oportunidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Contrato Anual Torre de Controle"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
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
                  <option value="">Selecione...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 150000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Probabilidade (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={e => setForm({ ...form, probability: Number(e.target.value) })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Etapa Inicial</label>
                <select
                  value={form.stage}
                  onChange={e => setForm({ ...form, stage: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-blue"
                >
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
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
                  {loading ? 'Salvando...' : 'Salvar Negócio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
