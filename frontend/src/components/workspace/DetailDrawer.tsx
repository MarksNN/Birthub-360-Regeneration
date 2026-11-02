import React from 'react';
import {
  X,
  Building2,
  DollarSign,
  TrendingUp,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onAction?: (action: string, payload?: any) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onAction
}) => {
  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-workspace-card border-l border-workspace-soft shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--border-soft)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header do Drawer */}
          <div className="flex items-center justify-between pb-4 border-b border-workspace-soft">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-workspace-secondary font-semibold">
                Detalhes do Registro
              </span>
              <h2 className="font-display font-bold text-lg neon-title-brand mt-0.5">
                {item.title || item.name || 'Entidade Comercial'}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar gaveta de detalhes"
              className="p-1.5 rounded-full hover:bg-workspace-surface text-workspace-secondary hover:text-workspace-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dados e Métricas Principais */}
          <div className="space-y-4">
            {item.amount !== undefined && (
              <div className="p-4 rounded-card bg-workspace-surface border border-workspace-soft">
                <span className="text-[10px] uppercase font-mono text-workspace-secondary block">
                  Valor Estimado da Oportunidade
                </span>
                <span className="font-display font-black text-2xl text-workspace-primary mt-1 block">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    item.amount
                  )}
                </span>
              </div>
            )}

            {item.stage && (
              <div className="flex items-center justify-between p-3 rounded-card bg-workspace-surface border border-workspace-soft text-xs font-mono">
                <span className="text-workspace-secondary">Estágio Atual:</span>
                <span className="font-bold px-2.5 py-1 rounded-pill bg-[#343735] text-white">
                  {item.stage}
                </span>
              </div>
            )}

            {item.company?.name && (
              <div className="p-3 rounded-card bg-workspace-surface border border-workspace-soft text-xs font-mono space-y-1">
                <span className="text-workspace-secondary">Empresa Vinculada:</span>
                <span className="font-bold text-workspace-primary block text-sm">
                  {item.company.name}
                </span>
              </div>
            )}

            {item.agentName && (
              <div className="p-3 rounded-card bg-[#E5FF45]/20 border border-[#E5FF45]/50 text-xs font-mono space-y-1">
                <span className="text-[#343735] font-bold">Agente Inteligente Alocado:</span>
                <span className="font-black text-[#343735] block text-sm">
                  {item.agentName}
                </span>
              </div>
            )}

            <div className="p-4 rounded-control bg-workspace-surface border border-workspace-soft text-xs font-mono space-y-2">
              <span className="text-workspace-secondary font-bold uppercase block text-[10px]">
                Governança & Rastreabilidade RLS:
              </span>
              <p className="text-workspace-secondary leading-relaxed">
                Este registro está seguro e isolado pelo organizationId do tenant ativo no PostgreSQL. Nenhuma alteração manual sem auditoria é permitida.
              </p>
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="pt-6 border-t border-workspace-soft flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-pill text-xs font-mono text-workspace-secondary hover:text-workspace-primary border border-workspace-soft"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              if (onAction) onAction('INSPECT', item);
              onClose();
            }}
            className="px-5 py-2 rounded-pill bg-[#343735] hover:bg-black text-[#E5FF45] font-bold text-xs font-mono shadow-md flex items-center space-x-2"
          >
            <span>Ver no Funil</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
