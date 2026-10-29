import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SupervisorEngine } from './supervisor.engine';

const router = Router();
router.use(authenticateToken);

const supervisorPromptSchema = z.object({
  targetModule: z.enum([
    'CRM',
    'INTELLIGENCE',
    'SALES_ORCHESTRATION',
    'REAL_TIME_PERFORMANCE',
    'REVENUE_FORECAST',
    'COPILOT',
    'AUTOMATIONS',
    'CADENCE'
  ]),
  prompt: z.string().min(2, 'O comando para o Supervisor é obrigatório'),
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
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Consulta ao catálogo de agentes cadastrados (provenientes do mapeamento dos 394 agentes)
 */
router.get('/agents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const agents = await prisma.agentRegistration.findMany({
      orderBy: [{ scope: 'asc' }, { domain: 'asc' }]
    });

    res.json({
      success: true,
      meta: {
        total: agents.length,
        executable: agents.filter(a => a.isExecutable).length,
        cataloguedOnly: agents.filter(a => !a.isExecutable).length
      },
      data: agents
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Histórico de auditoria de execuções do Supervisor
 */
router.get('/executions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const executions = await prisma.supervisorExecution.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
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
