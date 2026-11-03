import React, { useState } from 'react';
import {
  Calendar,
  ChevronUp,
  ChevronDown,
  Plus,
  Bot,
  Mail,
  Zap,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { ConnectedEntityCard } from './ConnectedEntityCard';

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
  onOpenCardDetail,
  onOpenNewDeal
}) => {
  const [selectedMonth, setSelectedMonth] = useState('Out');

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
      <div className="relative min-w-[1100px] flex-1 pb-24">
        {/* SVG Global de Conexões Curvas (Bezier) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ minWidth: '1100px' }}
        >
          <line
            x1="60"
            y1="50"
            x2="1040"
            y2="50"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />
          <path
            d="M 160,50 C 160,110 240,110 240,170"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />
          <path
            d="M 160,50 C 160,110 160,250 240,380"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />
          <path
            d="M 620,50 C 620,110 700,110 700,170"
            fill="none"
            stroke="var(--line-connection)"
            strokeWidth="2"
          />
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
            <div className="flex items-center space-x-6">
              <div className="relative">
                <button
                  type="button"
                  aria-label="Nó da timeline: Outubro Sprint 1"
                  className="w-10 h-10 rounded-full bg-neon-blue/15 border-2 border-neon-blue flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                >
                  <FileText className="w-5 h-5 text-neon-blue" />
                </button>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface"></span>
              </div>

              <div className="flex items-center space-x-3">
                <div>
                  <span className="font-display text-base font-bold neon-title-blue block">
                    Outubro
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    Semana 1 • Sprint Ativo
                  </span>
                </div>

                <div className="flex flex-col bg-surface rounded-pill border border-border p-0.5 shadow-xs">
                  <button className="p-0.5 hover:text-neon-blue text-muted">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button className="p-0.5 hover:text-neon-blue text-muted">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ação Flutuante Conectada na Curva: Agente / Ação */}
            <div className="ml-16 inline-flex items-center bg-[#0B132B] text-[#F8FAFC] px-3 py-1.5 rounded-pill shadow-sm space-x-2 text-xs font-mono border border-neon-iris/40">
              <div className="w-5 h-5 rounded-full bg-neon-iris/20 text-neon-iris flex items-center justify-center border border-neon-iris/40">
                <Bot className="w-3 h-3" />
              </div>
              <span className="font-semibold">Closer Sales Agent</span>
              <span className="text-neon-blue text-[10px] font-bold">x2 exec</span>
            </div>

            {/* Cartão Conectado 1 */}
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

            {/* Cartão Conectado 2 */}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Nó da timeline: Novembro Sprint 2"
                    className="w-10 h-10 rounded-full bg-neon-pink/15 border-2 border-neon-pink flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                  >
                    <CheckCircle2 className="w-5 h-5 text-neon-pink" />
                  </button>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon-gold border-2 border-surface"></span>
                </div>

                <div className="flex items-center space-x-3">
                  <div>
                    <span className="font-display text-base font-bold neon-title-pink block">
                      Novembro
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      Semana 1 • Projeção & Follow-up
                    </span>
                  </div>

                  <div className="flex flex-col bg-surface rounded-pill border border-border p-0.5 shadow-xs">
                    <button className="p-0.5 hover:text-neon-pink text-muted">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button className="p-0.5 hover:text-neon-pink text-muted">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {onOpenNewDeal && (
                <button
                  onClick={onOpenNewDeal}
                  className="w-9 h-9 rounded-full bg-neon-blue text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                  title="Criar novo marco ou oportunidade"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Ações Flutuantes Conectadas na Curva */}
            <div className="ml-16 flex flex-col space-y-2">
              <div className="inline-flex items-center bg-[#0B132B] text-[#F8FAFC] px-3 py-1.5 rounded-pill shadow-sm space-x-2 text-xs font-mono border border-neon-blue/40 w-fit">
                <div className="w-5 h-5 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center">
                  <Mail className="w-3 h-3" />
                </div>
                <span className="font-semibold">Cadência Multicanal</span>
                <span className="text-neon-blue text-[10px] font-bold">x3 disparos</span>
              </div>

              <div className="inline-flex items-center bg-[#0B132B] text-[#F8FAFC] px-3 py-1.5 rounded-pill shadow-sm space-x-2 text-xs font-mono border border-neon-gold/40 w-fit">
                <div className="w-5 h-5 rounded-full bg-neon-gold/20 text-neon-gold flex items-center justify-center">
                  <Zap className="w-3 h-3" />
                </div>
                <span className="font-semibold">Trigger Hub Sync</span>
                <span className="text-emerald-400 text-[10px] font-bold">Webhook OK</span>
              </div>
            </div>

            {/* Cartão Conectado 3 */}
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

            {/* Cartão Conectado 4 */}
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

      {/* ===================== FLOATING TIMELINE SCRUBBER ===================== */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-4xl">
        <div className="bg-surface/95 backdrop-blur-md rounded-pill border border-border p-1.5 shadow-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#0B132B] text-[#F8FAFC] rounded-pill border border-neon-blue/30">
            <Calendar className="w-3.5 h-3.5 text-neon-blue" />
            <span className="font-bold">2026</span>
          </div>

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
                      ? 'bg-neon-blue text-white shadow-xs font-bold'
                      : 'text-muted hover:text-ink hover:bg-surface2'
                  }`}
                >
                  <span>{m}</span>
                  {hasBadge && (
                    <span className={`w-4 h-4 rounded-full font-bold text-[9px] flex items-center justify-center -mr-1 ${
                      isSelected ? 'bg-white text-[#0B132B]' : 'bg-neon-iris/20 text-neon-iris'
                    }`}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 bg-[#0B132B] text-[#F8FAFC] rounded-pill text-[11px] border border-neon-iris/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neon-blue font-bold">Q4 LIVE</span>
            <span className="text-slate-400">• 19 Agentes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
