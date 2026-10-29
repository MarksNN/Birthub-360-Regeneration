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
  Building,
  User,
  Activity as ActivityIcon
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

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold neon-title-pink">
            Atividades & Acompanhamento Comercial
          </h2>
          <p className="text-xs text-muted">
            Tarefas, reuniões, ligações registradas e follow-ups com timeline de execução
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-surface border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none"
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
            className="bg-surface border border-border rounded-control px-3 py-1.5 text-xs text-ink focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="CONCLUIDA">Concluídas</option>
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="btn-neon-cta flex items-center space-x-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Atividade</span>
          </button>
        </div>
      </div>

      {/* Grid de Atividades */}
      <div className="card-neon overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface2 text-muted uppercase font-mono border-b border-border">
            <tr>
              <th className="p-4 w-12 text-center">Status</th>
              <th className="p-4">Atividade / Detalhes</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Vínculo Comercial</th>
              <th className="p-4">Responsável</th>
              <th className="p-4">Data Limite / Vencimento</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredActivities.length > 0 ? (
              filteredActivities.map(act => {
                const isOverdue = act.status === 'PENDENTE' && new Date(act.dueDate) < now;

                return (
                  <tr key={act.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(act)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors border ${
                          act.status === 'CONCLUIDA'
                            ? 'bg-neon-success text-bg border-neon-success'
                            : 'border-border text-transparent hover:border-neon-success'
                        }`}
                        title={act.status === 'CONCLUIDA' ? 'Marcar como pendente' : 'Concluir atividade'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    <td className="p-4 font-medium">
                      <span className={`block font-semibold ${act.status === 'CONCLUIDA' ? 'line-through text-muted' : 'text-ink'}`}>
                        {act.title}
                      </span>
                      {act.description && (
                        <span className="text-muted text-[11px] block mt-0.5 line-clamp-1">
                          {act.description}
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-mono">
                      <span className="px-2 py-0.5 rounded-pill bg-surface text-neon-blue border border-neon-blue/30 text-[10px]">
                        {act.type}
                      </span>
                    </td>

                    <td className="p-4 text-muted font-medium">
                      {act.deal?.title ? (
                        <span className="text-neon-gold block truncate font-semibold">
                          Negócio: {act.deal.title}
                        </span>
                      ) : act.company?.name ? (
                        <span className="text-neon-blue block truncate font-semibold">
                          {act.company.name}
                        </span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>

                    <td className="p-4 text-ink">
                      {act.assignedTo?.name || '-'}
                    </td>

                    <td className="p-4 font-mono">
                      <span className={`flex items-center space-x-1 ${
                        isOverdue ? 'text-neon-danger font-bold' : 'text-muted'
                      }`}>
                        {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{new Date(act.dueDate).toLocaleDateString('pt-BR')}</span>
                        {isOverdue && <span className="text-[10px] uppercase font-bold">(Atrasada)</span>}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(act.id)}
                        className="p-1 text-muted hover:text-neon-danger rounded transition-colors"
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
                <td colSpan={7} className="p-8 text-center text-muted">
                  Nenhuma atividade encontrada com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Atividade */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-neon-pink/40 rounded-card p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-display font-bold text-lg neon-title-pink mb-4">
              Nova Atividade Comercial
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Título da Atividade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião de alinhamento com diretoria"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-pink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Tipo de Atividade</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-pink"
                  >
                    <option value="TAREFA">Tarefa</option>
                    <option value="LIGACAO">Ligação Registrada</option>
                    <option value="REUNIAO">Reunião Agendada</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="EMAIL">E-mail</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-pink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Responsável</label>
                  <select
                    value={form.assignedToId}
                    onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-pink"
                  >
                    <option value="">Selecione...</option>
                    {assignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted block mb-1">Vincular a Negócio</label>
                  <select
                    value={form.dealId}
                    onChange={e => setForm({ ...form, dealId: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-pink"
                  >
                    <option value="">Opcional...</option>
                    {deals.map(d => (
                      <option key={d.id} value={d.id}>{d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted block mb-1">Descrição / Pauta</label>
                <textarea
                  rows={3}
                  placeholder="Objetivo do contato ou notas preliminares..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-surface2 border border-border rounded-control px-3 py-2 text-sm text-ink focus:outline-none focus:border-neon-pink"
                ></textarea>
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
