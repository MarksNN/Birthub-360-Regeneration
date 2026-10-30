import { PrismaClient, ProposalKind } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { PricingConfigurationError, IntegrationDomainError } from '../domain/errors';
import { IntegrationActor } from '../domain/actor';

export interface EffortBreakdown {
  analysisHours: number;
  developmentHours: number;
  apiIntegrationHours: number;
  dataMappingHours: number;
  initialMigrationHours: number;
  testingHours: number;
  homologationHours: number;
  documentationHours: number;
  deploymentHours: number;
  trainingHours: number;
}

export interface OptionalServicesSelection {
  includeMaintenanceMonthly?: boolean;
  includePremiumSupportMonthly?: boolean;
  externalLicensesMonthly?: number;
  projectedApiConsumptionMonthly?: number; // Custo previsto repassado
}

export interface PricingCalculationResult {
  currency: string;
  effort: EffortBreakdown;
  internalBreakdown: {
    baseLaborCost: number;
    laborCostByDiscipline: Record<string, { hours: number; hourlyCost: number; totalCost: number }>;
    infraCost: number;
    marginPct: number;
    marginAmount: number;
    taxRatePct: number;
    taxAmount: number;
  };
  clientBreakdown: {
    oneTimeFee: {
      onDemandDevelopment: number;
      setupAndDeployment: number;
      trainingAndDocumentation: number;
      subtotalOneTime: number;
      discountAmount: number;
      totalOneTime: number;
    };
    recurringMonthly: {
      maintenance: number;
      support: number;
      externalLicenses: number;
      projectedConsumption: number;
      planCoveredDeduction: number;
      totalMonthly: number;
    };
    planCoveredComponents: string[];
  };
  oneTimeTotal: number;
  monthlyTotal: number;
  discountPct: number;
  pricingSnapshot: Record<string, unknown>;
}

