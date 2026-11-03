import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  History,
  X,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  ArrowRight,
  User,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Filter
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
    { id: 'PROSPECT', label: 'Prospecção', color: 'border-slate-300 dark:border-slate-700', badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400', defaultProb: 20 },
    { id: 'QUALIFICACAO', label: 'Qualificação', color: 'border-sky-500', badgeColor: 'bg-sky-500/10 text-neon-blue', defaultProb: 40 },
    { id: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: 'border-purple-500', badgeColor: 'bg-purple-500/10 text-neon-iris', defaultProb: 60 },
    { id: 'NEGOCIACAO', label: 'Negociação', color: 'border-amber-500', badgeColor: 'bg-amber-500/10 text-neon-gold', defaultProb: 80 },
    { id: 'FECHADO_GANHO', label: 'Fechado Ganho', color: 'border-emerald-500', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', defaultProb: 100 },
    { id: 'FECHADO_PERDIDO', label: 'Fechado Perdido', color: 'border-rose-500', badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', defaultProb: 0 }
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

  const moveDealToStage = async (dealId: string, targetStage: string) => {
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

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;
    await moveDealToStage(dealId, targetStage);
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

  const totalPipelineAmount = filteredDeals.reduce((sum, d) => sum + (d.stage !== 'FECHADO_PERDIDO' ? d.amount : 0), 0);
  const weightedPipelineAmount = filteredDeals.reduce((sum, d) => sum + (d.stage !== 'FECHADO_PERDIDO' ? d.amount * (d.probability / 100) : 0), 0);

  return (
    <div className="space-y-6" data-testid="pipeline-kanban-view">
      {/* HEADER DE COMANDO DO PIPELINE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-amber-500/10 text-neon-gold border border-amber-500/30">
              <TrendingUp className="w-3 h-3" />
              KANBAN 360° • FUNIL VISUAL
            </span>
            <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
              DRAG & DROP ATIVO
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Gestão & Cadência de Negócios do Pipeline
          </h1>
          <p className="text-xs text-muted">
            Transições de estágio auditadas pelo Supervisor com recálculo instantâneo de previsão ponderada.
          </p>
        </div>

        {/* Resumo Rápido de Forecast */}
        <div className="flex items-center gap-4 bg-surface p-2 px-4 rounded-card border border-border text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted block uppercase">Volume Ativo</span>
            <span className="font-bold text-ink text-sm">{formatCurrency(totalPipelineAmount)}</span>
          </div>
          <div className="w-[1px] h-6 bg-border"></div>
          <div>
            <span className="text-[10px] text-neon-gold block uppercase font-semibold">Forecast Ponderado</span>
            <span className="font-bold text-neon-gold text-sm">{formatCurrency(weightedPipelineAmount)}</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS & AÇÃO RÁPIDA */}
      <div className="card-neon p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por oportunidade ou empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-control pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="bg-surface2 border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
            >
              <option value="ALL">Todos os Responsáveis ({assignees.length})</option>
              {assignees.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          data-testid="new-deal-btn"
          className="btn-neon-cta flex items-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Oportunidade</span>
        </button>
      </div>

      {/* GRID KANBAN DE 6 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
        {stages.map(st => {
          const colDeals = filteredDeals.filter(d => d.stage === st.id);
          const colTotal = colDeals.reduce((sum, d) => sum + d.amount, 0);
          const colWeighted = colDeals.reduce((sum, d) => sum + (d.amount * (d.probability / 100)), 0);

          return (
            <div
              key={st.id}
              data-testid={`kanban-col-${st.id}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, st.id)}
              className="bg-surface2/50 border border-border/80 rounded-card p-3 min-h-[580px] flex flex-col transition-all hover:border-neon-blue/40"
            >
              {/* Header da Coluna com Métricas do Estágio */}
              <div className="mb-3 pb-2.5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${st.badgeColor.replace('/10', '')}`}></span>
                    <span className="font-display font-bold text-xs text-ink truncate">
                      {st.label}
                    </span>
                  </div>
                  <span className="badge-telemetry bg-surface text-ink border border-border text-[10px]">
                    {colDeals.length}
                  </span>
                </div>
                
                <div className="mt-1.5 flex items-baseline justify-between font-mono">
                  <span className="text-xs font-bold text-ink">
                    {formatCurrency(colTotal)}
                  </span>
                  <span className="text-[10px] text-muted">
                    Pond: {formatCurrency(colWeighted)}
                  </span>
                </div>
              </div>

              {/* Cards de Negócios na Coluna */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                {colDeals.length > 0 ? (
                  colDeals.map(deal => (
                    <div
                      key={deal.id}
                      data-testid={`deal-card-${deal.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className="bg-surface border border-border rounded-control p-3.5 shadow-sm hover:border-neon-blue hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none space-y-2.5 group"
                    >
                      {/* Título & Botão de Histórico */}
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-semibold text-xs text-ink line-clamp-2 leading-snug">
                          {deal.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(deal)}
                          className="text-muted hover:text-neon-blue p-1 rounded-control hover:bg-surface2 transition-colors flex-shrink-0"
                          title="Trilha de auditoria e movimentações"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Empresa Vinculada */}
                      <div className="flex items-center gap-1.5 text-[11px] text-muted truncate font-mono">
                        <Building2 className="w-3 h-3 text-muted shrink-0" />
                        <span className="truncate">{deal.company?.name || 'Cliente Direto'}</span>
                      </div>

                      {/* Rodapé do Card: Valor & Probabilidade */}
                      <div className="pt-2 border-t border-border/70 flex items-center justify-between font-mono">
                        <span className="font-bold text-xs text-ink">
                          {formatCurrency(deal.amount)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-bold ${
                          deal.probability >= 80 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : deal.probability >= 50
                            ? 'bg-amber-500/10 text-neon-gold border border-amber-500/20'
                            : 'bg-sky-500/10 text-neon-blue border border-sky-500/20'
                        }`}>
                          {deal.probability}%
                        </span>
                      </div>

                      {/* Responsável Comercial */}
                      {deal.assignedTo && (
                        <div className="flex items-center justify-between text-[10px] text-muted pt-1">
                          <span className="flex items-center gap-1 truncate font-mono">
                            <User className="w-3 h-3 text-muted" />
                            {deal.assignedTo.name}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1 rounded bg-surface2">
                            {deal.assignedTo.role}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-32 border-2 border-dashed border-border/60 rounded-control flex items-center justify-center text-[11px] font-mono text-muted text-center p-3">
                    Arraste um negócio para cá
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NOVA OPORTUNIDADE (BENTO MODAL) */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-surface rounded-card border border-border shadow-2xl overflow-hidden text-ink">
            <div className="p-5 bg-surface2 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Criar Nova Oportunidade Comercial
                </h3>
                <p className="text-xs text-muted">
                  Preencha os dados estratégicos para alocação no pipeline ativo.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface text-muted hover:text-ink flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-mono text-muted block mb-1">
                  Título da Oportunidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Contrato Anual Enterprise — Expansão LATAM"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="150000"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted block mb-1">
                    Probabilidade (%: {form.probability}%)
                  </label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">
                    Empresa Vinculada
                  </label>
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

                <div>
                  <label className="text-xs font-mono text-muted block mb-1">
                    Responsável Comercial
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  >
                    <option value="">Selecione o Closer/SDR...</option>
                    {assignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">
                    Estágio Inicial
                  </label>
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

                <div>
                  <label className="text-xs font-mono text-muted block mb-1">
                    Fechamento Estimado
                  </label>
                  <input
                    type="date"
                    value={form.expectedClose}
                    onChange={e => setForm({ ...form, expectedClose: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
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

      {/* MODAL: HISTÓRICO DE MOVIMENTAÇÕES (AUDITORIA DO SUPERVISOR) */}
      {showHistoryModal && selectedDealForHistory && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-surface rounded-card border border-border shadow-2xl overflow-hidden text-ink">
            <div className="p-5 bg-surface2 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="badge-telemetry bg-sky-500/10 text-neon-blue border border-sky-500/30">
                    TRILHA DE AUDITORIA
                  </span>
                  <span className="text-xs font-mono text-muted">ID: {selectedDealForHistory.id.slice(0, 8)}</span>
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  {selectedDealForHistory.title}
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface text-muted hover:text-ink flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {loadingHistory ? (
                <div className="py-12 text-center text-xs font-mono text-muted flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                  <span>Recuperando log de transições do banco PostgreSQL...</span>
                </div>
              ) : dealHistoryList.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border">
                  {dealHistoryList.map((hist, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 text-xs font-mono">
                      <div className="w-7 h-7 rounded-full bg-surface border-2 border-neon-blue flex items-center justify-center text-neon-blue shrink-0 z-10 shadow-xs">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-3.5 bg-surface2 rounded-control border border-border flex-1 space-y-1">
                        <div className="flex items-center justify-between text-muted text-[11px]">
                          <span>{new Date(hist.createdAt).toLocaleString('pt-BR')}</span>
                          <span className="font-semibold text-ink">{hist.user?.name || 'Supervisor Autônomo'}</span>
                        </div>
                        <div className="text-ink font-semibold flex items-center gap-2 pt-1">
                          <span className="text-muted">{hist.oldStage || 'Início'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-neon-blue" />
                          <span className="text-neon-blue font-bold">{hist.newStage}</span>
                        </div>
                        {hist.lostReason && (
                          <div className="text-rose-600 dark:text-rose-400 text-[11px] pt-1">
                            Motivo da perda: {hist.lostReason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted font-mono">
                  Nenhuma transição registrada para esta oportunidade até o momento.
                </div>
              )}
            </div>

            <div className="p-4 bg-surface2 border-t border-border text-right">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-control bg-surface border border-border text-xs font-mono font-medium hover:bg-surface2"
              >
                Fechar Trilha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
