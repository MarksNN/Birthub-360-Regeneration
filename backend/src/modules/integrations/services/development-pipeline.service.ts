import {
  DevelopmentTaskStatus,
  IntegrationProjectStatus,
  ReleaseStatus,
  PrismaClient
} from '@prisma/client';
import prisma from '../../../lib/prisma';
import { CommercialLockService } from './commercial-lock.service';
import { IntegrationNotFoundError, CommercialLockError, IntegrationPermissionError } from '../domain/errors';
import { IntegrationActor, assertPlatformOperator } from '../domain/actor';
import { ConnectorRegistry } from '../sdk/registry';
import { hashDocument } from '../domain/hash';

export interface MilestoneTemplate {
  code: string;
  title: string;
  sequence: number;
}

export const OFFICIAL_MILESTONES: MilestoneTemplate[] = [
  { code: 'M1_PLANNING', title: 'Plano de Implementação e Seleção de Squad', sequence: 1 },
  { code: 'M2_ENVIRONMENT', title: 'Preparação do Ambiente Isolado e Contratos SDK', sequence: 2 },
  { code: 'M3_ADAPTERS', title: 'Desenvolvimento dos Adaptadores (Auth, Inbound/Outbound, Webhook)', sequence: 3 },
  { code: 'M4_TESTS', title: 'Criação e Execução da Suíte de Testes com Provedor Simulado', sequence: 4 },
  { code: 'M5_TECHNICAL_REVIEW', title: 'Revisão Técnica de Engenharia e Homologação', sequence: 5 },
  { code: 'M6_RELEASE', title: 'Disponibilização Controlada e Handoff', sequence: 6 }
];

