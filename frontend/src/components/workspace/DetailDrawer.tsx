import React from 'react';
import {
  X,
  ArrowRight,
  ShieldCheck,
  Bot
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-surface border-l border-border shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header do Drawer */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neon-blue font-bold">
                Dossiê de Entidade • Birthub 360°
              </span>
              <h2 className="font-display font-bold text-lg neon-title-iris mt-0.5">
                {item.title || item.name || 'Entidade Comercial'}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar gaveta de detalhes"
              className="p-1.5 rounded-lg hover:bg-surface2 text-muted hover:text-ink transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dados e Métricas Principais */}
          <div className="space-y-4">
            {item.amount !== undefined && (
              <div className="p-4 rounded-card bg-surface2/70 border border-border">
                <span className="text-[10px] uppercase font-mono text-muted block">
                  Valor Estimado da Oportunidade
                </span>
                <span className="font-mono font-bold text-2xl text-neon-blue mt-1 block tabular-nums">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    item.amount
                  )}
                </span>
              </div>
            )}

            {item.stage && (
              <div className="flex items-center justify-between p-3 rounded-card bg-surface2/70 border border-border text-xs font-mono">
                <span className="text-muted">Estágio Atual:</span>
                <span className="font-bold px-2.5 py-1 rounded-pill bg-neon-blue/15 text-neon-blue border border-neon-blue/30">
                  {item.stage}
                </span>
              </div>
            )}

            {item.company?.name && (
              <div className="p-3 rounded-card bg-surface2/70 border border-border text-xs font-mono space-y-1">
                <span className="text-muted">Empresa Vinculada:</span>
                <span className="font-bold text-ink block text-sm">
                  {item.company.name}
                </span>
              </div>
            )}

            {item.agentName && (
              <div className="p-3 rounded-card bg-neon-iris/10 border border-neon-iris/30 text-xs font-mono space-y-1">
                <span className="text-neon-iris font-bold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Agente Inteligente Alocado:</span>
                </span>
                <span className="font-bold text-ink block text-sm">
                  {item.agentName}
                </span>
              </div>
            )}

            <div className="p-4 rounded-card bg-surface2/50 border border-border text-xs font-mono space-y-2">
              <span className="text-emerald-500 font-bold uppercase flex items-center gap-1.5 text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Governança & Rastreabilidade RLS</span>
              </span>
              <p className="text-muted leading-relaxed text-[11px]">
                Este registro está isolado pelo <code className="text-ink">organizationId</code> do tenant ativo no PostgreSQL. Nenhuma alteração sem trilha de auditoria é permitida.
              </p>
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="pt-6 border-t border-border flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-control text-xs font-mono text-muted hover:text-ink border border-border"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              if (onAction) onAction('INSPECT', item);
              onClose();
            }}
            className="btn-neon-cta text-xs flex items-center space-x-2"
          >
            <span>Ver no Funil</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
