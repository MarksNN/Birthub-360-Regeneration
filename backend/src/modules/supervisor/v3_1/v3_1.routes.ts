import { Router, Request, Response } from 'express';
import { CommercialCatalogV31 } from './catalog';
import { CommercialContextAssemblerV31 } from './context-assembler';
import { CommercialSchemaValidatorV31 } from './schema-validator';
import { CommercialSupervisorOrchestratorV31 } from './orchestrator';
import { AgentIdV31 } from './types';

const router = Router();

/**
 * GET /api/supervisor/v3_1/catalog
 * Retorna o catálogo dos 19 agentes especializados e estatísticas
 */
router.get('/catalog', (req: Request, res: Response) => {
  try {
    const catalog = CommercialCatalogV31.getInstance();
    const agents = catalog.getAgents();
    const skills = catalog.getSkills();

    return res.json({
      success: true,
      schemaVersion: '3.1',
      totalAgents: agents.length,
      totalSkills: skills.length,
      agents
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/supervisor/v3_1/skills
 * Retorna as 463 habilidades catalogadas
 */
router.get('/skills', (req: Request, res: Response) => {
  try {
    const catalog = CommercialCatalogV31.getInstance();
    const { agentId } = req.query;
    const skills = catalog.getSkills(agentId as AgentIdV31 | undefined);

    return res.json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/supervisor/v3_1/agents/:agentId
 * Retorna os detalhes de um especialista, seus playbooks e suas habilidades
 */
router.get('/agents/:agentId', (req: Request, res: Response) => {
  try {
    const catalog = CommercialCatalogV31.getInstance();
    const agentId = req.params.agentId as AgentIdV31;
    const agent = catalog.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({ success: false, error: `Agente "${agentId}" não encontrado.` });
    }

    const index = catalog.getAgentIndex(agentId);
    const playbooks = catalog.getPlaybooks(agentId);

    return res.json({
      success: true,
      agent,
      index,
      playbooks
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/supervisor/v3_1/context
 * Monta o contexto de execução (Core + Prompt + Índice + Playbooks descobertos)
 */
router.post('/context', (req: Request, res: Response) => {
  try {
    const { agentId, skillIds } = req.body;

    if (!agentId) {
      return res.status(400).json({ success: false, error: 'O campo "agentId" é obrigatório.' });
    }

    const result = CommercialContextAssemblerV31.assemble(agentId, skillIds || []);

    return res.json({
      success: true,
      flags: result.flags,
      contextPrompt: result.fullPrompt
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/supervisor/v3_1/validate
 * Valida um envelope JSON contra o schema global V3.1
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const envelope = req.body;
    const validation = CommercialSchemaValidatorV31.validate(envelope);

    if (!validation.valid) {
      return res.status(422).json({
        success: false,
        valid: false,
        errors: validation.errors
      });
    }

    return res.json({
      success: true,
      valid: true,
      errors: []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/supervisor/v3_1/orchestrate
 * Executa uma missão comercial no orquestrador Supervisor V3.1
 */
router.post('/orchestrate', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      userId,
      userPrompt,
      targetAgentId,
      targetSkillIds,
      contextData,
      mode
    } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ success: false, error: 'O prompt do usuário ("userPrompt") é obrigatório.' });
    }

    const response = await CommercialSupervisorOrchestratorV31.execute({
      organizationId: organizationId || 'org-padrao',
      userId: userId || 'usr-padrao',
      userPrompt,
      targetAgentId,
      targetSkillIds,
      contextData,
      mode: mode || 'CONSULTIVO'
    });

    return res.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
