import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const params = [
    { key: 'HOURLY_COST_ANALYSIS', label: 'Análise', category: 'LABOR', unit: 'HOUR', value: 150, currency: 'BRL', isActive: true },
    { key: 'HOURLY_COST_DEVELOPMENT', label: 'Dev', category: 'LABOR', unit: 'HOUR', value: 180, currency: 'BRL', isActive: true },
    { key: 'HOURLY_COST_INTEGRATION', label: 'Integração', category: 'LABOR', unit: 'HOUR', value: 200, currency: 'BRL', isActive: true },
    { key: 'HOURLY_COST_DATA_MAPPING', label: 'Mapeamento', category: 'LABOR', unit: 'HOUR', value: 150, currency: 'BRL', isActive: true },
    { key: 'HOURLY_COST_MIGRATION', label: 'Migração', category: 'LABOR', unit: 'HOUR', value: 160, currency: 'BRL', isActive: true },
    { key: 'HOURLY_COST_TESTING', label: 'Testes', category: 'LABOR', unit: 'HOUR', value: 120, currency: 'BRL', isActive: true },
    { key: 'HOURLY_COST_DEPLOYMENT', label: 'Deploy', category: 'LABOR', unit: 'HOUR', value: 180, currency: 'BRL', isActive: true },
    { key: 'HOURLY_COST_TRAINING', label: 'Treinamento', category: 'LABOR', unit: 'HOUR', value: 100, currency: 'BRL', isActive: true },
    { key: 'DEFAULT_MAINTENANCE_MONTHLY', label: 'Manutenção', category: 'SERVICE', unit: 'MONTH', value: 1000, currency: 'BRL', isActive: true },
    { key: 'DEFAULT_SUPPORT_MONTHLY', label: 'Suporte', category: 'SERVICE', unit: 'MONTH', value: 500, currency: 'BRL', isActive: true }
  ];
  for (const p of params) {
    await prisma.integrationPricingParameter.upsert({
      where: { key: p.key },
      update: { value: p.value },
      create: p
    });
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
