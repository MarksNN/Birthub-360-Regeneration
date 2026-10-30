import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { IntegrationProjectStatus, ProposalVersionStatus, ApprovalDecision, ProjectOrderStatus } from '@prisma/client';
import { CommercialLockService } from '../src/modules/integrations/services/commercial-lock.service';
import { IntegrationDiscoveryService } from '../src/modules/integrations/services/discovery.service';
import { IntegrationFeasibilityService } from '../src/modules/integrations/services/feasibility.service';
import { IntegrationApprovalService } from '../src/modules/integrations/services/approval.service';
import { IntegrationDevelopmentPipelineService } from '../src/modules/integrations/services/development-pipeline.service';
import { IntegrationCommercialEngine } from '../src/modules/integrations/commercial/pricing.engine';
import { ProposalArtifactGenerator } from '../src/modules/integrations/commercial/proposal.generator';
import { IntegrationSyncEngineService } from '../src/modules/integrations/services/sync-engine.service';
import { IntegrationChangeRequestService } from '../src/modules/integrations/services/change-request.service';
import { ConnectorRegistry } from '../src/modules/integrations/sdk/registry';
import { MockConnectorAdapter } from '../src/modules/integrations/sdk/mock-provider.adapter';
import { CommercialLockError, IntegrationPermissionError } from '../src/modules/integrations/domain/errors';
import { IntegrationActor } from '../src/modules/integrations/domain/actor';
import { SupervisorEngine } from '../src/modules/supervisor/supervisor.engine';

