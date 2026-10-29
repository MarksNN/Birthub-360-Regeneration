import { PrismaClient, UserRole, AgentScope, CompanyStatus, ContactStatus, LeadStatus, DealStage, ActivityType, ActivityStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed Fase 02 Birthub 360 CRM & RevOps ---');

  // 1. Organização Principal
  const org = await prisma.organization.upsert({
    where: { slug: 'birthhub-matriz' },
    update: {},
    create: {
      name: 'Birthub 360 Matriz',
      slug: 'birthhub-matriz',
      plan: 'ENTERPRISE_360'
    }
  });

  // 2. Usuários
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@birthhub360.com' },
    update: {},
    create: {
      name: 'Administrador 360',
      email: 'admin@birthhub360.com',
      passwordHash,
      role: UserRole.ADMIN,
      organizationId: org.id
    }
  });

  const closer = await prisma.user.upsert({
    where: { email: 'closer@birthhub360.com' },
    update: {},
    create: {
      name: 'Marina Torres (Account Executive)',
      email: 'closer@birthhub360.com',
      passwordHash,
      role: UserRole.CLOSER,
      organizationId: org.id
    }
  });

  const sdr = await prisma.user.upsert({
    where: { email: 'sdr@birthhub360.com' },
    update: {},
    create: {
      name: 'Operador SDR',
      email: 'sdr@birthhub360.com',
      passwordHash,
      role: UserRole.SDR,
      organizationId: org.id
    }
  });

  // 3. Empresas Reais
  const comp1 = await prisma.company.upsert({
    where: { organizationId_cnpj: { organizationId: org.id, cnpj: '11.222.333/0001-44' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'VTech Logística Avançada S.A.',
      tradeName: 'VTech Log',
      cnpj: '11.222.333/0001-44',
      industry: 'Logística e Supply Chain',
      website: 'https://vtechlog.com.br',
      phone: '(11) 4004-9988',
      status: CompanyStatus.ATIVO,
      annualRevenue: 45000000,
      employeeCount: 320
    }
  });

  const comp2 = await prisma.company.upsert({
    where: { organizationId_cnpj: { organizationId: org.id, cnpj: '55.666.777/0001-88' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'OmniHealth Soluções Médicas Ltda',
      tradeName: 'OmniHealth Brasil',
      cnpj: '55.666.777/0001-88',
      industry: 'Saúde & Healthtech',
      website: 'https://omnihealth.med.br',
      phone: '(11) 3211-5500',
      status: CompanyStatus.ATIVO,
      annualRevenue: 18000000,
      employeeCount: 110
    }
  });

  const comp3 = await prisma.company.upsert({
    where: { organizationId_cnpj: { organizationId: org.id, cnpj: '33.444.555/0001-99' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'AgroSul Tecnologia Agrícola',
      tradeName: 'AgroSul Smart',
      cnpj: '33.444.555/0001-99',
      industry: 'Agronegócio & IoT',
      website: 'https://agrosultech.com.br',
      phone: '(51) 3455-9000',
      status: CompanyStatus.ATIVO,
      annualRevenue: 62000000,
      employeeCount: 450
    }
  });

  // 4. Contatos
  const cont1 = await prisma.contact.upsert({
    where: { id: 'contact-vtech-carlos' },
    update: {},
    create: {
      id: 'contact-vtech-carlos',
      organizationId: org.id,
      companyId: comp1.id,
      name: 'Carlos Alberto Mendonça',
      email: 'carlos.mendonca@vtechlog.com.br',
      phone: '(11) 98765-4321',
      roleTitle: 'Diretor de Operações',
      status: ContactStatus.ATIVO
    }
  });

  const cont2 = await prisma.contact.upsert({
    where: { id: 'contact-omni-beatriz' },
    update: {},
    create: {
      id: 'contact-omni-beatriz',
      organizationId: org.id,
      companyId: comp2.id,
      name: 'Dra. Beatriz Fontana',
      email: 'b.fontana@omnihealth.med.br',
      phone: '(11) 99123-8877',
      roleTitle: 'Head de Inovação Clínica',
      status: ContactStatus.ATIVO
    }
  });

  // 5. Leads
  const lead1 = await prisma.lead.upsert({
    where: { id: 'lead-vtech-torre' },
    update: {},
    create: {
      id: 'lead-vtech-torre',
      organizationId: org.id,
      companyId: comp1.id,
      contactId: cont1.id,
      assignedToId: sdr.id,
      title: 'Implementação Torre de Controle Logístico 360',
      source: 'Inbound Inovação',
      status: LeadStatus.QUALIFICACAO_SDR,
      score: 88,
      estimatedValue: 240000,
      notes: 'Alta aderência ao ICP. Orçamento aprovado para Q4.'
    }
  });

  const lead2 = await prisma.lead.upsert({
    where: { id: 'lead-omni-triagem' },
    update: {},
    create: {
      id: 'lead-omni-triagem',
      organizationId: org.id,
      companyId: comp2.id,
      contactId: cont2.id,
      assignedToId: sdr.id,
      title: 'Plataforma de Triagem Preditiva Hospitalar',
      source: 'Evento Conahp 2026',
      status: LeadStatus.REUNIAO_AGENDADA,
      score: 95,
      estimatedValue: 480000,
      notes: 'Reunião estratégica agendada com diretoria executiva.'
    }
  });

  // 6. Negócios (Deals no Pipeline)
  const deal1 = await prisma.deal.upsert({
    where: { id: 'deal-vtech-enterprise' },
    update: {},
    create: {
      id: 'deal-vtech-enterprise',
      organizationId: org.id,
      companyId: comp1.id,
      leadId: lead1.id,
      assignedToId: closer.id,
      title: 'Contrato Anual VTech Log - Suíte Enterprise',
      amount: 240000,
      stage: DealStage.PROPOSTA_ENVIADA,
      probability: 60,
      expectedClose: new Date('2026-11-30')
    }
  });

  const deal2 = await prisma.deal.upsert({
    where: { id: 'deal-omni-core' },
    update: {},
    create: {
      id: 'deal-omni-core',
      organizationId: org.id,
      companyId: comp2.id,
      leadId: lead2.id,
      assignedToId: closer.id,
      title: 'Licenciamento OmniHealth 360 Core',
      amount: 480000,
      stage: DealStage.NEGOCIACAO,
      probability: 80,
      expectedClose: new Date('2026-12-15')
    }
  });

  const deal3 = await prisma.deal.upsert({
    where: { id: 'deal-agrosul-iot' },
    update: {},
    create: {
      id: 'deal-agrosul-iot',
      organizationId: org.id,
      companyId: comp3.id,
      assignedToId: admin.id,
      title: 'Monitoramento Preditivo de Frotas AgroSul',
      amount: 350000,
      stage: DealStage.FECHADO_GANHO,
      probability: 100,
      expectedClose: new Date('2026-10-15')
    }
  });

  // 7. Atividades Comerciais (Tarefas, Ligações, Reuniões)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  await prisma.activity.upsert({
    where: { id: 'activity-vtech-reuniao' },
    update: {},
    create: {
      id: 'activity-vtech-reuniao',
      organizationId: org.id,
      dealId: deal1.id,
      companyId: comp1.id,
      contactId: cont1.id,
      assignedToId: closer.id,
      type: ActivityType.REUNIAO,
      title: 'Alinhamento de Proposta Técnica com TI da VTech',
      description: 'Apresentar arquitetura de integração e responder dúvidas de segurança.',
      dueDate: tomorrow,
      status: ActivityStatus.PENDENTE
    }
  });

  await prisma.activity.upsert({
    where: { id: 'activity-omni-ligacao' },
    update: {},
    create: {
      id: 'activity-omni-ligacao',
      organizationId: org.id,
      dealId: deal2.id,
      companyId: comp2.id,
      contactId: cont2.id,
      assignedToId: closer.id,
      type: ActivityType.LIGACAO,
      title: 'Follow-up de minuta contratual com Dra. Beatriz',
      description: 'Confirmar recebimento das condições comerciais com o comitê executivo.',
      dueDate: yesterday, // Atrasada para teste de indicador RevOps
      status: ActivityStatus.PENDENTE
    }
  });

  await prisma.activity.upsert({
    where: { id: 'activity-agrosul-concluida' },
    update: {},
    create: {
      id: 'activity-agrosul-concluida',
      organizationId: org.id,
      dealId: deal3.id,
      companyId: comp3.id,
      assignedToId: admin.id,
      type: ActivityType.TAREFA,
      title: 'Assinatura digital do contrato e liberação de acesso',
      description: 'Contrato assinado via DocuSign e provisionado na nuvem.',
      dueDate: yesterday,
      status: ActivityStatus.CONCLUIDA,
      completedAt: yesterday
    }
  });

  // 8. Agentes Especializados Fase 02
  const extraAgents = [
    {
      agentCode: 'revops-intelligence-analyzer',
      name: 'RevOps Intelligence Analyzer',
      domain: 'Real-time Performance',
      subgroup: 'Análise de Pipeline',
      scope: AgentScope.SPECIALIZED,
      description: 'Calcula dispersão de pipeline, taxa de conversão entre etapas e receita prevista ponderada.',
      capabilities: ['Cálculo de Weighted Forecast', 'Win Rate Diagnostic', 'Análise de Gargalos'],
      allowedTools: ['calculate_revops_metrics', 'inspect_crm_pipeline'],
      requiredRole: UserRole.MANAGER,
      isActive: true,
      isExecutable: true
    },
    {
      agentCode: 'commercial-activity-copilot',
      name: 'Commercial Activity Copilot',
      domain: 'Hub Central',
      subgroup: 'Gestão de Produtividade',
      scope: AgentScope.UNIVERSAL,
      description: 'Gerencia tarefas, ligações pendentes, follow-ups e alerta sobre atividades atrasadas.',
      capabilities: ['Agendamento Inteligente', 'Priorização de Cadência'],
      allowedTools: ['create_crm_activity', 'read_overdue_activities'],
      requiredRole: UserRole.SDR,
      isActive: true,
      isExecutable: true
    }
  ];

  for (const agent of extraAgents) {
    await prisma.agentRegistration.upsert({
      where: { agentCode: agent.agentCode },
      update: {},
      create: agent
    });
  }

  console.log('--- Seed Fase 02 Concluído com Sucesso ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
