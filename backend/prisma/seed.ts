import { PrismaClient, UserRole, CompanyStatus, ContactStatus, LeadStatus, DealStage, ActivityType, ActivityStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { syncAgentsCatalogIdempotent } from '../src/modules/supervisor/catalog/catalog-importer';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed Birthub 360 (CRM, RevOps & Catálogo 394 Agentes) ---');

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
      dueDate: yesterday,
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

  // 8. Importação Idempotente do Catálogo Oficial dos 394 Agentes
  const syncResult = await syncAgentsCatalogIdempotent(prisma);
  console.log('--- Catálogo 394 Agentes Sincronizado ---', syncResult);

  // 9. Fase 03 — Atualizar Administrador com Poder de Contratação e Papel de Plataforma
  await prisma.user.update({
    where: { email: 'admin@birthhub360.com' },
    data: {
      platformRole: 'PLATFORM_ADMIN',
      canApproveIntegrationProposals: true
    }
  });

  // 10. Fase 03 — Parâmetros de Precificação Comercial e Políticas
  const pricingParams = [
    { key: 'HOURLY_COST_ANALYSIS', label: 'Hora Técnica de Análise e Discovery', category: 'ANALYSIS', unit: 'CURRENCY_PER_HOUR', value: 150.0 },
    { key: 'HOURLY_COST_DEVELOPMENT', label: 'Hora Técnica de Desenvolvimento de Conectores', category: 'DEVELOPMENT', unit: 'CURRENCY_PER_HOUR', value: 180.0 },
    { key: 'HOURLY_COST_INTEGRATION', label: 'Hora Técnica de Integração de APIs e Webhooks', category: 'API_INTEGRATION', unit: 'CURRENCY_PER_HOUR', value: 175.0 },
    { key: 'HOURLY_COST_DATA_MAPPING', label: 'Hora Técnica de Mapeamento de Entidades', category: 'DATA_MAPPING', unit: 'CURRENCY_PER_HOUR', value: 140.0 },
    { key: 'HOURLY_COST_MIGRATION', label: 'Hora Técnica de Carga Inicial e Migração', category: 'MIGRATION', unit: 'CURRENCY_PER_HOUR', value: 130.0 },
    { key: 'HOURLY_COST_TESTING', label: 'Hora Técnica de Testes e Homologação', category: 'TESTING', unit: 'CURRENCY_PER_HOUR', value: 140.0 },
    { key: 'HOURLY_COST_DEPLOYMENT', label: 'Hora Técnica de Implantação e Staging', category: 'DEPLOYMENT', unit: 'CURRENCY_PER_HOUR', value: 160.0 },
    { key: 'HOURLY_COST_TRAINING', label: 'Hora Técnica de Documentação e Treinamento', category: 'TRAINING', unit: 'CURRENCY_PER_HOUR', value: 120.0 },
    { key: 'INFRASTRUCTURE_BASE_SETUP', label: 'Custo Base de Infraestrutura e Sandbox', category: 'INFRASTRUCTURE', unit: 'CURRENCY', value: 800.0 },
    { key: 'DEFAULT_MAINTENANCE_MONTHLY', label: 'Mensalidade Padrão de Manutenção Preventiva', category: 'MONTHLY', unit: 'CURRENCY_PER_MONTH', value: 1200.0 },
    { key: 'DEFAULT_SUPPORT_MONTHLY', label: 'Mensalidade Padrão de Suporte Operacional', category: 'MONTHLY', unit: 'CURRENCY_PER_MONTH', value: 800.0 }
  ];

  for (const p of pricingParams) {
    await prisma.integrationPricingParameter.upsert({
      where: { key: p.key },
      update: { value: p.value },
      create: {
        key: p.key,
        label: p.label,
        category: p.category,
        unit: p.unit,
        value: p.value,
        currency: 'BRL',
        isActive: true
      }
    });
  }

  await prisma.integrationPricingPolicy.upsert({
    where: { id: 'default-pricing-policy-2026' },
    update: {},
    create: {
      id: 'default-pricing-policy-2026',
      name: 'Política Comercial Oficial 2026',
      isActive: true,
      currency: 'BRL',
      defaultMarginPct: 30.0,
      maxDiscountPct: 20.0,
      supervisorMaxDiscountPct: 5.0,
      taxRatePct: 12.0,
      proposalValidityDays: 15,
      paymentTerms: '50% na autorização interna e 50% na homologação final da entrega',
      warrantyTerms: '30 dias corridos de garantia pós-homologação',
      changeScopeTerms: 'Alterações materiais de escopo serão formalizadas via Change Request complementar'
    }
  });

  await prisma.integrationPlanEntitlement.upsert({
    where: { plan_component: { plan: 'ENTERPRISE_360', component: 'MAINTENANCE' } },
    update: {},
    create: { plan: 'ENTERPRISE_360', component: 'MAINTENANCE', included: true, notes: 'Manutenção preventiva inclusa' }
  });

  const providersData = [
    {
      key: 'BITRIX24',
      name: 'Bitrix24 CRM & Telefonia',
      category: 'CRM',
      squad: 'CRM_INTEGRATION' as const,
      documentationUrl: 'https://training.bitrix24.com/rest_help/',
      hasOfficialApi: true,
      authMethods: ['OAUTH2', 'WEBHOOK_INBOUND'],
      supportsWebhooks: true,
      catalogStatus: 'AVAILABLE' as const
    },
    {
      key: 'HUBSPOT',
      name: 'HubSpot CRM',
      category: 'CRM',
      squad: 'CRM_INTEGRATION' as const,
      documentationUrl: 'https://developers.hubspot.com/',
      hasOfficialApi: true,
      authMethods: ['OAUTH2', 'API_KEY'],
      supportsWebhooks: true,
      catalogStatus: 'AVAILABLE_FOR_PROPOSAL' as const
    },
    {
      key: 'PIPEDRIVE',
      name: 'Pipedrive CRM',
      category: 'CRM',
      squad: 'CRM_INTEGRATION' as const,
      documentationUrl: 'https://developers.pipedrive.com/',
      hasOfficialApi: true,
      authMethods: ['OAUTH2', 'API_KEY'],
      supportsWebhooks: true,
      catalogStatus: 'AVAILABLE_FOR_PROPOSAL' as const
    },
    {
      key: 'SIMULATED_ERP',
      name: 'ERP Corporativo Simulado',
      category: 'ERP',
      squad: 'FINANCIAL_INTEGRATION' as const,
      documentationUrl: 'https://api.birthhub360.local/docs/simulated-erp',
      hasOfficialApi: true,
      authMethods: ['API_KEY'],
      supportsWebhooks: true,
      catalogStatus: 'AVAILABLE' as const
    },
    {
      key: 'SERASA_DATA',
      name: 'Serasa Experian / Clearbit Data',
      category: 'DATA_PROVIDER',
      squad: 'DATA_INTELLIGENCE' as const,
      hasOfficialApi: true,
      authMethods: ['API_KEY'],
      supportsWebhooks: false,
      catalogStatus: 'AVAILABLE_FOR_PROPOSAL' as const
    },
    {
      key: 'WHATSAPP_ZENVIA',
      name: 'WhatsApp Business / Zenvia',
      category: 'COMMUNICATION',
      squad: 'COMMUNICATION' as const,
      hasOfficialApi: true,
      authMethods: ['API_KEY', 'WEBHOOK_INBOUND'],
      supportsWebhooks: true,
      catalogStatus: 'AVAILABLE_FOR_PROPOSAL' as const
    }
  ];

  for (const prov of providersData) {
    const p = await prisma.integrationProvider.upsert({
      where: { key: prov.key },
      update: { catalogStatus: prov.catalogStatus },
      create: {
        key: prov.key,
        name: prov.name,
        category: prov.category,
        squad: prov.squad,
        documentationUrl: prov.documentationUrl || null,
        hasOfficialApi: prov.hasOfficialApi,
        authMethods: prov.authMethods,
        supportsWebhooks: prov.supportsWebhooks,
        catalogStatus: prov.catalogStatus
      }
    });

    if (prov.key === 'SIMULATED_ERP') {
      await prisma.integrationConnector.upsert({
        where: { key_version: { key: 'simulated-erp', version: '1.0.0' } },
        update: {},
        create: {
          providerId: p.id,
          key: 'simulated-erp',
          version: '1.0.0',
          name: 'ERP Corporativo Simulado Connector',
          visibility: 'SHARED',
          isExclusive: false,
          catalogStatus: 'AVAILABLE',
          manifest: {
            id: 'simulated-erp',
            version: '1.0.0',
            providerKey: 'SIMULATED_ERP',
            category: 'ERP'
          },
          manifestHash: 'hash-simulated-erp-v1',
          isSimulated: true
        }
      });
    }
  }
  console.log('--- Seed Concluído com Sucesso ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