export class IntegrationDevelopmentPipelineService {
  /**
   * Inicializa o plano de implementação (Milestones e Tarefas) após a autorização comercial.
   * Se o projeto NÃO possuir autorização interna ou estiver antes de AUTHORIZED_FOR_DEVELOPMENT,
   * bloqueia imediatamente!
   */
  public static async initializeDevelopment(
    projectId: string,
    organizationId: string,
    actor: IntegrationActor
  ) {
    const lockCheck = await CommercialLockService.evaluateDevelopmentPreconditions(projectId, organizationId);
    if (!lockCheck.canProceedToDevelopment) {
      throw new CommercialLockError(lockCheck.reasons);
    }

    return prisma.$transaction(async (tx) => {
      const project = await tx.integrationProject.findFirst({
        where: { id: projectId, organizationId },
        include: { orders: { where: { status: 'EXECUTABLE' } } }
      });

      if (!project) throw new IntegrationNotFoundError('Projeto');

      const executableOrder = project.orders[0];
      if (!executableOrder) {
        throw new CommercialLockError(['Nenhuma ordem de projeto executável encontrada.']);
      }

      // Transicionar para IN_DEVELOPMENT se estiver em AUTHORIZED_FOR_DEVELOPMENT
      if (project.status === IntegrationProjectStatus.AUTHORIZED_FOR_DEVELOPMENT) {
        await CommercialLockService.transition(
          projectId,
          organizationId,
          IntegrationProjectStatus.IN_DEVELOPMENT,
          actor,
          'Esteira de desenvolvimento iniciada automaticamente',
          undefined,
          tx
        );
      }

      // 1. Criar Milestones Oficiais
      for (const m of OFFICIAL_MILESTONES) {
        await tx.integrationProjectMilestone.upsert({
          where: { projectId_code: { projectId, code: m.code } },
          update: {},
          create: {
            organizationId,
            projectId,
            code: m.code,
            title: m.title,
            sequence: m.sequence,
            status: m.sequence === 1 ? 'IN_PROGRESS' : 'PENDING'
          }
        });
      }

      // 2. Criar as 12 tarefas detalhadas da esteira controlada
      const tasksPlan = [
        { step: 1, code: 'TASK_SQUAD_ASSIGN', title: 'Confirmar alocação de Squad e agentes especializados', role: 'Integration Discovery Agent', agent: 'api-integration-builder' },
        { step: 2, code: 'TASK_IMPL_PLAN', title: 'Gerar plano detalhado de implementação técnica', role: 'Feasibility Architect', agent: 'api-integration-builder' },
        { step: 3, code: 'TASK_SANDBOX_PREP', title: 'Provisionar ambiente isolado e variáveis de teste', role: 'Integration Security Agent', agent: 'cloud-spend-optimizer' },
        { step: 4, code: 'TASK_SDK_CONTRACT', title: 'Definir ProviderManifest e contratos de permissões', role: 'Connector Development Agent', agent: 'api-integration-builder' },
        { step: 5, code: 'TASK_ADAPTER_AUTH', title: 'Implementar AuthenticationAdapter (OAuth2/API Key)', role: 'Authentication Specialist', agent: 'api-integration-builder' },
        { step: 6, code: 'TASK_MAPPER', title: 'Implementar EntityMapper com sanitização de campos', role: 'Data Mapping Engineer', agent: 'data-cleaning-bot' },
        { step: 7, code: 'TASK_SYNC_ADAPTERS', title: 'Implementar Inbound/Outbound SyncAdapters e Webhooks', role: 'Connector Development Agent', agent: 'api-integration-builder' },
        { step: 8, code: 'TASK_TEST_SUITE', title: 'Desenvolver testes automatizados e casos de borda', role: 'Integration QA Agent', agent: 'webhook-monitor' },
        { step: 9, code: 'TASK_TEST_EXECUTION', title: 'Executar bateria de testes com provedor simulado', role: 'Integration QA Agent', agent: 'webhook-monitor' },
        { step: 10, code: 'TASK_TECH_REVIEW', title: 'Submeter conector para revisão técnica de engenharia', role: 'Integration Release Agent', agent: 'cto' },
        { step: 11, code: 'TASK_HOMOLOGATION', title: 'Homologação e validação de critérios de aceite', role: 'Integration Release Agent', agent: 'handoff-agent' },
        { step: 12, code: 'TASK_RELEASE_STAGING', title: 'Preparar disponibilização controlada', role: 'Customer Success Handoff Agent', agent: 'customer-success' }
      ];

      for (const t of tasksPlan) {
        await tx.integrationDevelopmentTask.create({
          data: {
            organizationId,
            projectId,
            orderId: executableOrder.id,
            step: t.step,
            code: t.code,
            title: t.title,
            squad: project.squad,
            responsibleRole: t.role,
            responsibleAgent: t.agent,
            executor: 'AUTOMATED_PLATFORM_SERVICE',
            status: t.step === 1 ? DevelopmentTaskStatus.IN_PROGRESS : DevelopmentTaskStatus.PENDING,
            startedAt: t.step === 1 ? new Date() : null
          }
        });
      }

      return { success: true, message: 'Plano de implementação e tarefas inicializados com sucesso.' };
    });
  }

  /**
   * Executa a validação técnica de testes no conector (Etapa 10).
   * Registra evidências reais com o provedor simulado ou conector cadastrado.
   */
  public static async executeConnectorTests(
    projectId: string,
    organizationId: string,
    connectorId: string,
    actor: IntegrationActor
  ) {
    const registry = ConnectorRegistry.getInstance();
    const adapter = registry.get(connectorId) || registry.get('simulated-erp');

    if (!adapter) {
      throw new IntegrationNotFoundError(`Conector ${connectorId}`);
    }

    const testResults: Array<{ name: string; ok: boolean; durationMs: number; error?: string }> = [];

    const ctx = {
      organizationId,
      connectionId: 'test-conn-id',
      config: { apiKey: 'test-simulated-key' }
    };

    if (!adapter.testSuite || adapter.testSuite.cases.length === 0) {
      throw new Error('Conector sem suíte obrigatória válida não pode ser tecnicamente homologado.');
    }

    for (const testCase of adapter.testSuite.cases) {
      const start = Date.now();
      try {
        await testCase.run(adapter, ctx);
        testResults.push({
          name: testCase.name,
          ok: true,
          durationMs: Date.now() - start
        });
      } catch (err: any) {
        testResults.push({
          name: testCase.name,
          ok: false,
          durationMs: Date.now() - start,
          error: err.message
        });
      }
    }

    const allPassed = testResults.every((r) => r.ok);

    // Registrar evidência no banco
    const release = await prisma.integrationRelease.create({
      data: {
        organizationId,
        projectId,
        version: adapter.manifest.version,
        status: allPassed ? ReleaseStatus.IN_REVIEW : ReleaseStatus.TECHNICALLY_REJECTED,
        testEvidence: testResults as any,
        submittedById: actor.userId
      }
    });

    // Se todos os testes passaram, transiciona o projeto para IN_TESTING
    if (allPassed) {
      await CommercialLockService.transition(
        projectId,
        organizationId,
        IntegrationProjectStatus.IN_TESTING,
        actor,
        `Bateria de testes automatizados concluída com 100% de sucesso (${testResults.length} testes).`,
        { releaseId: release.id }
      );
    }

    return { release, testResults, allPassed };
  }

