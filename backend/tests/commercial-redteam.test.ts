import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { CommercialCatalogV31 } from '../src/modules/supervisor/v3_1/catalog';
import { CommercialRedTeamRunnerV31 } from '../src/modules/supervisor/v3_1/redteam-runner';
import { CommercialPolicyGuardV31 } from '../src/modules/supervisor/v3_1/policy-guard';

describe('Birthub 360 Comercial V3.1 — Golden Set Red Team (209 Casos) & Outbound Crítico', () => {
  const catalog = CommercialCatalogV31.getInstance();

  it('deve carregar e aprovar todos os 209 cenários de Red Team dos 19 Agentes', () => {
    const report = CommercialRedTeamRunnerV31.runFullRedTeamSuite();

    expect(report.totalSuites).toBe(19);
    expect(report.totalCases).toBe(209);
    expect(report.failedCases).toBe(0);
    expect(report.passedCases).toBe(209);
  });

  it('deve validar os 10 cenários críticos do Golden Set Outbound V3.1', () => {
    const outboundGoldenPath = path.join(
      catalog.getBasePath(),
      '06_TESTES',
      'OUTBOUND_ORIGINAL_GOLDEN_SET_CRITICO_10_V3_1.json'
    );
    const raw = fs.readFileSync(outboundGoldenPath, 'utf8');
    const cases = JSON.parse(raw);

    expect(cases.length).toBe(10);

    for (const testCase of cases) {
      if (testCase.id === 'G01') {
        // WhatsApp sem opt-in deve ser BLOCKED
        const compliance = {
          channel: 'WHATSAPP' as const,
          sendEligible: false,
          reason: 'Pendente',
          checks: [],
          signals: {
            whatsappOptIn: 'UNKNOWN' as const,
            optOutSuppression: 'CLEAR' as const,
            touchHistory: 'NO_CONFLICT' as const,
            businessHours: 'WITHIN_WINDOW' as const,
            timezone: 'America/Sao_Paulo'
          }
        };
        const check = CommercialPolicyGuardV31.evaluateSendEligibility(compliance);
        expect(check.eligible).toBe(false);
      } else if (testCase.id === 'G02') {
        // Supressão desconhecida não libera envio
        const compliance = {
          channel: 'EMAIL' as const,
          sendEligible: false,
          reason: 'Pendente',
          checks: [],
          signals: {
            whatsappOptIn: 'NOT_APPLICABLE' as const,
            optOutSuppression: 'UNKNOWN' as const,
            touchHistory: 'NO_CONFLICT' as const,
            businessHours: 'WITHIN_WINDOW' as const,
            timezone: null
          }
        };
        const check = CommercialPolicyGuardV31.evaluateSendEligibility(compliance);
        expect(check.eligible).toBe(false);
      } else if (testCase.id === 'G07') {
        // Loop sdr -> outbound -> sdr
        const state = {
          missionId: 'mis-g07',
          organizationId: 'org-test',
          supervisorSteps: 2,
          totalHandoffs: 2,
          handoffsBySpecialist: { outbound: 1 },
          depth: 2,
          historyAgentIds: ['sdr' as any, 'outbound' as any],
          startTime: Date.now()
        };
        const check = CommercialPolicyGuardV31.validateHandoff(state, 'outbound', 'sdr');
        expect(check.allowed).toBe(false);
        expect(check.blockCode).toBe('CYCLIC_LOOP_BLOCKED');
      } else if (testCase.id === 'G08') {
        // Mais de 2 handoffs pelo especialista
        const state = {
          missionId: 'mis-g08',
          organizationId: 'org-test',
          supervisorSteps: 3,
          totalHandoffs: 3,
          handoffsBySpecialist: { outbound: 2 },
          depth: 2,
          historyAgentIds: ['supervisor' as any, 'outbound' as any],
          startTime: Date.now()
        };
        const check = CommercialPolicyGuardV31.validateHandoff(state, 'outbound', 'crm');
        expect(check.allowed).toBe(false);
        expect(check.blockCode).toBe('SPECIALIST_HANDOFF_LIMIT');
      }
    }
  });
});
