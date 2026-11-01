import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SupervisorEngine } from './supervisor.engine';
import { TenantSecurityError } from '../../lib/tenant-guard';
import { AgentOperationalStatus, AgentScope, UserRole } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

const supervisorPromptSchema = z.object({
  targetModule: z.enum([
    'CRM',
    'HUB',
    'INTELLIGENCE',
    'SALES_ORCHESTRATION',
    'REAL_TIME_PERFORMANCE',
    'REVENUE_FORECAST',
    'COPILOT',
    'AUTOMATIONS',
    'CADENCE'
  ]),
  prompt: z.string().min(2, 'O comando para o Supervisor é obrigatório'),
  agentCode: z.string().optional(),
  contextData: z.record(z.any()).optional()
});

/**
 * Endpoint de interação do Supervisor 360
 */
router.post('/orchestrate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = supervisorPromptSchema.parse(req.body);
    const userId = req.user!.userId;
    const orgId = req.user!.organizationId;
    const userRole = req.user!.role;

    const result = await SupervisorEngine.orchestrate(data, userId, orgId, userRole);
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof TenantSecurityError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return;
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Consulta ao catálogo oficial de 394 agentes cadastrados com filtros avançados
 * por domínio, subgrupo, status operacional (REGISTERED, AVAILABLE, EXECUTABLE, DISABLED),
 * escopo (UNIVERSAL, SPECIALIZED), perfil requerido e busca textual (nome, código, missão, capacidade).
 */
router.get('/agents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const domain = req.query.domain as string | undefined;
    const subgroup = req.query.subgroup as string | undefined;
    const operationalStatus = req.query.operationalStatus as AgentOperationalStatus | undefined;
    const scope = req.query.scope as AgentScope | undefined;
    const requiredRole = req.query.requiredRole as UserRole | undefined;
    const capability = req.query.capability as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (domain && domain !== 'ALL') where.domain = domain;
    if (subgroup && subgroup !== 'ALL') where.subgroup = subgroup;
    if (operationalStatus && operationalStatus !== ('ALL' as any)) where.operationalStatus = operationalStatus;
    if (scope && scope !== ('ALL' as any)) where.scope = scope;
    if (requiredRole && requiredRole !== ('ALL' as any)) where.requiredRole = requiredRole;
    if (capability && capability.trim()) {
      where.capabilities = { has: capability.trim() };
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { agentCode: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { mission: { contains: q, mode: 'insensitive' } },
        { subgroup: { contains: q, mode: 'insensitive' } },
        { characterRole: { contains: q, mode: 'insensitive' } },
        { capabilities: { has: q } }
      ];
    }

    const [allAgents, filteredAgents] = await Promise.all([
      prisma.agentRegistration.findMany({
        select: {
          domain: true,
          subgroup: true,
          origin: true,
          scope: true,
          operationalStatus: true,
          isExecutable: true,
          isActive: true
        }
      }),
      prisma.agentRegistration.findMany({
        where,
        orderBy: [{ isExecutable: 'desc' }, { domain: 'asc' }, { name: 'asc' }]
      })
    ]);

    const byDomain: Record<string, number> = {};
    for (const a of allAgents) {
      byDomain[a.domain] = (byDomain[a.domain] || 0) + 1;
    }

    res.json({
      success: true,
      meta: {
        totalCatalog: allAgents.length,
        filteredCount: filteredAgents.length,
        normalizedCount: allAgents.filter((a) => a.origin === 'CATÁLOGO_NORMALIZADO').length,
        commercialCellCount: allAgents.filter((a) => a.origin === 'CÉLULA_COMERCIAL').length,
        executable: allAgents.filter((a) => a.operationalStatus === 'EXECUTABLE').length,
        available: allAgents.filter((a) => a.operationalStatus === 'AVAILABLE').length,
        registered: allAgents.filter((a) => a.operationalStatus === 'REGISTERED').length,
        disabled: allAgents.filter((a) => a.operationalStatus === 'DISABLED' || !a.isActive).length,
        universalScope: allAgents.filter((a) => a.scope === 'UNIVERSAL').length,
        specializedScope: allAgents.filter((a) => a.scope === 'SPECIALIZED').length,
        byDomain
      },
      data: filteredAgents
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Histórico de auditoria de execuções do Supervisor (isolado por organização)
 */
router.get('/executions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const executions = await prisma.supervisorExecution.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        requestedBy: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    res.json({ success: true, data: executions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