  /**
   * Aprovação técnica de Engenharia (Operador da Plataforma) — Etapa 11.
   */
  public static async approveReleaseTechnically(
    releaseId: string,
    actor: IntegrationActor,
    technicalNotes = 'Conector aprovado segundo os padrões de segurança e idempotência da plataforma'
  ) {
    assertPlatformOperator(actor, ['PLATFORM_ENGINEERING', 'PLATFORM_ADMIN'], 'aprovar conector tecnicamente');

    return prisma.$transaction(async (tx) => {
      const release = await tx.integrationRelease.findUnique({
        where: { id: releaseId },
        include: { project: true }
      });

      if (!release) throw new IntegrationNotFoundError('Release');

      const updated = await tx.integrationRelease.update({
        where: { id: release.id },
        data: {
          status: ReleaseStatus.TECHNICALLY_APPROVED,
          technicalReviewerId: actor.userId,
          technicalReviewedAt: new Date(),
          technicalNotes
        }
      });

      // Transicionar projeto para AWAITING_ACCEPTANCE
      await CommercialLockService.transition(
        release.projectId,
        release.organizationId,
        IntegrationProjectStatus.AWAITING_ACCEPTANCE,
        actor,
        'Conector homologado tecnicamente. Aguardando validação final de entrega pelo cliente',
        { releaseId: release.id },
        tx
      );

      return updated;
    });
  }

  /**
   * Aceite final da entrega pelo cliente (Etapa 11).
   */
  public static async acceptDeliveryByCustomer(
    releaseId: string,
    projectId: string,
    organizationId: string,
    actor: IntegrationActor
  ) {
    return prisma.$transaction(async (tx) => {
      const release = await tx.integrationRelease.findFirst({
        where: { id: releaseId, projectId, organizationId }
      });

      if (!release) throw new IntegrationNotFoundError('Release');

      if (release.status !== ReleaseStatus.TECHNICALLY_APPROVED) {
        throw new CommercialLockError(['A release precisa de aprovação técnica prévia antes do aceite final.']);
      }

      await tx.integrationRelease.update({
        where: { id: release.id },
        data: {
          status: ReleaseStatus.CUSTOMER_ACCEPTED,
          customerAcceptedById: actor.userId,
          customerAcceptedAt: new Date()
        }
      });

      // Transicionar projeto para ACCEPTED e em seguida para AVAILABLE
      await CommercialLockService.transition(
        projectId,
        organizationId,
        IntegrationProjectStatus.ACCEPTED,
        actor,
        'Entrega da integração aceita pelo cliente',
        undefined,
        tx
      );

      await CommercialLockService.transition(
        projectId,
        organizationId,
        IntegrationProjectStatus.AVAILABLE,
        actor,
        'Conector disponibilizado para uso operacional',
        undefined,
        tx
      );

      return { success: true, message: 'Entrega aceita e conector disponível operacionalmente.' };
    });
  }
}
