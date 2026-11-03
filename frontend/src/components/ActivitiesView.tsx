import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  Calendar, 
  Mail, 
  Plus, 
  Check, 
  Trash2, 
  AlertCircle,
  Building2,
  User,
  Activity as ActivityIcon,
  Filter,
  X,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';

interface ActivitiesViewProps {
  activities: any[];
  companies: any[];
  contacts: any[];
  deals: any[];
  assignees: any[];
  onRefresh: () => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  activities,
  companies,
  contacts,
  deals,
  assignees,
  onRefresh
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'TAREFA',
    dueDate: '',
    assignedToId: '',
    companyId: '',
    contactId: '',
    dealId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) return;
    setLoading(true);

    try {
      const res = await api.createActivity({
        ...form,
        companyId: form.companyId || undefined,
        contactId: form.contactId || undefined,
        dealId: form.dealId || undefined,
        assignedToId: form.assignedToId || undefined
      });
      if (res.success) {
        setShowModal(false);
        setForm({
          title: '',
          description: '',
          type: 'TAREFA',
          dueDate: '',
          assignedToId: '',
          companyId: '',
          contactId: '',
          dealId: ''
        });
        onRefresh();
      } else {
        alert(res.error || 'Erro ao registrar atividade');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (act: any) => {
    const nextStatus = act.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
    try {
      const res = await api.updateActivityStatus(act.id, nextStatus);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || 'Erro ao atualizar status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta atividade?')) return;
    try {
      const res = await api.deleteActivity(id);
      if (res.success) onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredActivities = activities.filter(a => {
    const matchType = filterType === 'ALL' || a.type === filterType;
    const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchType && matchStatus;
  });

  const now = new Date();
  const totalCount = activities.length;
  const completedCount = activities.filter(a => a.status === 'CONCLUIDA').length;
  const pendingCount = activities.filter(a => a.status === 'PENDENTE').length;
  const overdueCount = activities.filter(a => a.status === 'PENDENTE' && new Date(a.dueDate) < now).length;

  return (
    <div className="space-y-6" data-testid="activities-view">
      {/* HEADER DE COMANDO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-telemetry bg-purple-500/10 text-neon-iris border border-purple-500/30">
              <ActivityIcon className="w-3 h-3" />
              CADÊNCIA & EXECUÇÃO
            </span>
            <span className="badge-telemetry bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              SLA DE ATENDIMENTO
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-ink">
            Atividades & Acompanhamento Comercial
          </h1>
          <p className="text-xs text-muted">
            Gestão de tarefas, ligações, reuniões e cadências com trilha temporal auditável.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-neon-cta flex items-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Atividade</span>
        </button>
      </div>

      {/* 3 BENTO CARDS DE STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="card-neon p-4">
          <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Total de Atividades</span>
          <span className="text-xl font-bold text-ink mt-1 block">
            {totalCount}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">{completedCount} concluídas</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block font-semibold">Pendentes no Prazo</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {pendingCount - overdueCount}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">Cadência regular ativa</span>
        </div>

        <div className="card-neon p-4">
          <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-wider block font-semibold">Atividades Atrasadas</span>
          <span className={`text-xl font-bold mt-1 block ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {overdueCount}
          </span>
          <span className="text-[11px] text-muted mt-0.5 block">
            {overdueCount > 0 ? 'Exigem intervenção imediata' : 'Nenhuma pendência vencida'}
          </span>
        </div>
      </div>

      {/* TOOLBAR DE FILTROS */}
      <div className="card-neon p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-surface2 border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="TAREFA">Tarefas</option>
            <option value="LIGACAO">Ligações</option>
            <option value="REUNIAO">Reuniões</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="EMAIL">E-mails</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface2 border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none font-mono"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="CONCLUIDA">Concluídas</option>
          </select>
        </div>

        <span className="text-xs font-mono text-muted self-center">
          {filteredActivities.length} atividades filtradas
        </span>
      </div>

      {/* TABELA DE ALTA DENSIDADE */}
      <div className="card-neon overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
              <tr>
                <th className="p-3.5 w-12 text-center">Status</th>
                <th className="p-3.5 font-semibold">Atividade / Detalhes</th>
                <th className="p-3.5 font-semibold">Tipo</th>
                <th className="p-3.5 font-semibold">Vínculo Comercial</th>
                <th className="p-3.5 font-semibold">Responsável</th>
                <th className="p-3.5 font-semibold">Vencimento</th>
                <th className="p-3.5 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredActivities.length > 0 ? (
                filteredActivities.map(act => {
                  const isOverdue = act.status === 'PENDENTE' && new Date(act.dueDate) < now;

                  return (
                    <tr key={act.id} className="hover:bg-surface2/60 transition-colors">
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(act)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border ${
                            act.status === 'CONCLUIDA'
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                              : 'border-border text-transparent hover:border-emerald-500 bg-surface'
                          }`}
                          title={act.status === 'CONCLUIDA' ? 'Marcar como pendente' : 'Concluir atividade'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      <td className="p-3.5">
                        <span className={`block font-semibold ${act.status === 'CONCLUIDA' ? 'line-through text-muted' : 'text-ink'}`}>
                          {act.title}
                        </span>
                        {act.description && (
                          <span className="text-muted text-[11px] block mt-0.5 line-clamp-1 font-mono">
                            {act.description}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className="badge-telemetry bg-surface text-ink border border-border">
                          {act.type}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-muted">
                        {act.deal?.title ? (
                          <span className="text-ink font-semibold flex items-center gap-1 truncate">
                            <Briefcase className="w-3.5 h-3.5 text-neon-gold" />
                            {act.deal.title}
                          </span>
                        ) : act.company?.name ? (
                          <span className="text-ink font-semibold flex items-center gap-1 truncate">
                            <Building2 className="w-3.5 h-3.5 text-neon-blue" />
                            {act.company.name}
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-ink font-mono">
                        {act.assignedTo?.name || 'Não alocado'}
                      </td>

                      <td className="p-3.5 font-mono">
                        <span className={`flex items-center space-x-1.5 ${
                          isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-muted'
                        }`}>
                          {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                          <span>{new Date(act.dueDate).toLocaleDateString('pt-BR')}</span>
                          {isOverdue && <span className="text-[10px] uppercase font-bold">(Atrasada)</span>}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDelete(act.id)}
                          className="p-1.5 text-muted hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                          title="Excluir"
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
                    Nenhuma atividade encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVA ATIVIDADE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-2xl text-ink">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-display font-bold text-base text-ink">
                Nova Atividade Comercial
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
                <label className="text-xs font-mono text-muted block mb-1">Título da Atividade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião de alinhamento com diretoria"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none focus:border-neon-blue font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Tipo de Atividade</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  >
                    <option value="TAREFA">Tarefa</option>
                    <option value="LIGACAO">Ligação Registrada</option>
                    <option value="REUNIAO">Reunião Agendada</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="EMAIL">E-mail</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Responsável</label>
                  <select
                    value={form.assignedToId}
                    onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  >
                    <option value="">Selecione...</option>
                    {assignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted block mb-1">Vincular a Negócio</label>
                  <select
                    value={form.dealId}
                    onChange={e => setForm({ ...form, dealId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                  >
                    <option value="">Opcional...</option>
                    {deals.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-muted block mb-1">Descrição / Pauta</label>
                <textarea
                  rows={3}
                  placeholder="Objetivo do contato ou notas preliminares..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3.5 py-2 text-xs text-ink focus:outline-none font-mono resize-none"
                ></textarea>
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
                  {loading ? 'Salvando...' : 'Salvar Atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
