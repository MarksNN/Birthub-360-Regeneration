import React, { useState } from 'react';
import {
  Bot,
  BrainCircuit,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface FlowViewProps {
  onOpenSupervisor?: () => void;
  onOpenNewDeal?: () => void;
}

export const FlowView: React.FC<FlowViewProps> = ({ onOpenSupervisor }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>('supervisor');

  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col items-center justify-center select-none overflow-auto">
      <div className="text-center max-w-xl mb-8">
        <span className="px-3 py-1 rounded-pill bg-neon-iris/15 text-neon-iris border border-neon-iris/30 text-[11px] font-mono font-bold uppercase tracking-wider">
          TOPOLOGIA RELACIONAL 360° • FLUXO DE OPERAÇÕES
        </span>
        <h2 className="font-display text-2xl font-bold neon-title-blue mt-2">
          Arquitetura Conectada de Agentes & Negócios
        </h2>
        <p className="text-xs text-muted font-mono mt-1">
          Rastreabilidade completa de comandos do Supervisor, execução autônoma, sincronização e fechamento auditado.
        </p>
      </div>

      {/* Diagrama de Nós Interconectados */}
      <div className="relative w-full max-w-5xl py-8">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <path
            d="M 220,120 C 350,120 350,60 480,60"
            fill="none"
            stroke="var(--neon-iris)"
            strokeOpacity="0.5"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 220,120 C 350,120 350,180 480,180"
            fill="none"
            stroke="var(--neon-blue)"
            strokeOpacity="0.5"
            strokeWidth="2.5"
          />
          <path
            d="M 720,60 C 800,60 800,120 880,120"
            fill="none"
            stroke="var(--neon-blue)"
            strokeOpacity="0.5"
            strokeWidth="2.5"
          />
          <path
            d="M 720,180 C 800,180 800,120 880,120"
            fill="none"
            stroke="var(--neon-pink)"
            strokeOpacity="0.5"
            strokeWidth="2.5"
          />
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-center">
          {/* Nó 1: Supervisor */}
          <div
            onClick={() => {
              setSelectedNode('supervisor');
              if (onOpenSupervisor) onOpenSupervisor();
            }}
            className={`cursor-pointer rounded-card p-6 border transition-all duration-200 shadow-lg bg-[#0B132B] text-[#F8FAFC] ${
              selectedNode === 'supervisor'
                ? 'border-neon-iris ring-2 ring-neon-iris/40'
                : 'border-slate-800 hover:border-neon-iris/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neon-iris font-bold">
                CORE KERNEL
              </span>
              <div className="w-8 h-8 rounded-lg bg-neon-iris/20 text-neon-iris border border-neon-iris/40 flex items-center justify-center font-bold">
                <BrainCircuit className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg text-[#00D4FF]">Supervisor 360°</h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Planejamento, roteamento e governança de agentes.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Operando</span>
              </span>
              <span className="text-slate-400">394 Agentes</span>
            </div>
          </div>

          {/* Coluna Central: Closer Sales AI e Triggers */}
          <div className="space-y-6">
            <div
              onClick={() => setSelectedNode('closer')}
              className={`cursor-pointer card-neon p-5 border transition-all duration-200 ${
                selectedNode === 'closer'
                  ? 'border-neon-blue ring-2 ring-neon-blue/30'
                  : 'border-border hover:border-neon-blue/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-neon-blue font-bold uppercase tracking-wider">
                  AGENTE ESPECIALISTA
                </span>
                <Bot className="w-4 h-4 text-neon-blue" />
              </div>
              <h4 className="font-display font-bold text-sm neon-title-iris">
                Closer Sales AI
              </h4>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                Geração de propostas e roteiros de contorno de objeção.
              </p>
            </div>

            <div
              onClick={() => setSelectedNode('triggers')}
              className={`cursor-pointer card-neon p-5 border transition-all duration-200 ${
                selectedNode === 'triggers'
                  ? 'border-neon-gold ring-2 ring-neon-gold/30'
                  : 'border-border hover:border-neon-gold/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-neon-gold font-bold uppercase tracking-wider">
                  INTEGRAÇÕES & SYNC
                </span>
                <Zap className="w-4 h-4 text-neon-gold" />
              </div>
              <h4 className="font-display font-bold text-sm neon-title-gold">
                Trigger & Webhook Hub
              </h4>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                Distribuição automática de leads e alertas de estagnação.
              </p>
            </div>
          </div>

          {/* Nó 4: Pipeline / Governança */}
          <div
            onClick={() => setSelectedNode('crm')}
            className={`cursor-pointer card-neon p-6 border transition-all duration-200 ${
              selectedNode === 'crm'
                ? 'border-neon-pink ring-2 ring-neon-pink/30'
                : 'border-border hover:border-neon-pink/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neon-pink font-bold">
                FECHAMENTO & RESULTADOS
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg neon-title-pink">
              Pipeline Concluído
            </h3>
            <p className="text-xs text-muted font-mono mt-1">
              Negócios convertidos em receita faturada e auditada no PostgreSQL.
            </p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
              <span className="text-ink font-bold tabular-nums">R$ 1.480.000</span>
              <span className="text-emerald-500 font-bold">28.4% Win Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
