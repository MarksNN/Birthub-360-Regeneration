import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { loadUserActor, assertPlatformOperator } from './domain/actor';
import { IntegrationDiscoveryService } from './services/discovery.service';
import { IntegrationFeasibilityService } from './services/feasibility.service';
import { IntegrationApprovalService } from './services/approval.service';
import { IntegrationDevelopmentPipelineService } from './services/development-pipeline.service';
import { IntegrationSyncEngineService } from './services/sync-engine.service';
import { IntegrationCommercialEngine } from './commercial/pricing.engine';
import { ProposalArtifactGenerator } from './commercial/proposal.generator';
import { IntegrationProposalService } from './commercial/quote.service';
import { CommercialLockService } from './services/commercial-lock.service';
import { ConnectorRegistry } from './sdk/registry';
import { IntegrationProjectStatus, ProposalKind, ProposalVersionStatus, ApprovalDecision, ConnectorCatalogStatus } from '@prisma/client';

const router = Router();

// Webhook endpoint (externo/autenticado por assinatura)
router.post('/webhooks/:connectionId', async (req, res): Promise<void> => {
  try {
    const { connectionId } = req.params;
    const connection = await prisma.integrationConnection.findUnique({
      where: { id: connectionId }
    });

    if (!connection) {
      res.status(404).json({ success: false, error: 'Conexão não encontrada' });
      return;
    }

    const result = await IntegrationSyncEngineService.receiveWebhookEvent({
      connectionId,
      organizationId: connection.organizationId,
      headers: req.headers as any,
      body: req.body
    });

    res.status(result.duplicate ? 200 : 202).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// A partir daqui, todas as rotas exigem autenticação
router.use(authenticateToken);

// ---------------------------------------------------------------- Catálogo
router.get('/catalog', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const category = req.query.category as string | undefined;

    const providers = await prisma.integrationProvider.findMany({
      where: category ? { category } : {},
      include: {
        connectors: {
          where: {
            OR: [
              { visibility: 'SHARED' },
              { ownerOrganizationId: orgId }
            ]
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: providers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------- Solicitações & Projetos
const createRequestSchema = z.object({
  rawRequest: z.string().min(5, 'A descrição da necessidade é obrigatória'),
  requestedProviderName: z.string().optional(),
  channel: z.enum(['FORM', 'SUPERVISOR']).default('FORM')
});

router.post('/requests', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = createRequestSchema.parse(req.body);
    const orgId = req.user!.organizationId;
    const userId = req.user!.userId;
    const actor = await loadUserActor(userId, data.channel === 'SUPERVISOR' ? 'SUPERVISOR' : 'UI');

    // 1. Criar IntegrationRequest
    const request = await prisma.integrationRequest.create({
      data: {
        organizationId: orgId,
        requestedById: userId,
        channel: data.channel,
        requestedProviderName: data.requestedProviderName || null,
        rawRequest: data.rawRequest
      }
    });

    // 2. Resolver Squad
    const squad = IntegrationFeasibilityService.resolveSquad(data.requestedProviderName || data.rawRequest);

    // 3. Gerar Código do Projeto
    const projCount = await prisma.integrationProject.count();
    const code = `PROJ-INT-${new Date().getFullYear()}-${String(projCount + 1).padStart(4, '0')}`;

    // 4. Criar Projeto em REQUESTED
    const project = await prisma.integrationProject.create({
      data: {
        organizationId: orgId,
        requestId: request.id,
        code,
        title: `Integração ${data.requestedProviderName || 'Sob Demanda'} — ${orgId.slice(0, 8)}`,
        squad,
        status: IntegrationProjectStatus.REQUESTED
      }
    });

    // 5. Inicializar Discovery
    await IntegrationDiscoveryService.initializeDiscovery(project.id, orgId, {
      toolName: data.requestedProviderName,
      objective: data.rawRequest
    });

    // 6. Transicionar para DISCOVERY
    await CommercialLockService.transition(
      project.id,
      orgId,
      IntegrationProjectStatus.DISCOVERY,
      actor,
      'Solicitação inicial recebida. Discovery automatizado aberto.'
    );

    res.status(201).json({ success: true, data: { request, project } });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.get('/projects', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const projects = await prisma.integrationProject.findMany({
      where: { organizationId: orgId },
      include: {
        provider: true,
        discovery: true,
        proposals: {
          include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
        },
        approvals: { take: 1, orderBy: { decidedAt: 'desc' } },
        orders: { take: 1, orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { step: 'asc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const project = await prisma.integrationProject.findFirst({
      where: { id: req.params.id, organizationId: orgId },
      include: {
        provider: true,
        discovery: true,
        feasibilities: { orderBy: { version: 'desc' } },
        scopes: { orderBy: { version: 'desc' } },
        estimates: { orderBy: { createdAt: 'desc' } },
        proposals: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              include: { approvals: true }
            }
          }
        },
        approvals: { orderBy: { decidedAt: 'desc' } },
        orders: { orderBy: { createdAt: 'desc' } },
        milestones: { orderBy: { sequence: 'asc' } },
        tasks: { orderBy: { step: 'asc' } },
        releases: { orderBy: { createdAt: 'desc' } },
        changeRequests: { orderBy: { createdAt: 'desc' } },
        history: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!project) {
      res.status(404).json({ success: false, error: 'Projeto não encontrado na organização atual' });
      return;
    }

    // Custos internos e regras de margem são exclusivos do operador da plataforma.
    const publicProject = {
      ...project,
      estimates: project.estimates.map(({ internalBreakdown, pricingSnapshot, ...publicEstimate }) => publicEstimate)
    };
    res.json({ success: true, data: publicProject });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------- Discovery
router.patch('/projects/:id/discovery', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const actor = await loadUserActor(req.user!.userId, 'UI');

    const updated = await IntegrationDiscoveryService.updateDiscovery(
      req.params.id,
      orgId,
      req.body,
      actor
    );

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------- Aceite Eletrônico
const acceptProposalSchema = z.object({
  proposalVersionId: z.string(),
  decision: z.enum(['ACCEPTED', 'REJECTED']),
  effectsAcknowledged: z.boolean(),
  conditionsAccepted: z.record(z.boolean()),
  rejectionReason: z.string().optional()
});

router.post('/projects/:id/proposals/accept', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = acceptProposalSchema.parse(req.body);
    const orgId = req.user!.organizationId;
    const actor = await loadUserActor(req.user!.userId, 'UI');

    const result = await IntegrationApprovalService.recordCustomerApproval(
      req.params.id,
      orgId,
      {
        ...data,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      },
      actor
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------- Aceite Final da Entrega
router.post('/projects/:id/delivery/accept', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { releaseId } = req.body;
    const orgId = req.user!.organizationId;
    const actor = await loadUserActor(req.user!.userId, 'UI');

    const result = await IntegrationDevelopmentPipelineService.acceptDeliveryByCustomer(
      releaseId,
      req.params.id,
      orgId,
      actor
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------- Conexões Ativas & Sync
router.get('/connections', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const connections = await prisma.integrationConnection.findMany({
      where: { organizationId: orgId },
      include: {
        connector: true,
        syncRuns: { take: 5, orderBy: { startedAt: 'desc' } }
      }
    });

    res.json({ success: true, data: connections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/connections/:id/reconcile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const result = await IntegrationSyncEngineService.runReconciliation(req.params.id, orgId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// A proposta comercial inicial só pode ser emitida por operador da plataforma.
const hours = z.number().finite().min(0);
const effortSchema = z.object({
  analysisHours: hours, developmentHours: hours, apiIntegrationHours: hours,
  dataMappingHours: hours, initialMigrationHours: hours, testingHours: hours,
  homologationHours: hours, documentationHours: hours,
  deploymentHours: hours, trainingHours: hours
});
const proposalInputSchema = z.object({
  effort: effortSchema,
  options: z.object({
    includeMaintenanceMonthly: z.boolean().optional(),
    includePremiumSupportMonthly: z.boolean().optional(),
    externalLicensesMonthly: hours.optional(),
    projectedApiConsumptionMonthly: hours.optional()
  }).optional(),
  discountPct: z.number().finite().min(0).max(100).optional(),
  validityDays: z.number().int().min(1).max(90).optional(),
  scope: z.object({
    objective: z.string().min(10),
    justification: z.string().min(5),
    deliverables: z.array(z.string()).min(1),
    includedFeatures: z.array(z.string()).min(1),
    excludedFeatures: z.array(z.string()),
    integratedEntities: z.array(z.object({
      name: z.string(), localTarget: z.string(),
      fields: z.array(z.string()), syncDirection: z.string()
    })),
    syncFlows: z.array(z.string()),
    dependencies: z.array(z.string()),
    clientPrerequisites: z.array(z.string()),
    acceptanceCriteria: z.array(z.string()).min(1),
    limitations: z.array(z.string()),
    estimatedTimelineDays: z.number().int().min(1),
    risksAndAssumptions: z.array(z.string())
  }),
  feasibility: z.object({
    verdict: z.enum(['FEASIBLE', 'FEASIBLE_WITH_RESTRICTIONS', 'NOT_FEASIBLE', 'UNDETERMINED']),
    complexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'UNKNOWN']),
    hasOfficialApi: z.boolean().nullable(),
    documentationUrl: z.string().url().optional().nullable(),
    authMethods: z.array(z.string()),
    supportsWebhooks: z.boolean().nullable(),
    readCapabilities: z.array(z.string()),
    writeCapabilities: z.array(z.string()),
    risks: z.array(z.string()),
    uncertainties: z.array(z.string()),
    reusableConnectorIds: z.array(z.string()),
    requiresPaidDiscovery: z.boolean(),
    rateLimitNotes: z.string().optional().nullable(),
    licensingDependencies: z.string().optional().nullable()
  })
});
router.post('/admin/projects/:id/proposal', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = await loadUserActor(req.user!.userId, 'API');
    const payload = proposalInputSchema.parse(req.body);
    const result = await IntegrationProposalService.prepareAndSend(req.params.id, payload, actor);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------- Administração da Plataforma
router.get('/admin/pricing-parameters', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = await loadUserActor(req.user!.userId, 'API');
    assertPlatformOperator(actor, ['PLATFORM_COMMERCIAL', 'PLATFORM_ADMIN'], 'consultar custos internos');
    const params = await prisma.integrationPricingParameter.findMany({
      orderBy: { category: 'asc' }
    });
    const policy = await prisma.integrationPricingPolicy.findFirst({ where: { isActive: true } });
    res.json({ success: true, data: { parameters: params, policy } });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
});

// Edição dos parâmetros comerciais: exclusivamente operador humano da plataforma.
router.patch('/admin/pricing-parameters/:key', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = await loadUserActor(req.user!.userId, 'API');
    assertPlatformOperator(actor, ['PLATFORM_COMMERCIAL', 'PLATFORM_ADMIN'], 'configurar preços');
    const { value } = z.object({ value: z.number().finite().min(0) }).parse(req.body);
    const param = await prisma.integrationPricingParameter.update({
      where: { key: req.params.key },
      data: { value, updatedById: actor.userId }
    });
    res.json({ success: true, data: param });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/admin/orders/:orderId/authorize', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = await loadUserActor(req.user!.userId, 'API');
    const order = await IntegrationApprovalService.authorizeProjectInternally(
      req.params.orderId,
      actor,
      req.body.paymentStatus || 'CONFIRMED'
    );
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

router.post('/admin/releases/:releaseId/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const actor = await loadUserActor(req.user!.userId, 'API');
    const release = await IntegrationDevelopmentPipelineService.approveReleaseTechnically(
      req.params.releaseId,
      actor,
      req.body.notes
    );
    res.json({ success: true, data: release });
  } catch (err: any) {
    res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

export default router;