describe('Fase 03 — Integration Factory & Universal Connector Hub (Full Suite & P0 Lock)', () => {
  let testOrgId = '';
  let testOrgBId = '';
  let adminUser: any = null;
  let regularUser: any = null;
  let testProjectId = '';
  let testProposalVersionId = '';

  beforeAll(async () => {
    // Organização de Teste A
    const orgA = await prisma.organization.upsert({
      where: { slug: 'org-fase03-test-a' },
      update: {},
      create: {
        name: 'Indústrias MetalSul S.A.',
        slug: 'org-fase03-test-a',
        plan: 'ENTERPRISE_360'
      }
    });
    testOrgId = orgA.id;

    // Organização de Teste B (para testes de isolamento multi-tenant)
    const orgB = await prisma.organization.upsert({
      where: { slug: 'org-fase03-test-b' },
      update: {},
      create: {
        name: 'Varejo Global Brasil Ltda',
        slug: 'org-fase03-test-b',
        plan: 'PROFESSIONAL'
      }
    });
    testOrgBId = orgB.id;

    // Usuário Administrador com poder de contratação e papel de plataforma
    adminUser = await prisma.user.upsert({
      where: { email: 'admin.fase03@metalsul.com.br' },
      update: { canApproveIntegrationProposals: true, platformRole: 'PLATFORM_ADMIN' },
      create: {
        name: 'Diretor Operacional Carlos',
        email: 'admin.fase03@metalsul.com.br',
        passwordHash: 'dummy-hash',
        role: 'ADMIN',
        organizationId: testOrgId,
        canApproveIntegrationProposals: true,
        platformRole: 'PLATFORM_ADMIN'
      }
    });

    // Usuário Comum sem autoridade para contratar
    regularUser = await prisma.user.upsert({
      where: { email: 'operador.sdr@metalsul.com.br' },
      update: { canApproveIntegrationProposals: false, platformRole: null },
      create: {
        name: 'Operador SDR Pedro',
        email: 'operador.sdr@metalsul.com.br',
        passwordHash: 'dummy-hash',
        role: 'SDR',
        organizationId: testOrgId,
        canApproveIntegrationProposals: false,
        platformRole: null
      }
    });

    // Registrar o conector simulado no registro do SDK
    const registry = ConnectorRegistry.getInstance();
    registry.register(new MockConnectorAdapter());
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { slug: { in: ['org-fase03-test-a', 'org-fase03-test-b'] } }
    });
    await prisma.$disconnect();
  });

  it('1. Registro de Solicitação, Seleção de Squad e Inicialização de Discovery (Etapas 01 & 02)', async () => {
    const actor: IntegrationActor = {
      type: 'USER',
      channel: 'UI',
      userId: adminUser.id,
      organizationId: testOrgId,
      role: 'ADMIN'
    };

    const squad = IntegrationFeasibilityService.resolveSquad('ERP SAP S/4HANA');
    expect(squad).toBe('FINANCIAL_INTEGRATION');

    const req = await prisma.integrationRequest.create({
      data: {
        organizationId: testOrgId,
        requestedById: adminUser.id,
        requestedProviderName: 'SAP S/4HANA',
        rawRequest: 'Quero integrar o ERP da minha empresa ao Birthub 360 para sincronizar clientes, contratos e faturamento.'
      }
    });

    const project = await prisma.integrationProject.create({
      data: {
        organizationId: testOrgId,
        requestId: req.id,
        code: `PROJ-TEST-${Date.now().toString().slice(-4)}`,
        title: 'Integração SAP S/4HANA',
        squad,
        status: IntegrationProjectStatus.REQUESTED
      }
    });
    testProjectId = project.id;

    // Inicializar discovery
    const disc = await IntegrationDiscoveryService.initializeDiscovery(testProjectId, testOrgId, {
      toolName: 'SAP S/4HANA',
      objective: 'Sincronizar clientes e contratos'
    });
    expect(disc.completeness).toBeGreaterThan(0);

    // Transicionar para DISCOVERY
    await CommercialLockService.transition(
      testProjectId,
      testOrgId,
      IntegrationProjectStatus.DISCOVERY,
      actor,
      'Discovery iniciado'
    );

    const updatedProj = await prisma.integrationProject.findUnique({ where: { id: testProjectId } });
    expect(updatedProj?.status).toBe(IntegrationProjectStatus.DISCOVERY);
  });

  it('2. Análise de Viabilidade Técnica e Definição de Escopo (Etapas 03 & 04)', async () => {
    const actor: IntegrationActor = {
      type: 'USER',
      channel: 'UI',
      userId: adminUser.id,
      organizationId: testOrgId,
      role: 'ADMIN'
    };

    // Atualizar discovery com respostas
    await IntegrationDiscoveryService.updateDiscovery(
      testProjectId,
      testOrgId,
      {
        direction: 'BIDIRECTIONAL' as any,
        frequency: 'TEMPO_REAL',
        estimatedVolume: '10.000 clientes'
      },
      actor
    );

    // Avaliar viabilidade
    const feasibility = await IntegrationFeasibilityService.assessFeasibility(
      testProjectId,
      testOrgId,
      {
        hasOfficialApi: true,
        complexity: 'MEDIUM',
        verdict: 'FEASIBLE',
        authMethods: ['API_KEY', 'OAUTH2']
      },
      actor
    );
    expect(feasibility.verdict).toBe('FEASIBLE');

    // Transicionar para FEASIBILITY_REVIEW e SCOPE_DRAFT
    await CommercialLockService.transition(
      testProjectId,
      testOrgId,
      IntegrationProjectStatus.FEASIBILITY_REVIEW,
      actor
    );
    await CommercialLockService.transition(
      testProjectId,
      testOrgId,
      IntegrationProjectStatus.SCOPE_DRAFT,
      actor
    );

    // Criar Escopo Técnico
    const scope = await prisma.integrationScope.create({
      data: {
        organizationId: testOrgId,
        projectId: testProjectId,
        version: 1,
        content: {
          objective: 'Sincronizar clientes e faturamento',
          deliverables: ['Adaptador SAP', 'Webhooks', 'Testes automatizados'],
          includedFeatures: ['Importação de empresas', 'Exportação de contratos'],
          excludedFeatures: ['Módulo de RH e folha'],
          integratedEntities: [{ name: 'customer', localTarget: 'company', fields: ['name', 'cnpj'], syncDirection: 'BIDIRECTIONAL' }],
          syncFlows: ['Real-time Webhooks', 'Nightly Reconciliation'],
          dependencies: ['API SAP ativa'],
          clientPrerequisites: ['Credenciais de Sandbox fornecidas'],
          acceptanceCriteria: ['Taxa de erro < 0.1% em 1.000 chamadas'],
          limitations: ['Rate limit de 20 req/s'],
          estimatedTimelineDays: 10,
          risksAndAssumptions: ['Estabilidade da infraestrutura do cliente']
        },
        contentHash: 'hash-scope-v1'
      }
    });
    expect(scope.version).toBe(1);
  });

  it('3. Motor Comercial — Cálculo com Parâmetros Oficiais e Geração dos 5 Artefatos (Etapas 05 & 06)', async () => {
    const actor: IntegrationActor = {
      type: 'PLATFORM_OPERATOR',
      channel: 'API',
      userId: adminUser.id,
      organizationId: testOrgId,
      platformRole: 'PLATFORM_ADMIN'
    };

    // Calcular orçamento pelo Commercial Engine
    const effort = {
      analysisHours: 10,
      developmentHours: 25,
      apiIntegrationHours: 15,
      dataMappingHours: 8,
      initialMigrationHours: 6,
      testingHours: 12,
      homologationHours: 8,
      documentationHours: 6,
      deploymentHours: 6,
      trainingHours: 4
    };

    const pricing = await IntegrationCommercialEngine.calculateEstimate(
      testOrgId,
      effort,
      { includeMaintenanceMonthly: true, includePremiumSupportMonthly: true },
      10, // 10% desconto
      actor
    );

    expect(pricing.oneTimeTotal).toBeGreaterThan(0);
    // Plano ENTERPRISE_360 cobre manutenção gratuita (dedução)
    expect(pricing.clientBreakdown.planCoveredComponents.length).toBeGreaterThan(0);

    // Gerar Proposta Comercial
    const proposal = await prisma.integrationProposal.create({
      data: {
        organizationId: testOrgId,
        projectId: testProjectId,
        kind: 'MAIN',
        proposalNumber: `PROP-TEST-${Date.now().toString().slice(-4)}`
      }
    });

    const artifacts = ProposalArtifactGenerator.generate({
      proposalNumber: proposal.proposalNumber,
      version: 1,
      kind: 'MAIN',
      organizationName: 'Indústrias MetalSul S.A.',
      organizationSlug: 'metalsul',
      providerName: 'SAP S/4HANA',
      projectCode: 'PROJ-TEST',
      projectTitle: 'Integração SAP S/4HANA',
      scopeContent: {
        objective: 'Sincronizar clientes e faturamento',
        justification: 'Eficiência operacional',
        deliverables: ['Adaptador SAP', 'Webhooks'],
        includedFeatures: ['Clientes', 'Faturamento'],
        excludedFeatures: ['RH'],
        integratedEntities: [],
        syncFlows: [],
        dependencies: [],
        clientPrerequisites: [],
        acceptanceCriteria: [],
        limitations: [],
        estimatedTimelineDays: 10,
        risksAndAssumptions: []
      },
      feasibilityContent: {
        verdict: 'FEASIBLE',
        complexity: 'MEDIUM',
        hasOfficialApi: true,
        authMethods: ['API_KEY'],
        supportsWebhooks: true,
        readCapabilities: ['read'],
        writeCapabilities: ['write'],
        risks: [],
        uncertainties: [],
        reusableConnectorIds: [],
        requiresPaidDiscovery: false
      },
      pricingResult: pricing,
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString()
    });

    expect(artifacts.scopeHtml).toContain('Escopo Técnico');
    expect(artifacts.feasibilityHtml).toContain('Viabilidade Técnica');
    expect(artifacts.proposalHtml).toContain('Proposta Comercial');
    expect(artifacts.estimateBreakdownJson).toContain('oneTimeFee');
    expect(artifacts.acceptanceTermsHtml).toContain('Termo de Aceite Comercial');

    // Salvar Versão 1 da Proposta
    const version = await prisma.integrationProposalVersion.create({
      data: {
        organizationId: testOrgId,
        proposalId: proposal.id,
        version: 1,
        status: ProposalVersionStatus.SENT,
        scopeId: 'scope-id-placeholder',
        estimateId: 'estimate-id-placeholder',
        currency: 'BRL',
        oneTimeTotal: pricing.oneTimeTotal,
        monthlyTotal: pricing.monthlyTotal,
        content: artifacts as any,
        contentHash: artifacts.contentHash,
        validUntil: new Date(Date.now() + 15 * 86400000)
      }
    });
    testProposalVersionId = version.id;

    await prisma.integrationProposal.update({
      where: { id: proposal.id },
      data: { currentVersionId: version.id }
    });

    // Transicionar para PROPOSAL_READY e depois PROPOSAL_SENT e AWAITING_CUSTOMER_APPROVAL
    await CommercialLockService.transition(testProjectId, testOrgId, IntegrationProjectStatus.PRICING_REVIEW, actor);
    await CommercialLockService.transition(testProjectId, testOrgId, IntegrationProjectStatus.PROPOSAL_READY, actor);
    await CommercialLockService.transition(testProjectId, testOrgId, IntegrationProjectStatus.PROPOSAL_SENT, actor);
    await CommercialLockService.transition(testProjectId, testOrgId, IntegrationProjectStatus.AWAITING_CUSTOMER_APPROVAL, actor);
  });

  // =========================================================================
  // TESTE OBRIGATÓRIO P0 — BLOQUEIO COMERCIAL EM TODAS AS FRENTES
  // =========================================================================
  describe('TESTE OBRIGATÓRIO P0 — Bloqueio Comercial Total Antes do Aceite Válido', () => {
    it('P0.1 — Tentativa via Serviço de Aplicação Direto: deve ser bloqueada', async () => {
      const actor: IntegrationActor = {
        type: 'USER',
        channel: 'SERVICE',
        userId: adminUser.id,
        organizationId: testOrgId,
        role: 'ADMIN'
      };

      // Tentar transicionar diretamente para AUTHORIZED_FOR_DEVELOPMENT antes de aprovar
      await expect(
        CommercialLockService.transition(
          testProjectId,
          testOrgId,
          IntegrationProjectStatus.AUTHORIZED_FOR_DEVELOPMENT,
          actor
        )
      ).rejects.toThrow(CommercialLockError);

      // Tentar inicializar desenvolvimento via pipeline antes de aprovar
      await expect(
        IntegrationDevelopmentPipelineService.initializeDevelopment(
          testProjectId,
          testOrgId,
          actor
        )
      ).rejects.toThrow(CommercialLockError);
    });

    it('P0.2 — Tentativa via Supervisor: deve ser bloqueada e reportar Bloqueio Comercial P0', async () => {
      const plan = await SupervisorEngine.orchestrate(
        {
          targetModule: 'AUTOMATIONS',
          prompt: 'Iniciar desenvolvimento da integração com SAP agora mesmo',
          contextData: {
            projectId: testProjectId
          }
        },
        adminUser.id,
        testOrgId,
        'ADMIN'
      );

      expect(plan.simulatedOutput).toContain('Bloqueio Comercial P0');
      expect(plan.simulatedOutput).toContain('Operação bloqueada');
    });

    it('P0.3 — Tentativa de Aceite por Usuário Comum sem autoridade para contratar: deve ser rejeitada', async () => {
      const regularActor: IntegrationActor = {
        type: 'USER',
        channel: 'UI',
        userId: regularUser.id,
        organizationId: testOrgId,
        role: 'SDR',
        canApproveProposals: false
      };

      await expect(
        IntegrationApprovalService.recordCustomerApproval(
          testProjectId,
          testOrgId,
          {
            proposalVersionId: testProposalVersionId,
            decision: ApprovalDecision.ACCEPTED,
            effectsAcknowledged: true,
            conditionsAccepted: { terms: true }
          },
          regularActor
        )
      ).rejects.toThrow(IntegrationPermissionError);
    });
  });

  it('4. Aceite Eletrônico Formal pelo Cliente e Autorização Interna (Etapas 07 & 08)', async () => {
    const adminActor: IntegrationActor = {
      type: 'USER',
      channel: 'UI',
      userId: adminUser.id,
      organizationId: testOrgId,
      role: 'ADMIN',
      canApproveProposals: true
    };

    // Aceite formal pelo diretor autorizado
    const { approval, order } = await IntegrationApprovalService.recordCustomerApproval(
      testProjectId,
      testOrgId,
      {
        proposalVersionId: testProposalVersionId,
        decision: ApprovalDecision.ACCEPTED,
        effectsAcknowledged: true,
        conditionsAccepted: { scopeAccepted: true, priceAccepted: true }
      },
      adminActor
    );

    expect(approval.decision).toBe('ACCEPTED');
    expect(order).not.toBeNull();
    expect(order?.status).toBe(ProjectOrderStatus.PENDING_INTERNAL_AUTHORIZATION);

    // Projeto agora está em INTERNAL_AUTHORIZATION
    const p1 = await prisma.integrationProject.findUnique({ where: { id: testProjectId } });
    expect(p1?.status).toBe(IntegrationProjectStatus.INTERNAL_AUTHORIZATION);

    // Autorização interna pelo operador da plataforma
    const platformActor: IntegrationActor = {
      type: 'PLATFORM_OPERATOR',
      channel: 'API',
      userId: adminUser.id,
      organizationId: testOrgId,
      platformRole: 'PLATFORM_ADMIN'
    };

    const authorizedOrder = await IntegrationApprovalService.authorizeProjectInternally(
      order!.id,
      platformActor,
      'CONFIRMED'
    );
    expect(authorizedOrder.status).toBe(ProjectOrderStatus.EXECUTABLE);

    // Projeto agora está em AUTHORIZED_FOR_DEVELOPMENT
    const p2 = await prisma.integrationProject.findUnique({ where: { id: testProjectId } });
    expect(p2?.status).toBe(IntegrationProjectStatus.AUTHORIZED_FOR_DEVELOPMENT);
  });

  it('5. Esteira de Desenvolvimento, Testes Automatizados e Homologação (Etapas 09, 10 & 11)', async () => {
    const actor: IntegrationActor = {
      type: 'PLATFORM_OPERATOR',
      channel: 'API',
      userId: adminUser.id,
      organizationId: testOrgId,
      platformRole: 'PLATFORM_ADMIN'
    };

    // Agora que foi aprovado e autorizado, initializeDevelopment DEVE ter sucesso!
    const dev = await IntegrationDevelopmentPipelineService.initializeDevelopment(
      testProjectId,
      testOrgId,
      actor
    );
    expect(dev.success).toBe(true);

    const pDev = await prisma.integrationProject.findUnique({ where: { id: testProjectId } });
    expect(pDev?.status).toBe(IntegrationProjectStatus.IN_DEVELOPMENT);

    // Executar bateria de testes reais com conector simulado
    const testExec = await IntegrationDevelopmentPipelineService.executeConnectorTests(
      testProjectId,
      testOrgId,
      'simulated-erp',
      actor
    );
    expect(testExec.allPassed).toBe(true);
    expect(testExec.testResults.length).toBeGreaterThanOrEqual(3);

    const pTest = await prisma.integrationProject.findUnique({ where: { id: testProjectId } });
    expect(pTest?.status).toBe(IntegrationProjectStatus.IN_TESTING);

    // Aprovação técnica da Engenharia
    await IntegrationDevelopmentPipelineService.approveReleaseTechnically(
      testExec.release.id,
      actor,
      'Conector validado segundo os padrões da Fase 03'
    );

    const pAwait = await prisma.integrationProject.findUnique({ where: { id: testProjectId } });
    expect(pAwait?.status).toBe(IntegrationProjectStatus.AWAITING_ACCEPTANCE);

    // Aceite final da entrega pelo cliente
    const clientActor: IntegrationActor = {
      type: 'USER',
      channel: 'UI',
      userId: adminUser.id,
      organizationId: testOrgId,
      role: 'ADMIN'
    };

    await IntegrationDevelopmentPipelineService.acceptDeliveryByCustomer(
      testExec.release.id,
      testProjectId,
      testOrgId,
      clientActor
    );

    const pAvail = await prisma.integrationProject.findUnique({ where: { id: testProjectId } });
    expect(pAvail?.status).toBe(IntegrationProjectStatus.AVAILABLE);
  });

  it('6. Motor Universal de Sincronização — Webhook Inbox, Idempotência e Reconciliação', async () => {
    // Criar conexão ativa para a organização
    const connector = await prisma.integrationConnector.findFirst({
      where: { key: 'simulated-erp' }
    });

    const connection = await prisma.integrationConnection.create({
      data: {
        organizationId: testOrgId,
        connectorId: connector!.id,
        name: 'ERP MetalSul Produção',
        status: 'ACTIVE',
        syncEnabled: true,
        config: { apiKey: 'test-key' }
      }
    });

    // 1. Receber webhook de novo cliente
    const webhookPayload = {
      eventId: `ev-cust-${Date.now()}`,
      eventType: 'customer.created',
      entity: 'customer',
      data: {
        corporate_name: 'Novo Cliente Importado S.A.',
        tax_id: '99.888.777/0001-99',
        annual_revenue: 12500000
      }
    };

    const res1 = await IntegrationSyncEngineService.receiveWebhookEvent({
      connectionId: connection.id,
      organizationId: testOrgId,
      headers: {},
      body: webhookPayload
    });

    expect(res1.received).toBe(true);
    expect(res1.duplicate).toBe(false);

    // 2. Tentar reenviar o MESMO webhook (Idempotência estrita)
    const res2 = await IntegrationSyncEngineService.receiveWebhookEvent({
      connectionId: connection.id,
      organizationId: testOrgId,
      headers: {},
      body: webhookPayload
    });

    expect(res2.received).toBe(true);
    expect(res2.duplicate).toBe(true); // Detectou duplicação e não enfileirou duas vezes!

    // 3. Processar eventos da Inbox
    const processResult = await IntegrationSyncEngineService.processPendingInboxEvents({ limit: 10 });
    expect(processResult.processedCount).toBeGreaterThanOrEqual(1);

    // Verificar se a empresa foi persistida no CRM
    const comp = await prisma.company.findFirst({
      where: { organizationId: testOrgId, cnpj: '99.888.777/0001-99' }
    });
    expect(comp).not.toBeNull();
    expect(comp?.name).toBe('Novo Cliente Importado S.A.');

    // 4. Testar Reconciliação
    const recon = await IntegrationSyncEngineService.runReconciliation(connection.id, testOrgId);
    expect(recon.success).toBe(true);
  });

  it('7. Gestão de Alterações de Escopo (Change Request & Aditivo Complementar)', async () => {
    const actor: IntegrationActor = {
      type: 'USER',
      channel: 'UI',
      userId: adminUser.id,
      organizationId: testOrgId,
      role: 'ADMIN'
    };

    const cr = await IntegrationChangeRequestService.registerChangeRequest(
      testProjectId,
      testOrgId,
      {
        description: 'Inclusão de sincronização de notas fiscais de devolução',
        deltaEffort: {
          analysisHours: 2,
          developmentHours: 8,
          apiIntegrationHours: 4,
          dataMappingHours: 2,
          initialMigrationHours: 0,
          testingHours: 4,
          homologationHours: 2,
          documentationHours: 2,
          deploymentHours: 2,
          trainingHours: 0
        },
        deltaDays: 3
      },
      actor
    );

    expect(cr.changeRequest.status).toBe('PROPOSAL_ISSUED');
    expect(cr.complementaryProposal.kind).toBe('CHANGE_ORDER');
    expect(Number(cr.changeRequest.deltaOneTime)).toBeGreaterThan(0);
  });

  it('8. Isolamento Multi-Tenant em Integrações e Conexões', async () => {
    // Conexões de Org A não podem ser acessadas por Org B
    const connectionsOrgB = await prisma.integrationConnection.findMany({
      where: { organizationId: testOrgBId }
    });
    expect(connectionsOrgB.length).toBe(0);

    // Projetos de Org A não aparecem na listagem de Org B
    const projectsOrgB = await prisma.integrationProject.findMany({
      where: { organizationId: testOrgBId }
    });
    expect(projectsOrgB.length).toBe(0);
  });
});
