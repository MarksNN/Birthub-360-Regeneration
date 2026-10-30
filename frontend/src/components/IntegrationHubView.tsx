import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Cpu,
  ArrowRight,
  Database,
  Lock,
  ExternalLink,
  Sliders,
  DollarSign,
  Activity,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';

interface IntegrationHubViewProps {
  userRole: string;
  onRefreshData?: () => void;
}

export function IntegrationHubView({ userRole, onRefreshData }: IntegrationHubViewProps) {
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'request' | 'projects' | 'detail' | 'connections' | 'admin'
  >('catalog');

  const [catalog, setCatalog] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [pricingAdmin, setPricingAdmin] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form de Nova Solicitação
  const [requestProvider, setRequestProvider] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Form de Discovery
  const [discoveryToolName, setDiscoveryToolName] = useState('');
  const [discoveryObjective, setDiscoveryObjective] = useState('');
  const [discoveryDirection, setDiscoveryDirection] = useState('BIDIRECTIONAL');
  const [discoveryFrequency, setDiscoveryFrequency] = useState('TEMPO_REAL');
  const [discoveryVolume, setDiscoveryVolume] = useState('');

  // Pré-orçamento: valores e esforço são definidos pelo operador, nunca inferidos automaticamente.
  const hourNames = ['analysisHours','developmentHours','apiIntegrationHours','dataMappingHours','initialMigrationHours','testingHours','homologationHours','documentationHours','deploymentHours','trainingHours'] as const;
  const [quoteHours, setQuoteHours] = useState<Record<string, number>>(
    Object.fromEntries(hourNames.map(name => [name, 0]))
  );
  const [quoteDocUrl, setQuoteDocUrl] = useState('');
  const [quoteApiVerified, setQuoteApiVerified] = useState<'UNKNOWN' | 'YES' | 'NO'>('UNKNOWN');
  const [quoteVerdict, setQuoteVerdict] = useState('UNDETERMINED');
  const [quoteComplexity, setQuoteComplexity] = useState('UNKNOWN');
  const [quoteDeliverables, setQuoteDeliverables] = useState('');
  const [quoteAcceptance, setQuoteAcceptance] = useState('');
  const [quoteJustification, setQuoteJustification] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState(10);
  const [pricingDraft, setPricingDraft] = useState<Record<string, string>>({});
  const [preparingQuote, setPreparingQuote] = useState(false);

  const handlePrepareProposal = async () => {
    if (!selectedProject) return;
    const split = (value: string) => value.split('\n').map(s => s.trim()).filter(Boolean);
    if (quoteApiVerified === 'UNKNOWN' || quoteVerdict === 'UNDETERMINED' ||
        !split(quoteDeliverables).length || !split(quoteAcceptance).length ||
        !quoteJustification.trim() || !quoteTimeline ||
        (quoteApiVerified === 'YES' && !quoteDocUrl.trim()) ||
        !Object.values(quoteHours).some(n => n > 0)) {
      setActionMessage({ type: 'error', text: 'Informe evidências de API, viabilidade, entregáveis, critérios de aceite, justificativa, cronograma e horas reais antes de enviar a proposta.' });
      return;
    }
    setPreparingQuote(true);
    try {
      const res = await (api as any).prepareIntegrationProposal(selectedProject.id, {
        effort: quoteHours,
        validityDays: 15,
        discountPct: 0,
        scope: {
          objective: selectedProject.discovery?.objective || selectedProject.title,
          justification: quoteJustification.trim(),
          deliverables: split(quoteDeliverables),
          includedFeatures: split(quoteDeliverables),
          excludedFeatures: ['Qualquer item não especificado no escopo aprovado'],
          integratedEntities: [],
          syncFlows: [],
          dependencies: [],
          clientPrerequisites: [],
          acceptanceCriteria: split(quoteAcceptance),
          limitations: [],
          estimatedTimelineDays: quoteTimeline,
          risksAndAssumptions: []
        },
        feasibility: {
          verdict: quoteVerdict,
          complexity: quoteComplexity,
          hasOfficialApi: quoteApiVerified === 'YES',
          documentationUrl: quoteDocUrl.trim() || undefined,
          authMethods: [],
          supportsWebhooks: null,
          readCapabilities: [],
          writeCapabilities: [],
          risks: [], uncertainties: [], reusableConnectorIds: [],
          requiresPaidDiscovery: false
        }
      });
      if (!res.success) throw new Error(res.error || 'Proposta não gerada');
      setActionMessage({ type: 'success', text: 'Proposta enviada ao cliente para aceite formal. Nenhum desenvolvimento foi iniciado.' });
      await loadProjectDetail(selectedProject.id);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Não foi possível emitir a proposta.' });
    } finally {
      setPreparingQuote(false);
    }
  };

  const handleSavePricing = async (key: string, current: unknown) => {
    const raw = pricingDraft[key] ?? (current == null ? '' : String(current));
    if (!raw.trim() || !Number.isFinite(Number(raw)) || Number(raw) < 0) {
      setActionMessage({ type: 'error', text: 'Informe um valor válido para ' + key });
      return;
    }
    const res = await (api as any).updateIntegrationPricingParameter(key, Number(raw));
    setActionMessage(res.success
      ? { type: 'success', text: 'Parâmetro comercial atualizado por operador autorizado.' }
      : { type: 'error', text: res.error || 'Não autorizado a editar parâmetros' });
    if (res.success) await loadData();
  };

  // Aceite formal
  const [effectsAcknowledged, setEffectsAcknowledged] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [acceptingProposal, setAcceptingProposal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      if (activeTab === 'catalog') {
        const res = await (api as any).getIntegrationCatalog();
        if (res.success) setCatalog(res.data);
      } else if (activeTab === 'projects') {
        const res = await (api as any).getIntegrationProjects();
        if (res.success) setProjects(res.data);
      } else if (activeTab === 'connections') {
        const res = await (api as any).getIntegrationConnections();
        if (res.success) setConnections(res.data);
      } else if (activeTab === 'admin' && userRole === 'ADMIN') {
        const res = await (api as any).getIntegrationPricingParameters();
        if (res.success) setPricingAdmin(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDetails.trim()) return;
    setSubmittingRequest(true);
    setActionMessage(null);
    try {
      const res = await (api as any).createIntegrationRequest({
        requestedProviderName: requestProvider.trim() || undefined,
        rawRequest: requestDetails.trim(),
        channel: 'FORM'
      });
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Solicitação criada com sucesso! Projeto ${res.data.project.code} iniciado em Discovery automatizado.`
        });
        setRequestProvider('');
        setRequestDetails('');
        await loadProjectDetail(res.data.project.id);
        setActiveTab('detail');
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Erro ao criar solicitação.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro de comunicação.' });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const loadProjectDetail = async (projectId: string) => {
    setLoading(true);
    try {
      const res = await (api as any).getIntegrationProjectById(projectId);
      if (res.success) {
        setSelectedProject(res.data);
        if (res.data.discovery) {
          setDiscoveryToolName(res.data.discovery.toolName || '');
          setDiscoveryObjective(res.data.discovery.objective || '');
          setDiscoveryDirection(res.data.discovery.direction || 'BIDIRECTIONAL');
          setDiscoveryFrequency(res.data.discovery.frequency || 'TEMPO_REAL');
          setDiscoveryVolume(res.data.discovery.estimatedVolume || '');
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiscovery = async () => {
    if (!selectedProject) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await (api as any).updateIntegrationDiscovery(selectedProject.id, {
        toolName: discoveryToolName,
        objective: discoveryObjective,
        direction: discoveryDirection,
        frequency: discoveryFrequency,
        estimatedVolume: discoveryVolume
      });
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Requisitos de Discovery atualizados com sucesso!' });
        await loadProjectDetail(selectedProject.id);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (decision: 'ACCEPTED' | 'REJECTED') => {
    if (!selectedProject) return;
    const version = selectedProject.proposals?.[0]?.versions?.[0];
    if (!version) return;

    setAcceptingProposal(true);
    setActionMessage(null);
    try {
      const res = await (api as any).acceptIntegrationProposal(selectedProject.id, {
        proposalVersionId: version.id,
        decision,
        effectsAcknowledged: true,
        conditionsAccepted: {
          scopeAgreement: true,
          commercialTerms: true,
          noPreAcceptanceDevelopmentAcknowledged: true
        }
      });
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: decision === 'ACCEPTED'
            ? 'Aceite formal registrado com sucesso! Ordem de projeto gerada.'
            : 'Proposta rejeitada formalmente.'
        });
        await loadProjectDetail(selectedProject.id);
      } else {
        setActionMessage({ type: 'error', text: res.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setAcceptingProposal(false);
    }
  };

  const handleAuthorizeOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await (api as any).authorizeIntegrationOrder(orderId);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Ordem de projeto autorizada internamente!' });
        if (selectedProject) await loadProjectDetail(selectedProject.id);
      } else {
        setActionMessage({ type: 'error', text: res.error });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRunReconciliation = async (connectionId: string) => {
    setLoading(true);
    try {
      const res = await (api as any).reconcileConnection(connectionId);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Reconciliação executada com sucesso! ${res.data.recordsChecked || 0} registros verificados.`
        });
        loadData();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Navegação Interna */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-neon-blue" />
            <h1 className="text-xl font-bold font-display neon-title-blue">
              Central de Integrações & Universal Connector Hub
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Fábrica de integrações sob demanda, catálogo de conectores e governança comercial do Birthub 360°.
          </p>
        </div>

        {/* Abas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'catalog'
                ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                : 'bg-surface hover:bg-surface2 text-muted'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Catálogo</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'request'
                ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                : 'bg-surface hover:bg-surface2 text-muted'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Solicitar Integração</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'projects' || activeTab === 'detail'
                ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                : 'bg-surface hover:bg-surface2 text-muted'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Meus Projetos</span>
          </button>

          <button
            onClick={() => setActiveTab('connections')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'connections'
                ? 'bg-neon-blue/15 text-neon-blue border border-neon-blue/30'
                : 'bg-surface hover:bg-surface2 text-muted'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Conexões Ativas</span>
          </button>

          {userRole === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-neon-gold/15 text-neon-gold border border-neon-gold/30'
                  : 'bg-surface hover:bg-surface2 text-muted'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Governança & Preços</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Feedback */}
      {actionMessage && (
        <div
          className={`p-3 rounded-control text-xs flex items-center space-x-2 border ${
            actionMessage.type === 'success'
              ? 'bg-neon-success/10 text-neon-success border-neon-success/30'
              : 'bg-neon-danger/10 text-neon-danger border-neon-danger/30'
          }`}
        >
          {actionMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Regra de Ouro / Bloqueio Comercial */}
      <div className="p-3.5 rounded-control bg-surface border border-border text-xs flex items-start space-x-3">
        <ShieldCheck className="w-4 h-4 text-neon-blue shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-ink">Princípio de Governança Comercial:</span>
          <p className="text-muted leading-relaxed">
            Nenhum projeto sob demanda entra em desenvolvimento antes do aceite formal da proposta e da autorização interna da plataforma. O código é implementado e homologado em esteira isolada, sem alterar o núcleo da plataforma.
          </p>
        </div>
      </div>

      {/* TAB 1: CATÁLOGO */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Provedores e Conectores Homologados</h2>
            <span className="text-xs text-muted font-mono">{catalog.length} provedores listados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map((prov) => (
              <div key={prov.id} className="card-neon p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
                      {prov.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        prov.catalogStatus === 'AVAILABLE'
                          ? 'bg-neon-success/10 text-neon-success'
                          : 'bg-neon-gold/10 text-neon-gold'
                      }`}
                    >
                      {prov.catalogStatus}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-ink">{prov.name}</h3>
                  <p className="text-xs text-muted line-clamp-2">
                    Squad: <strong>{prov.squad}</strong> • Auth: {prov.authMethods?.join(', ') || 'API_KEY'}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted">
                    {prov.supportsWebhooks ? 'Webhooks ativos' : 'Polling'}
                  </span>
                  <button
                    onClick={() => {
                      setRequestProvider(prov.name);
                      setActiveTab('request');
                    }}
                    className="text-xs font-semibold text-neon-blue hover:underline flex items-center space-x-1"
                  >
                    <span>Solicitar Projeto</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SOLICITAR INTEGRAÇÃO */}
      {activeTab === 'request' && (
        <div className="card-neon p-6 max-w-2xl mx-auto space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-bold text-ink font-display">Solicitar Nova Integração Sob Demanda</h2>
            <p className="text-xs text-muted mt-1">
              Descreva sua necessidade técnica ou comercial. O Supervisor e os agentes especialistas estruturarão o escopo e orçamento para sua análise.
            </p>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-ink mb-1">
                Nome da Ferramenta, ERP ou Provedor:
              </label>
              <input
                type="text"
                value={requestProvider}
                onChange={(e) => setRequestProvider(e.target.value)}
                placeholder="Ex.: SAP Business One, Bitrix24, TOTVS Protheus, Omie, Custom API..."
                className="w-full p-2.5 rounded-control bg-surface border border-border text-ink focus:outline-none focus:border-neon-blue"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink mb-1">
                Objetivo Comercial e Processos a Integrar (*):
              </label>
              <textarea
                rows={4}
                required
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                placeholder="Ex.: Quero integrar o ERP da minha empresa ao Birthub 360 para sincronizar clientes, contratos e faturamento em tempo real..."
                className="w-full p-2.5 rounded-control bg-surface border border-border text-ink focus:outline-none focus:border-neon-blue"
              />
            </div>

            <div className="p-3 rounded-control bg-surface2 border border-border text-[11px] text-muted space-y-1">
              <strong>Próximas Etapas Obrigatórias:</strong>
              <p>1. Discovery automatizado de dados e volumetria.</p>
              <p>2. Estudo de viabilidade técnica pelos agentes de engenharia.</p>
              <p>3. Apresentação formal de escopo e proposta comercial.</p>
              <p>4. Desenvolvimento iniciado <em>somente após seu aceite formal</em>.</p>
            </div>

            <button
              type="submit"
              disabled={submittingRequest}
              className="w-full py-2.5 rounded-control bg-neon-blue text-white font-bold hover:bg-neon-blue/90 transition-colors flex items-center justify-center space-x-2"
            >
              {submittingRequest ? (
                <span>Criando Solicitação...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Enviar Solicitação para Análise</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MEUS PROJETOS */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Projetos de Integração da Organização</h2>
            <button
              onClick={() => setActiveTab('request')}
              className="px-3 py-1.5 rounded-control bg-neon-blue text-white text-xs font-semibold hover:bg-neon-blue/90"
            >
              Nova Solicitação
            </button>
          </div>

          <div className="card-neon overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface2 text-muted border-b border-border">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Título / Provedor</th>
                  <th className="p-3">Squad</th>
                  <th className="p-3">Status do Ciclo de Vida</th>
                  <th className="p-3">Proposta Atual</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-surface2/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-neon-blue">{proj.code}</td>
                    <td className="p-3 font-semibold text-ink">{proj.title}</td>
                    <td className="p-3 font-mono text-[11px] text-muted">{proj.squad || 'CUSTOM'}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-mono font-bold bg-surface2 border border-border text-ink">
                        {proj.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {proj.proposals?.[0] ? (
                        <span className="text-muted font-mono">
                          {proj.proposals[0].proposalNumber} ({proj.proposals[0].versions?.[0]?.status || 'PENDENTE'})
                        </span>
                      ) : (
                        <span className="text-muted italic">Em Discovery</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          loadProjectDetail(proj.id);
                          setActiveTab('detail');
                        }}
                        className="px-2.5 py-1 rounded bg-surface2 hover:bg-surface text-neon-blue font-semibold text-xs border border-border"
                      >
                        Abrir Projeto
                      </button>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted">
                      Nenhum projeto de integração solicitado até o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DETALHES DO PROJETO (DISCOVERY, ESCOPO, PROPOSTA, ACEITE, ESTEIRA) */}
      {activeTab === 'detail' && selectedProject && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-neon-blue font-bold text-sm">{selectedProject.code}</span>
                <h2 className="text-base font-bold text-ink">{selectedProject.title}</h2>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Squad: <strong>{selectedProject.squad}</strong> | Status Atual:{' '}
                <span className="font-mono font-bold text-ink">{selectedProject.status}</span>
              </p>
            </div>
            <button
              onClick={() => setActiveTab('projects')}
              className="text-xs text-muted hover:text-ink underline"
            >
              Voltar aos projetos
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1 & 2: Discovery e Proposta */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card de Discovery */}
              <div className="card-neon p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-ink uppercase tracking-wider flex items-center space-x-2">
                    <Search className="w-4 h-4 text-neon-blue" />
                    <span>Discovery & Requisitos Técnicos</span>
                  </h3>
                  <span className="text-[11px] font-mono text-neon-blue">
                    Completude: {selectedProject.discovery?.completeness || 0}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-muted font-medium mb-1">Ferramenta Alvo:</label>
                    <input
                      type="text"
                      value={discoveryToolName}
                      onChange={(e) => setDiscoveryToolName(e.target.value)}
                      className="w-full p-2 rounded bg-surface border border-border text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-muted font-medium mb-1">Direção do Fluxo:</label>
                    <select
                      value={discoveryDirection}
                      onChange={(e) => setDiscoveryDirection(e.target.value)}
                      className="w-full p-2 rounded bg-surface border border-border text-ink"
                    >
                      <option value="INBOUND">INBOUND (Apenas importar)</option>
                      <option value="OUTBOUND">OUTBOUND (Apenas exportar)</option>
                      <option value="BIDIRECTIONAL">BIDIRECTIONAL (Ambas as vias)</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-muted font-medium mb-1">Objetivo da Integração:</label>
                  <input
                    type="text"
                    value={discoveryObjective}
                    onChange={(e) => setDiscoveryObjective(e.target.value)}
                    className="w-full p-2 rounded bg-surface border border-border text-ink"
                  />
                </div>

                <button
                  onClick={handleUpdateDiscovery}
                  className="px-3 py-1.5 rounded bg-surface2 hover:bg-surface text-ink text-xs font-semibold border border-border"
                >
                  Salvar Respostas do Discovery
                </button>
              </div>

              {/* Somente operadores da plataforma conseguem emitir a proposta final.
                  A API valida PLATFORM_COMMERCIAL/PLATFORM_ADMIN independentemente deste botão. */}
              {userRole === 'ADMIN' && selectedProject.status === 'DISCOVERY' && !selectedProject.proposals?.length && (
                <div className="card-neon p-4 space-y-3">
                  <h3 className="font-bold neon-title-gold">Preparar Escopo e Proposta Comercial</h3>
                  <p className="text-xs text-muted">Acesso exclusivo ao operador da plataforma. Informe valores e evidências reais; a proposta só será enviada após validação.</p>
                  <textarea rows={3} value={quoteDeliverables} onChange={e => setQuoteDeliverables(e.target.value)}
                    placeholder="Entregáveis — um por linha" className="w-full p-2 bg-surface border border-border rounded text-ink text-xs" />
                  <textarea rows={3} value={quoteAcceptance} onChange={e => setQuoteAcceptance(e.target.value)}
                    placeholder="Critérios de aceite — um por linha" className="w-full p-2 bg-surface border border-border rounded text-ink text-xs" />
                  <input value={quoteJustification} onChange={e => setQuoteJustification(e.target.value)}
                    placeholder="Justificativa técnica e comercial" className="w-full p-2 bg-surface border border-border rounded text-ink text-xs" />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label>API oficial verificada?
                      <select value={quoteApiVerified} onChange={e => setQuoteApiVerified(e.target.value as 'UNKNOWN' | 'YES' | 'NO')}
                        className="w-full p-2 bg-surface border border-border rounded text-ink">
                        <option value="UNKNOWN">Não verificada</option><option value="YES">Sim</option><option value="NO">Não (via alternativa documentada)</option>
                      </select>
                    </label>
                    <label>Viabilidade
                      <select value={quoteVerdict} onChange={e => setQuoteVerdict(e.target.value)}
                        className="w-full p-2 bg-surface border border-border rounded text-ink">
                        <option value="UNDETERMINED">Pendente</option>
                        <option value="FEASIBLE">Viável</option>
                        <option value="FEASIBLE_WITH_RESTRICTIONS">Viável com restrições</option>
                        <option value="NOT_FEASIBLE">Inviável</option>
                      </select>
                    </label>
                    <label>Complexidade
                      <select value={quoteComplexity} onChange={e => setQuoteComplexity(e.target.value)}
                        className="w-full p-2 bg-surface border border-border rounded text-ink">
                        <option value="UNKNOWN">Não definida</option>
                        <option value="LOW">Baixa</option><option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option><option value="VERY_HIGH">Muito alta</option>
                      </select>
                    </label>
                    <label>Prazo estimado (dias)
                      <input type="number" min={1} value={quoteTimeline} onChange={e => setQuoteTimeline(Number(e.target.value))}
                        className="w-full p-2 bg-surface border border-border rounded text-ink"/>
                    </label>
                  </div>
                  <input value={quoteDocUrl} onChange={e => setQuoteDocUrl(e.target.value)}
                    placeholder="URL da documentação técnica verificada (obrigatória para API oficial)"
                    className="w-full p-2 bg-surface border border-border rounded text-ink text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    {hourNames.map(name => (
                      <label key={name} className="text-[11px] text-muted">{name}
                        <input type="number" min="0" step="0.5" value={quoteHours[name]}
                          onChange={e => setQuoteHours(prev => ({...prev, [name]: Number(e.target.value)}))}
                          className="w-full p-2 bg-surface border border-border rounded text-ink"/>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={handlePrepareProposal} disabled={preparingQuote}
                    className="w-full p-2 rounded bg-neon-gold/20 border border-neon-gold/50 neon-title-gold text-xs font-bold">
                    {preparingQuote ? 'Validando proposta...' : 'Validar, precificar e enviar ao cliente'}
                  </button>
                </div>
              )}

              {/* Card de Proposta Comercial e Orçamento */}
              {selectedProject.proposals?.[0]?.versions?.[0] ? (
                <div className="card-neon p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div>
                      <h3 className="font-bold text-sm text-ink flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-neon-gold" />
                        <span>Proposta Comercial #{selectedProject.proposals[0].proposalNumber}</span>
                      </h3>
                      <span className="text-[11px] text-muted">
                        Versão {selectedProject.proposals[0].versions[0].version} • Status:{' '}
                        <strong>{selectedProject.proposals[0].versions[0].status}</strong>
                      </span>
                    </div>
                    <span className="text-lg font-bold font-mono text-neon-blue">
                      R$ {Number(selectedProject.proposals[0].versions[0].oneTimeTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-surface2 border border-border text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted">Taxa Única de Implantação & Desenvolvimento:</span>
                      <strong className="font-mono">
                        R$ {Number(selectedProject.proposals[0].versions[0].oneTimeTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Mensalidade de Manutenção & Suporte:</span>
                      <strong className="font-mono">
                        R$ {Number(selectedProject.proposals[0].versions[0].monthlyTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </strong>
                    </div>
                  </div>

                  {/* Termos de Aceite Formal */}
                  {selectedProject.status === 'AWAITING_CUSTOMER_APPROVAL' ||
                  selectedProject.status === 'PROPOSAL_SENT' ||
                  selectedProject.status === 'PROPOSAL_READY' ? (
                    <div className="p-4 rounded-control bg-neon-blue/5 border border-neon-blue/20 space-y-3 text-xs">
                      <div className="flex items-center space-x-2 text-neon-blue font-bold">
                        <Lock className="w-4 h-4" />
                        <span>Aprovação Formal Obrigatória</span>
                      </div>
                      <p className="text-muted leading-relaxed">
                        Para liberar o projeto para desenvolvimento, confirme a ciência dos termos de escopo e clique em aprovar.
                      </p>

                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={effectsAcknowledged}
                            onChange={(e) => setEffectsAcknowledged(e.target.checked)}
                          />
                          <span className="text-ink">Reconheço que o desenvolvimento só terá início após esta aprovação e a autorização interna.</span>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3 pt-2">
                        <button
                          disabled={!effectsAcknowledged || acceptingProposal}
                          onClick={() => handleAcceptProposal('ACCEPTED')}
                          className="px-4 py-2 rounded bg-neon-blue text-white font-bold hover:bg-neon-blue/90 disabled:opacity-50 transition-colors"
                        >
                          {acceptingProposal ? 'Processando Aceite...' : 'Aceitar Proposta e Autorizar'}
                        </button>

                        <button
                          disabled={acceptingProposal}
                          onClick={() => handleAcceptProposal('REJECTED')}
                          className="px-3 py-2 rounded bg-surface text-neon-danger hover:bg-neon-danger/10 text-xs font-semibold"
                        >
                          Rejeitar Proposta
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="card-neon p-6 text-center text-xs text-muted">
                  Aguardando geração de estimativa e validação comercial da proposta pela equipe técnica.
                </div>
              )}
            </div>

            {/* Coluna 3: Esteira e Histórico */}
            <div className="space-y-4">
              <div className="card-neon p-4 space-y-3">
                <h3 className="font-bold text-xs text-ink uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-neon-success" />
                  <span>Esteira Controlada</span>
                </h3>

                {selectedProject.orders?.[0] && (
                  <div className="p-2.5 rounded bg-surface2 border border-border text-xs space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="text-muted">Ordem:</span>
                      <strong className="text-neon-blue">{selectedProject.orders[0].orderNumber}</strong>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-muted">Situação:</span>
                      <strong>{selectedProject.orders[0].status}</strong>
                    </div>

                    {userRole === 'ADMIN' && selectedProject.orders[0].status === 'PENDING_INTERNAL_AUTHORIZATION' && (
                      <button
                        onClick={() => handleAuthorizeOrder(selectedProject.orders[0].id)}
                        className="mt-2 w-full py-1.5 rounded bg-neon-gold text-ink font-bold text-xs hover:bg-neon-gold/90"
                      >
                        Autorizar Ordem Internamente
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-muted">Tarefas da Esteira:</span>
                  {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                    selectedProject.tasks.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-2 rounded bg-surface border border-border text-[11px] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-ink">{t.step}. {t.title}</span>
                          <p className="text-[10px] text-muted">{t.responsibleRole}</p>
                        </div>
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface2">
                          {t.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted italic">
                      Tarefas serão provisionadas após a autorização da ordem.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONEXÕES ATIVAS */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Conexões Operacionais Disponibilizadas</h2>
            <button onClick={loadData} className="text-xs text-muted hover:text-ink flex items-center space-x-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((conn) => (
              <div key={conn.id} className="card-neon p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-ink">{conn.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-success/10 text-neon-success font-bold">
                    {conn.status}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Conector: <strong>{conn.connector?.name}</strong> • Direção: {conn.direction}
                </p>
                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-mono text-muted text-[11px]">
                    Última sincronização: {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString('pt-BR') : 'Nunca'}
                  </span>
                  <button
                    onClick={() => handleRunReconciliation(conn.id)}
                    className="px-2.5 py-1 rounded bg-surface2 hover:bg-surface text-neon-blue font-semibold text-xs border border-border"
                  >
                    Reconciliar
                  </button>
                </div>
              </div>
            ))}
            {connections.length === 0 && (
              <div className="col-span-2 card-neon p-8 text-center text-muted text-xs">
                Nenhuma conexão ativa configurada na organização.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: GOVERNANÇA & PREÇOS (ADMINISTRADOR) */}
      {activeTab === 'admin' && userRole === 'ADMIN' && pricingAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">Tabela Administrativa de Precificação Comercial</h2>
            <span className="text-xs text-muted font-mono">Política Oficial 2026</span>
          </div>

          <div className="card-neon overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface2 text-muted border-b border-border">
                <tr>
                  <th className="p-3">Chave do Parâmetro</th>
                  <th className="p-3">Descrição / Disciplina</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3 text-right">Valor Padrão (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pricingAdmin.parameters?.map((p: any) => (
                  <tr key={p.id}>
                    <td className="p-3 font-mono font-bold text-ink">{p.key}</td>
                    <td className="p-3 text-muted">{p.label}</td>
                    <td className="p-3 font-mono text-[11px] text-muted">{p.category}</td>
                    <td className="p-3 text-right font-mono font-bold text-neon-blue">
                      <input type="number" min="0" step="0.01" aria-label={p.key}
                        value={pricingDraft[p.key] ?? (p.value == null ? '' : String(p.value))}
                        onChange={e => setPricingDraft(prev => ({...prev, [p.key]: e.target.value}))}
                        className="w-24 p-1 bg-surface border border-border text-ink rounded" />
                      <button type="button" onClick={() => handleSavePricing(p.key, p.value)}
                        className="ml-2 text-neon-blue underline">Salvar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