export class IntegrationCommercialEngine {
  /**
   * Calcula o orçamento a partir dos parâmetros vigentes no banco de dados.
   * Não inventa preços. Se faltar parâmetro na tabela administrativa, lança erro explicativo.
   */
  public static async calculateEstimate(
    organizationId: string,
    effort: EffortBreakdown,
    options: OptionalServicesSelection = {},
    requestedDiscountPct = 0,
    actor?: IntegrationActor,
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> = prisma
  ): Promise<PricingCalculationResult> {
    // 1. Carregar parâmetros administrativos do banco
    const [params, policy, org, entitlements] = await Promise.all([
      tx.integrationPricingParameter.findMany({ where: { isActive: true } }),
      tx.integrationPricingPolicy.findFirst({ where: { isActive: true } }),
      tx.organization.findUnique({ where: { id: organizationId }, select: { plan: true } }),
      tx.integrationPlanEntitlement.findMany()
    ]);

    const paramMap = new Map<string, number>();
    for (const p of params) {
      if (p.value !== null && p.value !== undefined) {
        paramMap.set(p.key, Number(p.value));
      }
    }

    // Parâmetros mínimos obrigatórios
    const requiredKeys = [
      'HOURLY_COST_ANALYSIS',
      'HOURLY_COST_DEVELOPMENT',
      'HOURLY_COST_INTEGRATION',
      'HOURLY_COST_DATA_MAPPING',
      'HOURLY_COST_MIGRATION',
      'HOURLY_COST_TESTING',
      'HOURLY_COST_DEPLOYMENT',
      'HOURLY_COST_TRAINING',
      'DEFAULT_MAINTENANCE_MONTHLY',
      'DEFAULT_SUPPORT_MONTHLY'
    ];

    const missing = requiredKeys.filter((k) => !paramMap.has(k));
    if (missing.length > 0) {
      throw new PricingConfigurationError(missing);
    }

    const defaultMarginPct = policy?.defaultMarginPct ? Number(policy.defaultMarginPct) : 30;
    const taxRatePct = policy?.taxRatePct ? Number(policy.taxRatePct) : 12;
    const maxDiscountPct = policy?.maxDiscountPct ? Number(policy.maxDiscountPct) : 20;
    const supervisorMaxDiscount = policy?.supervisorMaxDiscountPct ? Number(policy.supervisorMaxDiscountPct) : 0;

    // Governança de desconto: Supervisor não pode conceder desconto fora do limite
    let effectiveDiscountPct = requestedDiscountPct;
    if (actor?.type === 'SUPERVISOR') {
      if (requestedDiscountPct > supervisorMaxDiscount) {
        throw new IntegrationDomainError(
          'DISCOUNT_EXCEEDS_SUPERVISOR_LIMIT',
          `O Supervisor só tem autorização para conceder até ${supervisorMaxDiscount}% de desconto. Solicitado: ${requestedDiscountPct}%.`,
          403
        );
      }
    } else if (actor?.type === 'USER' && !actor.platformRole) {
      // Usuário solicitante comum não pode aplicar desconto arbitrário
      effectiveDiscountPct = 0;
    } else if (requestedDiscountPct > maxDiscountPct) {
      throw new IntegrationDomainError(
        'DISCOUNT_EXCEEDS_PLATFORM_LIMIT',
        `Desconto solicitado (${requestedDiscountPct}%) excede o teto máximo permitido pela política comercial (${maxDiscountPct}%).`,
        403
      );
    }

    // 2. Custos internos de mão de obra direta
    const labor = {
      analysis: { hours: effort.analysisHours, rate: paramMap.get('HOURLY_COST_ANALYSIS')! },
      development: { hours: effort.developmentHours, rate: paramMap.get('HOURLY_COST_DEVELOPMENT')! },
      integration: { hours: effort.apiIntegrationHours, rate: paramMap.get('HOURLY_COST_INTEGRATION')! },
      dataMapping: { hours: effort.dataMappingHours, rate: paramMap.get('HOURLY_COST_DATA_MAPPING')! },
      migration: { hours: effort.initialMigrationHours, rate: paramMap.get('HOURLY_COST_MIGRATION')! },
      testing: { hours: effort.testingHours + effort.homologationHours, rate: paramMap.get('HOURLY_COST_TESTING')! },
      deployment: { hours: effort.deploymentHours, rate: paramMap.get('HOURLY_COST_DEPLOYMENT')! },
      training: { hours: effort.trainingHours + effort.documentationHours, rate: paramMap.get('HOURLY_COST_TRAINING')! }
    };

    let baseLaborCost = 0;
    const laborCostByDiscipline: Record<string, { hours: number; hourlyCost: number; totalCost: number }> = {};

    for (const [key, item] of Object.entries(labor)) {
      const cost = item.hours * item.rate;
      baseLaborCost += cost;
      laborCostByDiscipline[key] = {
        hours: item.hours,
        hourlyCost: item.rate,
        totalCost: cost
      };
    }

    const infraCost = paramMap.get('INFRASTRUCTURE_BASE_SETUP') || 0;
    const directCost = baseLaborCost + infraCost;
    const marginMultiplier = 1 + defaultMarginPct / 100;
    const priceBeforeTax = directCost * marginMultiplier;
    const taxMultiplier = 1 / (1 - taxRatePct / 100);
    const grossPrice = priceBeforeTax * taxMultiplier;

    // Distribuição didática para proposta do cliente
    const totalLaborHours = Object.values(labor).reduce((acc, curr) => acc + curr.hours, 0);
    const hourlyEffectiveClientRate = totalLaborHours > 0 ? grossPrice / totalLaborHours : 0;

    const onDemandHours = labor.development.hours + labor.integration.hours + labor.dataMapping.hours;
    const setupHours = labor.analysis.hours + labor.migration.hours + labor.testing.hours + labor.deployment.hours;
    const trainingHours = labor.training.hours;

    const onDemandPrice = Number((onDemandHours * hourlyEffectiveClientRate).toFixed(2));
    const setupPrice = Number((setupHours * hourlyEffectiveClientRate).toFixed(2));
    const trainingPrice = Number((trainingHours * hourlyEffectiveClientRate).toFixed(2));

    const subtotalOneTime = Number((onDemandPrice + setupPrice + trainingPrice).toFixed(2));
    const discountAmount = Number(((subtotalOneTime * effectiveDiscountPct) / 100).toFixed(2));
    const totalOneTime = Number((subtotalOneTime - discountAmount).toFixed(2));

    // 3. Verificação de direitos do plano do cliente (Evitar cobrança duplicada)
    const orgPlan = org?.plan || 'ENTERPRISE_360';
    const planEntitledComponents = new Set(
      entitlements.filter((e) => e.plan === orgPlan && e.included).map((e) => e.component)
    );

    let rawMaintenance = options.includeMaintenanceMonthly ? paramMap.get('DEFAULT_MAINTENANCE_MONTHLY')! : 0;
    let rawSupport = options.includePremiumSupportMonthly ? paramMap.get('DEFAULT_SUPPORT_MONTHLY')! : 0;

    let planCoveredDeduction = 0;
    const planCoveredList: string[] = [];

    if (planEntitledComponents.has('MAINTENANCE') && rawMaintenance > 0) {
      planCoveredDeduction += rawMaintenance;
      rawMaintenance = 0;
      planCoveredList.push('Manutenção preventiva coberta pelo Plano ' + orgPlan);
    }
    if (planEntitledComponents.has('SUPPORT') && rawSupport > 0) {
      planCoveredDeduction += rawSupport;
      rawSupport = 0;
      planCoveredList.push('Suporte a integrações coberto pelo Plano ' + orgPlan);
    }

    const externalLicenses = options.externalLicensesMonthly || 0;
    const projectedConsumption = options.projectedApiConsumptionMonthly || 0;

    const totalMonthly = Number(
      (rawMaintenance + rawSupport + externalLicenses + projectedConsumption).toFixed(2)
    );

    return {
      currency: policy?.currency || 'BRL',
      effort,
      internalBreakdown: {
        baseLaborCost,
        laborCostByDiscipline,
        infraCost,
        marginPct: defaultMarginPct,
        marginAmount: Number((priceBeforeTax - directCost).toFixed(2)),
        taxRatePct,
        taxAmount: Number((grossPrice - priceBeforeTax).toFixed(2))
      },
      clientBreakdown: {
        oneTimeFee: {
          onDemandDevelopment: onDemandPrice,
          setupAndDeployment: setupPrice,
          trainingAndDocumentation: trainingPrice,
          subtotalOneTime,
          discountAmount,
          totalOneTime
        },
        recurringMonthly: {
          maintenance: rawMaintenance,
          support: rawSupport,
          externalLicenses,
          projectedConsumption,
          planCoveredDeduction,
          totalMonthly
        },
        planCoveredComponents: planCoveredList
      },
      oneTimeTotal: totalOneTime,
      monthlyTotal: totalMonthly,
      discountPct: effectiveDiscountPct,
      pricingSnapshot: {
        calculatedAt: new Date().toISOString(),
        parametersUsed: Object.fromEntries(paramMap),
        policyId: policy?.id || null,
        clientPlan: orgPlan
      }
    };
  }
}
