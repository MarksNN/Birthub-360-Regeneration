import React, { useState } from 'react';
import {
  Bot,
  BrainCircuit,
  Zap,
  Building2,
  Workflow,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface FlowViewProps {
  onOpenSupervisor?: () => void;
  onOpenNewDeal?: () => void;
}

export const FlowView: React.FC<FlowViewProps> = ({ onOpenSupervisor, onOpenNewDeal }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>('supervisor');

  const nodes = [
    {
      id: 'supervisor',
      type: 'KERNEL',
      title: 'Supervisor 360° Kernel',
      subtitle: 'Orquestrador de Missões & Delegação',
      status: 'OPERACIONAL',
      agentCount: '19 Ativos',
      icon: Cpu,
      color: 'bg-[#343735] text-white',
      badge: '#E5FF45'
    },
    {
      id: 'closer',
      type: 'AGENT',
      title: 'Closer Sales AI',
      subtitle: 'Contorno de Objeções & Proposta',
      status: 'EXECUTABLE',
      agentCount: '18 Habilidades',
      icon: Bot,
      color: 'bg-workspace-card text-workspace-primary',
      badge: '#00D4FF'
    },
    {
      id: 'triggers',
      type: 'AUTOMATION',
      title: 'Trigger & Sync Hub',
      subtitle: 'Gatilhos de Lead & SLA Webhooks',
      status: 'ATIVO',
      agentCount: '4 Conectores',
      icon: Zap,
      color: 'bg-workspace-card text-workspace-primary',
      badge: '#FFC107'
    },
    {
      id: 'crm',
      type: 'PIPELINE',
      title: 'Funil Comercial B2B',
      subtitle: 'Proposta Enviada → Negociação',
      status: 'EM_PROGRESSO',
      agentCount: 'R$ 1.48M Pipeline',
      icon: Workflow,
      color: 'bg-workspace-card text-workspace-primary',
      badge: '#FF2D9B'
    },
    {
      id: 'governance',
      type: 'GOVERNANCE',
      title: 'Aprovação Comercial & RLS',
      subtitle: 'Compliance LGPD & Assinatura',
      status: 'HOMOLOGADO',
      agentCount: '100% Auditável',
      icon: ShieldCheck,
      color: 'bg-[#343735] text-white',
      badge: '#E5FF45'
    }
  ];

  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col items-center justify-center select-none overflow-auto">
      <div className="text-center max-w-xl mb-8">
        <span className="px-3 py-1 rounded-pill bg-[#E5FF45]/20 text-[#343735] border border-[#E5FF45]/40 text-xs font-mono font-bold">
          VISUALIZAÇÃO RELACIONAL 360° • FLUXO DE OPERAÇÕES
        </span>
        <h2 className="font-display text-2xl font-black neon-title-brand mt-2">
          Arquitetura Conectada de Agentes & Negócios
        </h2>
        <p className="text-xs text-workspace-secondary font-mono mt-1">
          Rastreabilidade completa de comandos do Supervisor, execução autônoma, sincronização e fechamento.
        </p>
      </div>

      {/* Diagrama de Nós Interconectados */}
      <div className="relative w-full max-w-5xl py-8">
        {/* SVG Conectores Curvos entre os Nós */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <path
            d="M 220,120 C 350,120 350,60 480,60"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 220,120 C 350,120 350,180 480,180"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2.5"
          />
          <path
            d="M 720,60 C 800,60 800,120 880,120"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2.5"
          />
          <path
            d="M 720,180 C 800,180 800,120 880,120"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2.5"
          />
        </svg>

        {/* Linha 1 de Nós */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 items-center">
          {/* Nó 1: Supervisor */}
          <div
            onClick={() => {
              setSelectedNode('supervisor');
              if (onOpenSupervisor) onOpenSupervisor();
            }}
            className={`cursor-pointer rounded-canvas p-6 border transition-all duration-300 shadow-md ${
              selectedNode === 'supervisor'
                ? 'border-[#E5FF45] ring-2 ring-[#E5FF45]/50 scale-105'
                : 'border-workspace-soft hover:border-workspace-graphite'
            } bg-[#343735] text-white`}
            style={{ borderRadius: '24px' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5FF45] font-bold">
                CORE KERNEL
              </span>
              <div className="w-8 h-8 rounded-full bg-[#E5FF45] text-[#343735] flex items-center justify-center font-bold">
                <BrainCircuit className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg neon-title-cyan">Supervisor 360°</h3>
            <p className="text-xs text-white/70 font-mono mt-1">
              Planejamento, roteamento e governança de agentes.
            </p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-[#E5FF45]">● Operando</span>
              <span className="text-white/60">394 Agentes</span>
            </div>
          </div>

          {/* Coluna Central: Closer Sales AI e Triggers */}
          <div className="space-y-6">
            {/* Nó 2: Closer */}
            <div
              onClick={() => setSelectedNode('closer')}
              className={`cursor-pointer rounded-canvas p-5 border transition-all duration-300 shadow-sm bg-workspace-card ${
                selectedNode === 'closer'
                  ? 'border-[#E5FF45] ring-2 ring-[#E5FF45]/50 scale-102'
                  : 'border-workspace-soft hover:border-workspace-graphite'
              }`}
              style={{ borderRadius: '20px' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-workspace-secondary font-medium">
                  AGENTE ESPECIALISTA
                </span>
                <Bot className="w-4 h-4 text-workspace-graphite" />
              </div>
              <h4 className="font-display font-bold text-sm text-workspace-primary">
                Closer Sales AI
              </h4>
              <p className="text-[11px] text-workspace-secondary font-mono mt-0.5">
                Geração de propostas e roteiros de contorno de objeção.
              </p>
            </div>

            {/* Nó 3: Triggers */}
            <div
              onClick={() => setSelectedNode('triggers')}
              className={`cursor-pointer rounded-canvas p-5 border transition-all duration-300 shadow-sm bg-workspace-card ${
                selectedNode === 'triggers'
                  ? 'border-[#E5FF45] ring-2 ring-[#E5FF45]/50 scale-102'
                  : 'border-workspace-soft hover:border-workspace-graphite'
              }`}
              style={{ borderRadius: '20px' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-workspace-secondary font-medium">
                  INTEGRAÇÕES & SYNC
                </span>
                <Zap className="w-4 h-4 text-[#FFC107]" />
              </div>
              <h4 className="font-display font-bold text-sm text-workspace-primary">
                Trigger & Webhook Hub
              </h4>
              <p className="text-[11px] text-workspace-secondary font-mono mt-0.5">
                Distribuição automática de leads e alertas de estagnação.
              </p>
            </div>
          </div>

          {/* Nó 4: Pipeline / Governança */}
          <div
            onClick={() => setSelectedNode('crm')}
            className={`cursor-pointer rounded-canvas p-6 border transition-all duration-300 shadow-md ${
              selectedNode === 'crm'
                ? 'border-[#E5FF45] ring-2 ring-[#E5FF45]/50 scale-105'
                : 'border-workspace-soft hover:border-workspace-graphite'
            } bg-workspace-card`}
            style={{ borderRadius: '24px' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-workspace-secondary font-bold">
                FECHAMENTO & RESULTADOS
              </span>
              <div className="w-8 h-8 rounded-full bg-[#343735] text-[#E5FF45] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg neon-title-pink">
              Pipeline Concluído
            </h3>
            <p className="text-xs text-workspace-secondary font-mono mt-1">
              Negócios convertidos em receita faturada e auditada no PostgreSQL.
            </p>
            <div className="mt-4 pt-3 border-t border-workspace-soft flex items-center justify-between text-xs font-mono">
              <span className="text-workspace-graphite font-bold">R$ 1.480.000</span>
              <span className="text-workspace-secondary">28.4% Win Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
