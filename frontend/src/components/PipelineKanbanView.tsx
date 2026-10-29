import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  Clock,
  History,
  X
} from 'lucide-react';
import { api } from '../services/api';

interface PipelineKanbanViewProps {
  deals: any[];
  companies: any[];
  leads: any[];
  assignees: any[];
  onRefresh: () => void;
}

export const PipelineKanbanView: React.FC<PipelineKanbanViewProps> = ({
  deals,
  companies,
  leads,
  assignees,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDealForHistory, setSelectedDealForHistory] = useState<any>(null);
  const [dealHistoryList, setDealHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('ALL');

  const [form, setForm] = useState({
    title: '',
    companyId: '',
    leadId: '',
    assignedToId: '',
    amount: '',
    stage: 'QUALIFICACAO',
    probability: 40,
    expectedClose: ''
  });
  const [loading, setLoading] = useState(false);

  const stages = [
    { id: 'PROSPECT', label: '1. Prospecção', color: 'border-muted', defaultProb: 20 },
    { id: 'QUALIFICACAO', label: '2. Qualificação', color: 'border-neon-blue', defaultProb: 40 },
    { id: 'PROPOSTA_ENVIADA', label: '3. Proposta Enviada', color: 'border-neon-iris', defaultProb: 60 },
    { id: 'NEGOCIACAO', label: '4. Negociação', color: 'border-neon-gold', defaultProb: 80 },
    { id: 'FECHADO_GANHO', label: '5. Fechado Ganho', color: 'border-neon-success', defaultProb: 100 },
    { id: 'FECHADO_PERDIDO', label: '6. Fechado Perdido', color: 'border-neon-danger', defaultProb: 0 }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Drag and Drop Nativo HTML5
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    let lostReason: string | undefined = undefined;
    if (targetStage === 'FECHADO_PERDIDO') {
      const reason = prompt('Qual o principal motivo de perda da oportunidade? (ex: Preço, Concorrente, Projeto Pausado)');
      if (reason) lostReason = reason;
    }

    try {
      const res = await api.updateDealStage(dealId, targetStage, lostReason);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || 'Erro ao movimentar oportunidade');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenHistory = async (deal: any) => {
    setSelectedDealForHistory(deal);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.getDealHistory(deal.id);
      if (res.success) {
        setDealHistoryList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

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
        leadId: form.leadId || undefined,
        assignedToId: form.assignedToId || undefined,
        expectedClose: form.expectedClose || undefined
      });
      if (res.success) {
        setShowModal(false);
        setForm({
          title: '',
          companyId: '',
          leadId: '',
          assignedToId: '',
          amount: '',
          stage: 'QUALIFICACAO',
          probability: 40,
          expectedClose: ''
        });
        onRefresh();
      } else {
        alert(res.error || 'Erro ao registrar negócio');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtragem de Negócios
  const filteredDeals = deals.filter(d => {
    const matchSearch = !searchTerm.trim() || 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.company && d.company.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchAssignee = filterAssignee === 'ALL' || d.assignedToId === filterAssignee;
    return matchSearch && matchAssignee;
  });

  return (
    <div className="space-y-6">
      {/* Header do Funil */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-gold">
            Pipeline Comercial & Funil Visual (Kanban 360°)
          </h2>
          <p className="text-xs text-muted">
            Movimentação de oportunidades via Drag-and-Drop com persistência e histórico de etapas
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar oportunidade..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-surface border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-gold"
            />
          </div>

          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="bg-surface border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none"
          >
            <option value="ALL">Todos os Responsáveis</option>
            {assignees.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="btn-neon-cta flex items-center space-x-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Oportunidade</span>
          </button>
        </div>
      </div>

      {/* Grid de Colunas do Funil */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {stages.map(st => {
          const colDeals = filteredDeals.filter(d => d.stage === st.id);
          const colTotal = colDeals.reduce((sum, d) => sum + d.amount, 0);

          return (
            <div
              key={st.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, st.id)}
              className="bg-surface2/60 border border-border rounded-card p-3 min-h-[500px] flex flex-col transition-colors hover:border-neon-gold/30"
            >
              {/* Header da Coluna */}
              <div className="mb-3 pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-xs text-ink truncate">
                    {st.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-pill bg-surface text-muted">
                    {colDeals.length}
                  </span>
                </div>
                <span className="block text-[11px] font-mono text-neon-gold font-bold mt-1">
                  {formatCurrency(colTotal)}
                </span>
              </div>

              {/* Cards da Coluna */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colDeals.length > 0 ? (
                  colDeals.map(deal => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className="bg-surface border border-border rounded-control p-3 shadow-sm hover:border-neon-blue/40 cursor-grab active:cursor-grabbing transition-all select-none space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-ink block line-clamp-2">
                          {deal.title}
                        </span>
                        <button
                          onClick={() => handleOpenHistory(deal)}
                          className="text-muted hover:text-neon-iris p-0.5"
                          title="Ver histórico de movimentações"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-muted">
                        <span className="text-neon-blue font-medium block truncate">
                          {deal.company?.name || 'Sem empresa'}
                        </span>
                        {deal.assignedTo && (
                          <span className="text-[10px] text-muted block mt-0.5">
                            Resp: <strong className="text-ink">{deal.assignedTo.name}</strong>
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-neon-gold">
                          {formatCurrency(deal.amount)}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface2 text-neon-success font-semibold">
                          {deal.probability}%
                        </span>
                      </div>

                      {deal.lostReason && (
                        <div className="text-[10px] text-neon-danger bg-neon-danger/10 px-2 py-1 rounded">
                          Perda: {deal.lostReason}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-24 border border-dashed border-border rounded-control flex items-center justify-center text-[10px] text-muted">
                    Arraste cards para cá
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Histórico da Oportunidade */}
      {showHistoryModal && selectedDealForHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-neon-iris/40 rounded-card p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-base neon-title-iris">
                  Histórico de Movimentações: {selectedDealForHistory.title}
                </h3>
                <span className="text-xs text-muted font-mono">
                  Auditoria e registro de transições de etapas
                </span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-muted hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3">
              {loadingHistory ? (
                <div className="text-center py-6 text-xs text-muted">Carregando histórico...</div>
              ) : dealHistoryList.length > 0 ? (
                dealHistoryList.map(h => (
                  <div key={h.id} className="p-3 bg-surface2 rounded-control border border-border text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-neon-blue font-semibold">
                        {h.fromStage} → {h.toStage}
                      </span>
                      <span className="text-muted">
                        {new Date(h.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-muted">
                      Movido por: <strong className="text-ink">{h.movedBy?.name || 'Sistema'}</strong>
                    </div>
                    {h.notes && (
                      <div className="text-[11px] text-muted italic">"{h.notes}"</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted">Nenhum histórico registrado para este negócio.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Negócio */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-neon-gold/40 rounded-card p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display font-bold text-lg neon-title-gold mb-4">
              Nova Oportunidade no Funil
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
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Empresa</label>
                  <select
                    value={form.companyId}
                    onChange={e => setForm({ ...form, companyId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-gold"
                  >
                    <option value="">Selecione...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Lead de Origem</label>
                  <select
                    value={form.leadId}
                    onChange={e => setForm({ ...form, leadId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-gold"
                  >
                    <option value="">Selecione...</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
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
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-gold"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Responsável Comercial</label>
                  <select
                    value={form.assignedToId}
                    onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-gold"
                  >
                    <option value="">Selecione...</option>
                    {assignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Etapa Inicial</label>
                  <select
                    value={form.stage}
                    onChange={e => setForm({ ...form, stage: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-gold"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Data Prevista Fechamento</label>
                  <input
                    type="date"
                    value={form.expectedClose}
                    onChange={e => setForm({ ...form, expectedClose: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-gold"
                  />
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
                  {loading ? 'Salvando...' : 'Salvar no Funil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
