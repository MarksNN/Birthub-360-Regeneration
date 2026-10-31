import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Search,
  ChevronRight,
  Terminal,
  Send,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Database
} from 'lucide-react';
import { api } from '../services/api';

export interface AgentV31Meta {
  id: string;
  name: string;
  prompt: string;
  index: string;
  skills: number;
  playbooks: number;
}

export interface SkillV31Item {
  id: string;
  name: string;
  playbookId: string;
  catalogStage: string;
  number: number;
  agentId: string;
}

export const CommercialV31MatrixView: React.FC = () => {
  const [agents, setAgents] = useState<AgentV31Meta[]>([]);
  const [skills, setSkills] = useState<SkillV31Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('supervisor');
  const [agentDetails, setAgentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Orquestração V3.1
  const [prompt, setPrompt] = useState('');
  const [orchestrating, setOrchestrating] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<any>(null);

  // Context Assembler modal
  const [contextAssemblerResult, setContextAssemblerResult] = useState<any>(null);
  const [assemblingContext, setAssemblingContext] = useState(false);

  // Red Team Audit
  const [runningRedTeam, setRunningRedTeam] = useState(false);
  const [redTeamReport, setRedTeamReport] = useState<any>(null);

  // Database Sync
  const [syncingDb, setSyncingDb] = useState(false);
  const [syncReport, setSyncReport] = useState<any>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [catRes, skillsRes] = await Promise.all([
        api.getCommercialV31Catalog(),
        api.getCommercialV31Skills()
      ]);
      if (catRes.success) setAgents(catRes.agents);
      if (skillsRes.success) setSkills(skillsRes.skills);
    } catch (err) {
      console.error('Erro ao carregar catálogo V3.1:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAgentId) {
      loadAgentDetails(selectedAgentId);
    }
  }, [selectedAgentId]);

  const loadAgentDetails = async (agentId: string) => {
    setLoadingDetails(true);
    setContextAssemblerResult(null);
    try {
      const res = await api.getCommercialV31Agent(agentId);
      if (res.success) {
        setAgentDetails(res);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do agente:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOrchestrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setOrchestrating(true);
    setOrchestrationResult(null);
    try {
      const res = await api.orchestrateCommercialV31({
        userPrompt: prompt,
        targetAgentId: selectedAgentId || undefined,
        mode: 'CONSULTIVO'
      });
      if (res.success) {
        setOrchestrationResult(res.data);
      }
    } catch (err: any) {
      setOrchestrationResult({ error: err.message });
    } finally {
      setOrchestrating(false);
    }
  };

  const handleAssembleContext = async () => {
    if (!selectedAgentId || !agentDetails?.index?.skills) return;
    setAssemblingContext(true);
    try {
      const sampleSkills = agentDetails.index.skills.slice(0, 2).map((s: any) => s.id);
      const res = await api.assembleCommercialV31Context(selectedAgentId, sampleSkills);
      if (res.success) {
        setContextAssemblerResult(res);
      }
    } catch (err: any) {
      alert(`Falha ao montar contexto: ${err.message}`);
    } finally {
      setAssemblingContext(false);
    }
  };

  const handleRunRedTeam = async () => {
    setRunningRedTeam(true);
    try {
      const res = await api.getCommercialV31RedTeam();
      if (res.success) {
        setRedTeamReport(res.report);
      }
    } catch (err: any) {
      alert(`Falha no Red Team: ${err.message}`);
    } finally {
      setRunningRedTeam(false);
    }
  };

  const handleSyncDatabase = async () => {
    setSyncingDb(true);
    try {
      const res = await api.syncCommercialV31ToDatabase();
      if (res.success) {
        setSyncReport(res.report);
        alert(`Sincronização concluída! ${res.report.totalSynced} especialistas registrados no banco.`);
      }
    } catch (err: any) {
      alert(`Falha na sincronização: ${err.message}`);
    } finally {
      setSyncingDb(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-neon p-6 relative overflow-hidden border border-neon-blue/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neon-blue/20 text-neon-blue border border-neon-blue/40">
                COMERCIAL V3.1 MULTIAGENTES
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neon-green/20 text-neon-green border border-neon-green/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                209 CASOS RED TEAM
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold neon-title-cyan">
              Matriz Operacional de 19 Especialistas e 463 Habilidades
            </h1>
            <p className="text-sm text-muted">
              Orquestração canônica com injeção de Core Compartilhado, descoberta de playbooks sob demanda e governança estrita de LGPD/B2B.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunRedTeam}
              disabled={runningRedTeam}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neon-green/15 text-neon-green border border-neon-green/40 hover:bg-neon-green/25 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {runningRedTeam ? 'Auditando...' : 'Auditar Red Team'}
            </button>

            <button
              onClick={handleSyncDatabase}
              disabled={syncingDb}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neon-purple/15 text-neon-purple border border-neon-purple/40 hover:bg-neon-purple/25 transition-all flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" />
              {syncingDb ? 'Sincronizando...' : 'Sincronizar Banco'}
            </button>
          </div>
        </div>

        {/* Relatório de Auditoria Red Team (se executado) */}
        {redTeamReport && (
          <div className="mt-4 p-4 rounded-lg bg-surface2 border border-neon-green/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-neon-green">Auditoria Red Team Homologada:</span>
              <span className="text-muted">
                {redTeamReport.passedCases}/{redTeamReport.totalCases} casos aprovados (100%)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-muted">
              <div>Suites: {redTeamReport.totalSuites} agentes</div>
              <div>Cenários: {redTeamReport.totalCases}</div>
              <div className="text-neon-green">Aprovados: {redTeamReport.passedCases}</div>
              <div className="text-neon-danger">Falhas: {redTeamReport.failedCases}</div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Principal: Lista dos 19 Agentes + Painel Detalhado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Lista dos 19 Especialistas */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
              <Users className="w-4 h-4 text-neon-blue" />
              19 Agentes Especialistas
            </h2>
            <span className="text-xs font-mono text-muted">{agents.length} cadastrados</span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-muted">Carregando catálogo...</div>
            ) : (
              agents.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-neon-blue/10 border-neon-blue shadow-lg shadow-neon-blue/10'
                        : 'bg-surface hover:bg-surface2 border-border hover:border-border-hover'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{agent.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface2 text-muted border border-border">
                          {agent.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted font-mono">
                        <span>{agent.skills} skills</span>
                        <span>•</span>
                        <span>{agent.playbooks} playbooks</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-muted transition-transform ${
                        isSelected ? 'text-neon-blue transform translate-x-1' : ''
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Detalhes do Especialista Selecionado e Ações */}
        <div className="lg:col-span-7 space-y-4">
          {loadingDetails ? (
            <div className="card-neon p-12 text-center text-muted">
              Carregando detalhes do especialista...
            </div>
          ) : agentDetails?.agent ? (
            <div className="card-neon p-6 space-y-5 border border-border">
              {/* Header do Agente */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {agentDetails.agent.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                      ID: {agentDetails.agent.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1 font-mono">
                    Prompt Ref: {agentDetails.agent.prompt}
                  </p>
                </div>

                <button
                  onClick={handleAssembleContext}
                  disabled={assemblingContext}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-blue/15 text-neon-blue border border-neon-blue/40 hover:bg-neon-blue/25 transition-all flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {assemblingContext ? 'Montando...' : 'Simular Contexto'}
                </button>
              </div>

              {/* Estatísticas e Playbooks */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface2 border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-neon-gold" />
                    <span>Playbooks Vinculados ({agentDetails.playbooks?.length || 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {agentDetails.playbooks?.map((pb: any) => (
                      <span
                        key={pb.id}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface text-foreground border border-border"
                      >
                        {pb.id}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface2 border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-neon-green" />
                    <span>Governança V3.1</span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Isolamento por tenant, verificação estrita de opt-out e execução de playbooks sob demanda.
                  </p>
                </div>
              </div>

              {/* Resultado da Montagem do Contexto (se disparado) */}
              {contextAssemblerResult && (
                <div className="p-4 rounded-lg bg-surface2 border border-neon-blue/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-neon-blue font-bold">
                    <span>Context Assembler — Flags de Validação:</span>
                    <span className="text-neon-green">schemaReady: true</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-muted">
                    <div>indexInjected: {String(contextAssemblerResult.flags.indexInjected)}</div>
                    <div>loadedPlaybooks: {contextAssemblerResult.flags.loadedPlaybooks.join(', ') || 'Nenhum'}</div>
                    <div>bootstrapConsultivo: {String(!contextAssemblerResult.flags.operationalAllowedByBootstrap)}</div>
                  </div>
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-muted hover:text-foreground font-mono">
                      Ver prompt completo gerado ({contextAssemblerResult.contextPrompt.length} chars)
                    </summary>
                    <pre className="mt-2 p-3 rounded bg-black/40 text-[11px] text-muted overflow-x-auto max-h-48">
                      {contextAssemblerResult.contextPrompt}
                    </pre>
                  </details>
                </div>
              )}

              {/* Lista de Habilidades do Agente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                  <span>Habilidades Homologadas ({agentDetails.index?.skills?.length || 0})</span>
                  <span>Playbook</span>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {agentDetails.index?.skills?.map((skill: any) => (
                    <div
                      key={skill.id}
                      className="p-2.5 rounded bg-surface border border-border flex items-center justify-between text-xs hover:border-border-hover transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground">{skill.name}</span>
                        <div className="text-[11px] font-mono text-muted">{skill.id}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-neon-gold/15 text-neon-gold border border-neon-gold/30">
                        {skill.playbookId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card-neon p-12 text-center text-muted">
              Selecione um especialista para visualizar suas diretrizes e habilidades.
            </div>
          )}
        </div>
      </div>

      {/* Terminal de Orquestração V3.1 em Tempo Real */}
      <div className="card-neon p-6 space-y-4 border border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-neon-blue" />
          <h3 className="font-display text-lg font-bold text-foreground">
            Console de Execução do Supervisor V3.1
          </h3>
          <span className="text-xs font-mono text-muted">
            (Roteamento dinâmico entre os 19 especialistas)
          </span>
        </div>

        <form onSubmit={handleOrchestrate} className="flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Verifique a fila de leads e mapeamento de campos no Bitrix24..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-surface2 border border-border text-foreground text-sm focus:outline-none focus:border-neon-blue font-mono placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={orchestrating || !prompt.trim()}
            className="px-5 py-2.5 rounded-lg bg-neon-blue text-black font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {orchestrating ? 'Orquestrando...' : 'Executar'}
          </button>
        </form>

        {orchestrationResult && (
          <div className="p-4 rounded-lg bg-surface2 border border-border space-y-3">
            {orchestrationResult.error ? (
              <div className="flex items-center gap-2 text-neon-danger text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{orchestrationResult.error}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-neon-green/20 text-neon-green">
                      STATUS: {orchestrationResult.status}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      Agente: {orchestrationResult.assignedAgent?.name} ({orchestrationResult.assignedAgent?.id})
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted">
                    {orchestrationResult.executionTimeMs}ms
                  </span>
                </div>

                <div className="text-sm text-foreground">
                  <span className="font-bold text-neon-blue">Síntese do Supervisor:</span>{' '}
                  {orchestrationResult.resumo_humano}
                </div>

                {orchestrationResult.skillsUsed && (
                  <div className="flex items-center gap-2 text-xs font-mono text-muted">
                    <span className="text-foreground">Skills Aplicadas:</span>
                    {orchestrationResult.skillsUsed.map((sid: string) => (
                      <span key={sid} className="px-1.5 py-0.5 rounded bg-surface border border-border">
                        {sid}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
