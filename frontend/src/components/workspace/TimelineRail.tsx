import React, { useState } from 'react';
import {
  Calendar,
  ChevronUp,
  ChevronDown,
  Plus,
  Sparkles,
  Bot,
  Mail,
  Zap,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Filter
} from 'lucide-react';
import { ConnectedEntityCard } from './ConnectedEntityCard';

export interface TimelineEvent {
  id: string;
  periodLabel: string;
  subPeriod: string;
  nodeType: 'deal' | 'agent' | 'metric' | 'alert' | 'cadence';
  actionCapsule: {
    icon: 'bot' | 'mail' | 'zap' | 'deal' | 'file';
    label: string;
    multiplier?: string;
  };
  card: {
    category: string;
    title: string;
    badge?: string;
    metricLabel?: string;
    metricValue?: string;
    delta?: string;
    chartType: 'wave' | 'ecg' | 'bars' | 'sparkline';
    agentName?: string;
    tags?: string[];
  };
}

interface TimelineRailProps {
  deals: any[];
  companies: any[];
  leads: any[];
  activities: any[];
  agents: any[];
  onOpenCardDetail?: (item: any) => void;
  onOpenNewDeal?: () => void;
}

export const TimelineRail: React.FC<TimelineRailProps> = ({
  deals = [],
  companies = [],
  leads = [],
  activities = [],
  agents = [],
  onOpenCardDetail,
  onOpenNewDeal
}) => {
  const [selectedMonth, setSelectedMonth] = useState('Out');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DEALS' | 'AGENTS' | 'ACTIVITIES'>('ALL');

  // Constrói os blocos cronológicos conectados baseados nos dados reais
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Dados reais enriquecidos com apresentação visual idêntica à referência
  const primaryDeal = deals[0] || {
    id: 'deal-primary',
    title: 'Contrato Anual Aurora Enterprise',
    amount: 250000,
    stage: 'PROPOSTA_ENVIADA',
    company: { name: 'Aurora Enterprise' },
    lead: { title: 'Expansão Nacional' }
  };

  const secondaryDeal = deals[1] || {
    id: 'deal-secondary',
    title: 'Licenciamento Birthub 360 Pro',
    amount: 148000,
    stage: 'NEGOCIACAO',
    company: { name: 'Acme Corporativa' },
    lead: { title: 'Renovação Contratual' }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-x-auto select-none p-4 md:p-8">
      {/* Linha horizontal principal de conexão do Canvas */}
      <div className="relative min-w-[1100px] flex-1 pb-24">
        {/* SVG Global de Conexões Curvas (Bezier) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ minWidth: '1100px' }}
        >
          {/* Linha mestra horizontal da timeline */}
          <line
            x1="60"
            y1="50"
            x2="1040"
            y2="50"
            stroke="var(--line-connection)"
            strokeWidth="2"
            strokeDasharray="none"
          />

          {/* Ramificação curva 1: nó 1 -> capsule -> card 1 */}
          <path
            d="M 160,50 C 160,110 240,110 240,170"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />

          {/* Ramificação secundária: nó 1 -> card sintomas/risco */}
          <path
            d="M 160,50 C 160,110 160,250 240,380"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />

          {/* Ramificação curva 2: nó 2 -> capsule -> card 2 */}
          <path
            d="M 620,50 C 620,110 700,110 700,170"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />

          {/* Ramificação curva 2 -> card ECG / SLA */}
          <path
            d="M 620,50 C 620,110 620,250 700,380"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />
        </svg>

        {/* Timeline Columns & Rail Nodes */}
        <div className="grid grid-cols-2 gap-16 relative z-10">
          {/* ===================== COLUNA 1: OUTUBRO / SPRINT 1 ===================== */}
          <div className="space-y-6">
            {/* Nó luminoso na linha mestra */}
            <div className="flex items-center space-x-6">
              {/* Neon Lime Circular Node com ícone de documento */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Nó da timeline: Outubro Sprint 1"
                  className="w-10 h-10 rounded-full bg-[#E5FF45] border-2 border-[#343735] flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <FileText className="w-5 h-5 text-[#343735]" />
                </button>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#343735] border border-[#E5FF45]"></span>
              </div>

              {/* Rótulo de Período & Controles Verticais */}
              <div className="flex items-center space-x-3">
                <div>
                  <span className="font-display text-base font-bold text-workspace-primary block">
                    Outubro
                  </span>
                  <span className="text-[11px] font-mono text-workspace-secondary">
                    Semana 1 • Sprint Ativo
                  </span>
                </div>

                <div className="flex flex-col bg-workspace-card rounded-pill border border-workspace-soft p-0.5 shadow-sm">
                  <button className="p-0.5 hover:text-workspace-graphite text-workspace-secondary">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button className="p-0.5 hover:text-workspace-graphite text-workspace-secondary">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ação Flutuante Conectada na Curva: Agente / Ação */}
            <div className="ml-16 inline-flex items-center bg-[#343735] text-white px-3 py-1.5 rounded-pill shadow-sm space-x-2 text-xs font-mono border border-black/20">
              <div className="w-5 h-5 rounded-full bg-[#E5FF45] text-[#343735] flex items-center justify-center">
                <Bot className="w-3 h-3" />
              </div>
              <span className="font-semibold text-white">Closer Sales Agent</span>
              <span className="text-white/60 text-[10px]">x2 exec</span>
            </div>

            {/* Cartão Conectado 1: Previsão & Oportunidade Principal */}
            <div className="ml-20 max-w-md">
              <ConnectedEntityCard
                id="card-out-1"
                category="Previsão Comercial & Win Rate"
                title={primaryDeal.title}
                badge={`R$ ${(primaryDeal.amount || 250000).toLocaleString('pt-BR')}`}
                metricLabel="Win Probability • Estágio"
                metricValue={primaryDeal.stage || 'PROPOSTA_ENVIADA'}
                delta="+14% MoM"
                chartType="wave"
                agentName="Closer AI"
                tags={[primaryDeal.company?.name || 'Aurora Enterprise', 'Decisor: Helena Costa', 'SLA 4h']}
                onClick={() => onOpenCardDetail && onOpenCardDetail(primaryDeal)}
              />
            </div>

            {/* Cartão Conectado 2: Análise de Riscos & Alertas (Supervisor) */}
            <div className="ml-20 max-w-md pt-2">
              <ConnectedEntityCard
                id="card-out-2"
                category="Supervisor • Diagnóstico de Objeções"
                title="Risco de Estagnação em Negociação"
                metricLabel="Criticidade da Conta"
                metricValue="Moderada • Reunião Pendente"
                delta="Alerta 48h"
                chartType="ecg"
                agentName="Supervisor Guard"
                tags={['Objeção: Orçamento Q4', 'Ação: Proposta Flexível']}
                onClick={() => onOpenCardDetail && onOpenCardDetail({ type: 'RISK_ANALYSIS' })}
              />
            </div>
          </div>

          {/* ===================== COLUNA 2: NOVEMBRO / SPRINT 2 ===================== */}
          <div className="space-y-6">
            {/* Nó luminoso na linha mestra */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Neon Lime Circular Node com ícone de documento */}
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Nó da timeline: Novembro Sprint 2"
                    className="w-10 h-10 rounded-full bg-[#E5FF45] border-2 border-[#343735] flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#343735]" />
                  </button>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#343735] border border-[#E5FF45]"></span>
                </div>

                {/* Rótulo de Período & Controles Verticais */}
                <div className="flex items-center space-x-3">
                  <div>
                    <span className="font-display text-base font-bold text-workspace-primary block">
                      Novembro
                    </span>
                    <span className="text-[11px] font-mono text-workspace-secondary">
                      Semana 1 • Projeção & Follow-up
                    </span>
                  </div>

                  <div className="flex flex-col bg-workspace-card rounded-pill border border-workspace-soft p-0.5 shadow-sm">
                    <button className="p-0.5 hover:text-workspace-graphite text-workspace-secondary">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button className="p-0.5 hover:text-workspace-graphite text-workspace-secondary">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Botão de Adição no Rail */}
              {onOpenNewDeal && (
                <button
                  onClick={onOpenNewDeal}
                  className="w-9 h-9 rounded-full bg-[#343735] text-white flex items-center justify-center hover:bg-black transition-colors shadow-sm"
                  title="Criar novo marco ou oportunidade"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Ações Flutuantes Conectadas na Curva */}
            <div className="ml-16 flex flex-col space-y-2">
              <div className="inline-flex items-center bg-[#343735] text-white px-3 py-1.5 rounded-pill shadow-sm space-x-2 text-xs font-mono border border-black/20 w-fit">
                <div className="w-5 h-5 rounded-full bg-[#E5FF45] text-[#343735] flex items-center justify-center">
                  <Mail className="w-3 h-3" />
                </div>
                <span className="font-semibold text-white">Cadência Multicanal</span>
                <span className="text-white/60 text-[10px]">x3 disparos</span>
              </div>

              <div className="inline-flex items-center bg-[#343735] text-white px-3 py-1.5 rounded-pill shadow-sm space-x-2 text-xs font-mono border border-black/20 w-fit">
                <div className="w-5 h-5 rounded-full bg-[#E5FF45] text-[#343735] flex items-center justify-center">
                  <Zap className="w-3 h-3" />
                </div>
                <span className="font-semibold text-white">Trigger Hub Sync</span>
                <span className="text-white/60 text-[10px]">Webhook OK</span>
              </div>
            </div>

            {/* Cartão Conectado 3: Negociação em Andamento */}
            <div className="ml-20 max-w-md">
              <ConnectedEntityCard
                id="card-nov-1"
                category="Negócio & Expansão de Contrato"
                title={secondaryDeal.title}
                badge={`R$ ${(secondaryDeal.amount || 148000).toLocaleString('pt-BR')}`}
                metricLabel="Ticket Médio Estimado"
                metricValue="R$ 148.000,00"
                delta="-20% Ciclo Médio"
                chartType="wave"
                agentName="RevOps Copilot"
                tags={[secondaryDeal.company?.name || 'Acme Corp', 'Lead: Renovação', 'ICP Fit: 92']}
                onClick={() => onOpenCardDetail && onOpenCardDetail(secondaryDeal)}
              />
            </div>

            {/* Cartão Conectado 4: Pulso Operacional e SLA */}
            <div className="ml-20 max-w-md pt-2">
              <ConnectedEntityCard
                id="card-nov-2"
                category="RevOps • Pulso Operacional em Tempo Real"
                title="Cadência de Atividades & Ligações"
                metricLabel="Velocidade de Resposta (Speed-to-Lead)"
                metricValue="18 min média • SLA Cumprido"
                delta="+32% Produtividade"
                chartType="ecg"
                agentName="SDR Cadence"
                tags={['12 Reuniões Agendadas', '48 Ligações Gravadas']}
                onClick={() => onOpenCardDetail && onOpenCardDetail({ type: 'REVOPS_PULSE' })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================== FLOATING TIMELINE SCRUBBER (BARRA INFERIOR DE MESES) ===================== */}
      {/* Exatamente como na imagem de referência: barra alongada, fundo off-white translúcido, seleção ativa em grafite */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-4xl">
        <div className="bg-workspace-card/90 backdrop-blur-md rounded-pill border border-workspace-soft p-1.5 shadow-xl flex items-center justify-between text-xs font-mono">
          {/* Seletor de Ano */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#343735] text-white rounded-pill">
            <Calendar className="w-3.5 h-3.5 text-[#E5FF45]" />
            <span className="font-bold">2026</span>
          </div>

          {/* Relação de Meses com Indicadores e Badges Neon Lime */}
          <div className="flex items-center space-x-1 overflow-x-auto px-2">
            {months.map((m, idx) => {
              const isSelected = selectedMonth === m;
              const hasBadge = idx === 1 || idx === 6 || idx === 8 || idx === 9;
              const badgeCount = idx === 1 ? '6' : idx === 6 ? '2' : idx === 8 ? '4' : '3';

              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`relative px-3 py-1 rounded-pill transition-all text-xs font-semibold flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-[#343735] text-white shadow-sm'
                      : 'text-workspace-secondary hover:text-workspace-primary hover:bg-workspace-surface'
                  }`}
                >
                  <span>{m}</span>
                  {hasBadge && (
                    <span className="w-4 h-4 rounded-full bg-[#E5FF45] text-[#222522] font-black text-[9px] flex items-center justify-center -mr-1">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrubber Actives / Timeline Window Preview */}
          <div className="hidden md:flex items-center space-x-1 px-3 py-1 bg-[#343735] text-white rounded-pill text-[11px]">
            <span className="text-[#E5FF45] font-bold">Q4 LIVE</span>
            <span className="text-white/60">• 19 Agentes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
