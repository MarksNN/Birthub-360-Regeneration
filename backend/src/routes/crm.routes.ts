import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { logAudit } from '../lib/audit';
import { TenantGuard, TenantSecurityError } from '../lib/tenant-guard';
import { DealStage, ActivityType, ActivityStatus, CompanyStatus, ContactStatus, LeadStatus } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

function handleRouteError(res: Response, error: any): void {
  if (error instanceof TenantSecurityError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ success: false, error: error.errors[0]?.message || 'Dados inválidos' });
    return;
  }
  res.status(400).json({ success: false, error: error.message || 'Erro na operação comercial' });
}

// ==========================================
// USUÁRIOS COMERCIAIS / RESPONSÁVEIS
// ==========================================
router.get('/assignees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// EMPRESAS (COMPANIES) - CRUD + PESQUISA + PAGINAÇÃO
// ==========================================
const companySchema = z.object({
  name: z.string().min(2, 'Nome da empresa é obrigatório'),
  tradeName: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.nativeEnum(CompanyStatus).optional(),
  annualRevenue: z.number().optional().nullable(),
  employeeCount: z.number().optional().nullable(),
});

router.get('/companies', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const search = req.query.search as string | undefined;
    const status = req.query.status as CompanyStatus | undefined;
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '50');
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };
    if (status) where.status = status;
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        include: {
          _count: { select: { contacts: true, leads: true, deals: true, activities: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    res.json({
      success: true,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
      data: companies
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/companies', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const data = companySchema.parse(req.body);

    if (data.cnpj && data.cnpj.trim()) {
      const existing = await prisma.company.findUnique({
        where: { organizationId_cnpj: { organizationId: orgId, cnpj: data.cnpj.trim() } }
      });
      if (existing) {
        res.status(409).json({ success: false, error: `Já existe uma empresa cadastrada com o CNPJ ${data.cnpj}` });
        return;
      }
    }

    const company = await prisma.company.create({
      data: {
        ...data,
        cnpj: data.cnpj?.trim() || null,
        organizationId: orgId
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'COMPANY',
      entityId: company.id,
      action: 'CREATE',
      diff: company
    });

    res.status(201).json({ success: true, data: company });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.put('/companies/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const data = companySchema.partial().parse(req.body);

    const old = await prisma.company.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Empresa não encontrada na sua organização' });
      return;
    }

    if (data.cnpj && data.cnpj.trim() && data.cnpj.trim() !== old.cnpj) {
      const duplicate = await prisma.company.findUnique({
        where: { organizationId_cnpj: { organizationId: orgId, cnpj: data.cnpj.trim() } }
      });
      if (duplicate) {
        res.status(409).json({ success: false, error: `Já existe outra empresa com o CNPJ ${data.cnpj}` });
        return;
      }
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...data,
        cnpj: data.cnpj !== undefined ? (data.cnpj?.trim() || null) : undefined
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'COMPANY',
      entityId: id,
      action: 'UPDATE',
      diff: { before: old, after: updated }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.delete('/companies/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;

    const old = await prisma.company.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Empresa não encontrada na sua organização' });
      return;
    }

    await prisma.company.delete({ where: { id } });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'COMPANY',
      entityId: id,
      action: 'DELETE',
      diff: old
    });

    res.json({ success: true, message: 'Empresa removida com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// CONTATOS (CONTACTS) - CRUD + PESQUISA + ISOLAMENTO
// ==========================================
const contactSchema = z.object({
  companyId: z.string().optional().nullable(),
  name: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  roleTitle: z.string().optional().nullable(),
  status: z.nativeEnum(ContactStatus).optional(),
});

router.get('/contacts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const search = req.query.search as string | undefined;
    const companyId = req.query.companyId as string | undefined;

    const where: any = { organizationId: orgId };
    if (companyId) where.companyId = companyId;
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { roleTitle: { contains: search, mode: 'insensitive' } }
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { leads: true, activities: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/contacts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const data = contactSchema.parse(req.body);

    const contact = await prisma.$transaction(async (tx) => {
      await TenantGuard.assertCompanyInTenant(data.companyId, orgId, tx);
      return tx.contact.create({
        data: { ...data, organizationId: orgId },
        include: { company: { select: { id: true, name: true } } }
      });
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'CONTACT',
      entityId: contact.id,
      action: 'CREATE',
      diff: contact
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.put('/contacts/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const data = contactSchema.partial().parse(req.body);

    const old = await prisma.contact.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Contato não encontrado na sua organização' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (data.companyId !== undefined) {
        await TenantGuard.assertCompanyInTenant(data.companyId, orgId, tx);
      }
      return tx.contact.update({
        where: { id },
        data,
        include: { company: { select: { id: true, name: true } } }
      });
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'CONTACT',
      entityId: id,
      action: 'UPDATE',
      diff: { before: old, after: updated }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.delete('/contacts/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;

    const old = await prisma.contact.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Contato não encontrado na sua organização' });
      return;
    }

    await prisma.contact.delete({ where: { id } });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'CONTACT',
      entityId: id,
      action: 'DELETE',
      diff: old
    });

    res.json({ success: true, message: 'Contato excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// LEADS - CRUD + RESPONSÁVEL + ICP SCORE + ISOLAMENTO
// ==========================================
const leadSchema = z.object({
  title: z.string().min(2, 'Título do lead é obrigatório'),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.nativeEnum(LeadStatus).optional(),
  score: z.number().min(0).max(100).optional(),
  estimatedValue: z.number().optional().nullable(),
  notes: z.string().optional().nullable()
});

router.get('/leads', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const search = req.query.search as string | undefined;
    const status = req.query.status as LeadStatus | undefined;
    const assignedToId = req.query.assignedToId as string | undefined;

    const where: any = { organizationId: orgId };
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, email: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { deals: true, activities: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: leads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/leads', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const data = leadSchema.parse(req.body);
    const targetAssigneeId = data.assignedToId || req.user!.userId;

    const lead = await prisma.$transaction(async (tx) => {
      await TenantGuard.assertRelationsInTenant(
        {
          companyId: data.companyId,
          contactId: data.contactId,
          assignedToId: targetAssigneeId
        },
        orgId,
        tx
      );

      return tx.lead.create({
        data: {
          ...data,
          organizationId: orgId,
          assignedToId: targetAssigneeId
        },
        include: {
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      });
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'LEAD',
      entityId: lead.id,
      action: 'CREATE',
      diff: lead
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.put('/leads/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const data = leadSchema.partial().parse(req.body);

    const old = await prisma.lead.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Lead não encontrado na sua organização' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await TenantGuard.assertRelationsInTenant(
        {
          companyId: data.companyId,
          contactId: data.contactId,
          assignedToId: data.assignedToId
        },
        orgId,
        tx
      );

      return tx.lead.update({
        where: { id },
        data,
        include: {
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      });
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'LEAD',
      entityId: id,
      action: 'UPDATE',
      diff: { before: old, after: updated }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.delete('/leads/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;

    const old = await prisma.lead.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Lead não encontrado na sua organização' });
      return;
    }

    await prisma.lead.delete({ where: { id } });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'LEAD',
      entityId: id,
      action: 'DELETE',
      diff: old
    });

    res.json({ success: true, message: 'Lead excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// NEGÓCIOS (DEALS / PIPELINE KANBAN) + ISOLAMENTO E TRANSAÇÕES
// ==========================================
const dealSchema = z.object({
  title: z.string().min(2, 'Título do negócio é obrigatório'),
  companyId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  amount: z.number().min(0, 'Valor deve ser positivo'),
  stage: z.nativeEnum(DealStage).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedClose: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable()
});

router.get('/deals', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const stage = req.query.stage as DealStage | undefined;
    const assignedToId = req.query.assignedToId as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = { organizationId: orgId };
    if (stage) where.stage = stage;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        { lead: { title: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
        _count: { select: { activities: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: deals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/deals', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const data = dealSchema.parse(req.body);
    const targetAssigneeId = data.assignedToId || req.user!.userId;

    const deal = await prisma.$transaction(async (tx) => {
      await TenantGuard.assertRelationsInTenant(
        {
          companyId: data.companyId,
          leadId: data.leadId,
          assignedToId: targetAssigneeId
        },
        orgId,
        tx
      );

      const created = await tx.deal.create({
        data: {
          ...data,
          expectedClose: data.expectedClose ? new Date(data.expectedClose) : null,
          organizationId: orgId,
          assignedToId: targetAssigneeId
        },
        include: {
          company: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      });

      await tx.dealStageHistory.create({
        data: {
          organizationId: orgId,
          dealId: created.id,
          fromStage: created.stage,
          toStage: created.stage,
          movedById: req.user!.userId,
          notes: 'Criação do negócio no funil'
        }
      });

      return created;
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'DEAL',
      entityId: deal.id,
      action: 'CREATE',
      diff: deal
    });

    res.status(201).json({ success: true, data: deal });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

// Transição de etapa no pipeline (Drag-and-Drop) com Transação Atômica
router.patch('/deals/:id/stage', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const bodySchema = z.object({
      stage: z.nativeEnum(DealStage),
      lostReason: z.string().optional().nullable(),
      notes: z.string().optional().nullable()
    });

    const { stage, lostReason, notes } = bodySchema.parse(req.body);

    const deal = await prisma.deal.findFirst({ where: { id, organizationId: orgId } });
    if (!deal) {
      res.status(404).json({ success: false, error: 'Negócio não encontrado na sua organização' });
      return;
    }

    const fromStage = deal.stage;

    let defaultProb = deal.probability;
    if (stage === DealStage.PROSPECT) defaultProb = 20;
    else if (stage === DealStage.QUALIFICACAO) defaultProb = 40;
    else if (stage === DealStage.PROPOSTA_ENVIADA) defaultProb = 60;
    else if (stage === DealStage.NEGOCIACAO) defaultProb = 80;
    else if (stage === DealStage.FECHADO_GANHO) defaultProb = 100;
    else if (stage === DealStage.FECHADO_PERDIDO) defaultProb = 0;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.deal.update({
        where: { id },
        data: {
          stage,
          probability: defaultProb,
          lostReason: stage === DealStage.FECHADO_PERDIDO ? (lostReason || deal.lostReason) : null
        },
        include: {
          company: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      });

      await tx.dealStageHistory.create({
        data: {
          organizationId: orgId,
          dealId: id,
          fromStage,
          toStage: stage,
          movedById: req.user!.userId,
          notes: notes || `Movido de ${fromStage} para ${stage}`
        }
      });

      return u;
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'DEAL',
      entityId: id,
      action: 'STAGE_CHANGE',
      diff: { fromStage, toStage: stage, lostReason }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.put('/deals/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const data = dealSchema.partial().parse(req.body);

    const old = await prisma.deal.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Negócio não encontrado na sua organização' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await TenantGuard.assertRelationsInTenant(
        {
          companyId: data.companyId,
          leadId: data.leadId,
          assignedToId: data.assignedToId
        },
        orgId,
        tx
      );

      return tx.deal.update({
        where: { id },
        data: {
          ...data,
          expectedClose: data.expectedClose !== undefined ? (data.expectedClose ? new Date(data.expectedClose) : null) : undefined
        },
        include: {
          company: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      });
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'DEAL',
      entityId: id,
      action: 'UPDATE',
      diff: { before: old, after: updated }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.delete('/deals/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;

    const old = await prisma.deal.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Negócio não encontrado na sua organização' });
      return;
    }

    await prisma.deal.delete({ where: { id } });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'DEAL',
      entityId: id,
      action: 'DELETE',
      diff: old
    });

    res.json({ success: true, message: 'Negócio excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Histórico de transições de um negócio
router.get('/deals/:id/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
    if (!deal) {
      res.status(404).json({ success: false, error: 'Negócio não encontrado na sua organização' });
      return;
    }

    const histories = await prisma.dealStageHistory.findMany({
      where: { dealId: id, organizationId: orgId },
      include: {
        movedBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: histories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ATIVIDADES & ACOMPANHAMENTO COMERCIAL + ISOLAMENTO
// ==========================================
const activitySchema = z.object({
  title: z.string().min(2, 'Título da atividade é obrigatório'),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(ActivityType).default(ActivityType.TAREFA),
  dueDate: z.string(),
  status: z.nativeEnum(ActivityStatus).optional(),
  assignedToId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
});

router.get('/activities', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const status = req.query.status as ActivityStatus | undefined;
    const type = req.query.type as ActivityType | undefined;
    const dealId = req.query.dealId as string | undefined;
    const leadId = req.query.leadId as string | undefined;
    const companyId = req.query.companyId as string | undefined;
    const assignedToId = req.query.assignedToId as string | undefined;

    const where: any = { organizationId: orgId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (dealId) where.dealId = dealId;
    if (leadId) where.leadId = leadId;
    if (companyId) where.companyId = companyId;
    if (assignedToId) where.assignedToId = assignedToId;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        lead: { select: { id: true, title: true } },
        deal: { select: { id: true, title: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ success: true, data: activities });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/activities', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const data = activitySchema.parse(req.body);
    const targetAssigneeId = data.assignedToId || req.user!.userId;

    const activity = await prisma.$transaction(async (tx) => {
      await TenantGuard.assertRelationsInTenant(
        {
          companyId: data.companyId,
          contactId: data.contactId,
          leadId: data.leadId,
          dealId: data.dealId,
          assignedToId: targetAssigneeId
        },
        orgId,
        tx
      );

      return tx.activity.create({
        data: {
          ...data,
          dueDate: new Date(data.dueDate),
          organizationId: orgId,
          assignedToId: targetAssigneeId
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } }
        }
      });
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'ACTIVITY',
      entityId: activity.id,
      action: 'CREATE',
      diff: activity
    });

    res.status(201).json({ success: true, data: activity });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.put('/activities/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const data = activitySchema.partial().parse(req.body);

    const old = await prisma.activity.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Atividade não encontrada na sua organização' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await TenantGuard.assertRelationsInTenant(
        {
          companyId: data.companyId,
          contactId: data.contactId,
          leadId: data.leadId,
          dealId: data.dealId,
          assignedToId: data.assignedToId
        },
        orgId,
        tx
      );

      return tx.activity.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          completedAt: data.status === ActivityStatus.CONCLUIDA ? new Date() : undefined
        }
      });
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'ACTIVITY',
      entityId: id,
      action: 'UPDATE',
      diff: { before: old, after: updated }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.patch('/activities/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;
    const { status } = z.object({ status: z.nativeEnum(ActivityStatus) }).parse(req.body);

    const old = await prisma.activity.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Atividade não encontrada na sua organização' });
      return;
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        status,
        completedAt: status === ActivityStatus.CONCLUIDA ? new Date() : null
      }
    });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'ACTIVITY',
      entityId: id,
      action: 'UPDATE',
      diff: { statusChange: status }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    handleRouteError(res, error);
  }
});

router.delete('/activities/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const { id } = req.params;

    const old = await prisma.activity.findFirst({ where: { id, organizationId: orgId } });
    if (!old) {
      res.status(404).json({ success: false, error: 'Atividade não encontrada na sua organização' });
      return;
    }

    await prisma.activity.delete({ where: { id } });

    await logAudit({
      organizationId: orgId,
      userId: req.user!.userId,
      entityType: 'ACTIVITY',
      entityId: id,
      action: 'DELETE',
      diff: old
    });

    res.json({ success: true, message: 'Atividade removida com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// TIMELINE E AUDITORIA DA ORGANIZAÇÃO
// ==========================================
router.get('/timeline', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
