import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { CommercialCatalogV31 } from '../src/modules/supervisor/v3_1/catalog';
import { CommercialContextAssemblerV31 } from '../src/modules/supervisor/v3_1/context-assembler';
import { CommercialSchemaValidatorV31 } from '../src/modules/supervisor/v3_1/schema-validator';
import { CommercialPolicyGuardV31, MissionTrackingState } from '../src/modules/supervisor/v3_1/policy-guard';
import { CommercialSupervisorOrchestratorV31 } from '../src/modules/supervisor/v3_1/orchestrator';
import { ALL_AGENT_IDS_V31, AgentResultV31 } from '../src/modules/supervisor/v3_1/types';

describe('Birthub 360 Comercial V3.1 — Matriz de 19 Especialistas e 463 Habilidades', () => {
  const catalog = CommercialCatalogV31.getInstance();

  describe('1. Validação Estática do Catálogo V3.1', () => {
    it('deve conter exatamente 19 agentes especializados e 463 habilidades únicas', () => {
      const agents = catalog.getAgents();
      expect(agents.length).toBe(19);

      const skills = catalog.getSkills();
      expect(skills.length).toBe(463);

      const uniqueSkillIds = new Set(skills.map((s) => s.id));
      expect(uniqueSkillIds.size).toBe(463);
    });

    it('todos os 19 agentes do catálogo devem corresponder aos IDs canônicos', () => {
      const agents = catalog.getAgents();
      const agentIds = agents.map((a) => a.id);
      expect(agentIds.sort()).toEqual([...ALL_AGENT_IDS_V31].sort());
    });

    it('cada agente deve possuir seu arquivo de prompt e índice de habilidades válido', () => {
      for (const agentId of ALL_AGENT_IDS_V31) {
        const agentMeta = catalog.getAgent(agentId);
        expect(agentMeta).toBeDefined();

        const prompt = catalog.readAgentPrompt(agentId);
        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(100);

        const index = catalog.getAgentIndex(agentId);
        expect(index).toBeDefined();
        expect(index!.skills.length).toBe(agentMeta!.skills);
        expect(index!.playbooks.length).toBe(agentMeta!.playbooks);
      }
    });

    it('todos os playbooks referenciados nos índices devem existir fisicamente no disco', () => {
      let totalPlaybooksFound = 0;
      for (const agentId of ALL_AGENT_IDS_V31) {
        const playbooks = catalog.getPlaybooks(agentId);
        for (const pb of playbooks) {
          const content = catalog.readPlaybookContent(agentId, pb.id);
          expect(content).toBeTruthy();
          expect(content!.length).toBeGreaterThan(50);
          totalPlaybooksFound++;
        }
      }
      expect(totalPlaybooksFound).toBe(99);
    });

    it('deve carregar o Core Compartilhado V3.1 sem duplicações', () => {
      const core = catalog.readCorePrompt();
      expect(core).toContain('NÚCLEO COMPARTILHADO — BIRTHUB 360°');
      expect(core).toContain('AUTORIDADE E CONFIANÇA');
      expect(core).toContain('GOVERNANÇA DE CONTATO B2B NO BRASIL');
    });
  });

  describe('2. Validação Semântica do Schema Global V3.1 e Exemplos JSON', () => {
    it('deve validar com sucesso todos os 38 exemplos JSON canônicos (2 por agente)', () => {
      const basePath = catalog.getBasePath();
      const exemplosPath = path.join(basePath, '05_EXEMPLOS');
      const files = fs.readdirSync(exemplosPath).filter((f) => f.endsWith('.json'));

      expect(files.length).toBe(38);

      for (const file of files) {
        const raw = fs.readFileSync(path.join(exemplosPath, file), 'utf8');
        const obj = JSON.parse(raw);
        const result = CommercialSchemaValidatorV31.validate(obj);
        expect(result.valid, `Falha de validação no arquivo ${file}: ${result.errors.join(', ')}`).toBe(true);
      }
    });

    it('deve rejeitar envelopes com gates UNKNOWN quando sendEligible=true', () => {
      const invalidPayload: any = {
        schemaVersion: '3.1',
        agentId: 'outbound',
        missionId: 'mis-1',
        correlationId: 'corr-1',
        status: 'COMPLETED',
        mode: 'OPERACIONAL',
        skillIds: ['comercial.outbound.executar-cadencia-email'],
        summary: 'Envio solicitado',
        resumo_humano: 'Envio efetuado',
        artifacts: [],
        evidence: [],
        hypotheses: [],
        missingData: [],
        compliance: {
          channel: 'EMAIL',
          sendEligible: true, // Inválido com gate UNKNOWN
          reason: 'Tentativa indevida',
          checks: [
            { check: 'OPT_OUT', state: 'UNKNOWN', reason: 'Não verificado', evidenceRef: null }
          ],
          signals: {
            whatsappOptIn: 'NOT_APPLICABLE',
            optOutSuppression: 'UNKNOWN',
            touchHistory: 'UNKNOWN',
            businessHours: 'NOT_APPLICABLE',
            timezone: null
          }
        },
        approvalPending: {
          required: false,
          status: 'NOT_REQUIRED',
          action: null,
          approverRole: null,
          requestId: null,
          reason: ''
        },
        handoffs: [],
        execution: {
          actionType: 'NONE',
          performed: false,
          state: 'NONE',
          executionId: null,
          idempotencyKey: null,
          toolCalls: []
        },
        metrics: {},
        nextStep: 'Concluído'
      };

      const result = CommercialSchemaValidatorV31.validate(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('sendEligible'))).toBe(true);
    });
  });

  describe('3. Montagem de Contexto Dinâmico (Context Assembler)', () => {
    it('deve montar o contexto completo e injetar playbooks sob demanda apenas para as skills solicitadas', () => {
      const agentId = 'crm';
      const skillId = 'comercial.crm.inspecionar-fila-bitrix';
      const result = CommercialContextAssemblerV31.assemble(agentId, [skillId]);

      expect(result.flags.indexInjected).toBe(true);
      expect(result.flags.schemaReady).toBe(true);
      expect(result.flags.operationalAllowedByBootstrap).toBe(false);
      expect(result.flags.loadedPlaybooks.length).toBe(1);
      expect(result.flags.loadedPlaybooks[0]).toBe('P3');
      expect(result.flags.missingPlaybooks.length).toBe(0);

      expect(result.fullPrompt).toContain('NÚCLEO COMPARTILHADO — BIRTHUB 360°');
      expect(result.fullPrompt).toContain('Guardião do CRM e do Bitrix');
      expect(result.fullPrompt).toContain('PLAYBOOK P3:');
    });

    it('deve lançar erro caso uma skillId não pertença ao agente solicitado', () => {
      expect(() => {
        CommercialContextAssemblerV31.assemble('crm', ['comercial.outbound.executar-cadencia-email']);
      }).toThrow(/não pertence ao agente/);
    });
  });

  describe('4. Governança e Policy Guard V3.1', () => {
    it('deve vetar elegibilidade de envio se a política de opt-out ou LGPD não foi revisada', () => {
      const compliance = {
        channel: 'EMAIL' as const,
        sendEligible: false,
        reason: 'Pendente',
        checks: [
          { check: 'OPT_OUT' as const, state: 'UNKNOWN' as const, reason: 'Desconhecido', evidenceRef: null }
        ],
        signals: {
          whatsappOptIn: 'NOT_APPLICABLE' as const,
          optOutSuppression: 'UNKNOWN' as const,
          touchHistory: 'UNKNOWN' as const,
          businessHours: 'NOT_APPLICABLE' as const,
          timezone: null
        }
      };

      const check = CommercialPolicyGuardV31.evaluateSendEligibility(compliance);
      expect(check.eligible).toBe(false);
      expect(check.reasons.length).toBeGreaterThan(0);
    });

    it('deve bloquear loops cíclicos A -> B -> A sem nova evidência', () => {
      const state: MissionTrackingState = {
        missionId: 'mis-loop',
        organizationId: 'org-test',
        supervisorSteps: 2,
        totalHandoffs: 2,
        handoffsBySpecialist: { sdr: 1, solucoes: 1 },
        depth: 2,
        historyAgentIds: ['sdr', 'solucoes'],
        startTime: Date.now()
      };

      const check = CommercialPolicyGuardV31.validateHandoff(state, 'solucoes', 'sdr');
      expect(check.allowed).toBe(false);
      expect(check.blockCode).toBe('CYCLIC_LOOP_BLOCKED');
    });

    it('deve bloquear quando atingir o limite de handoffs do especialista (máx 2)', () => {
      const state: MissionTrackingState = {
        missionId: 'mis-limit',
        organizationId: 'org-test',
        supervisorSteps: 3,
        totalHandoffs: 3,
        handoffsBySpecialist: { sdr: 2 },
        depth: 2,
        historyAgentIds: ['supervisor', 'sdr'],
        startTime: Date.now()
      };

      const check = CommercialPolicyGuardV31.validateHandoff(state, 'sdr', 'solucoes');
      expect(check.allowed).toBe(false);
      expect(check.blockCode).toBe('SPECIALIST_HANDOFF_LIMIT');
    });
  });

  describe('5. Orquestrador Supervisor V3.1', () => {
    it('deve rotear inteligentemente intenções para os especialistas apropriados', () => {
      expect(CommercialSupervisorOrchestratorV31.routeIntent('Preciso verificar as etapas do Bitrix24').agentId).toBe('crm');
      expect(CommercialSupervisorOrchestratorV31.routeIntent('Monte uma cadência outbound de cold call').agentId).toBe('outbound');
      expect(CommercialSupervisorOrchestratorV31.routeIntent('Defina o ICP ideal para o segmento de tecnologia').agentId).toBe('icp');
      expect(CommercialSupervisorOrchestratorV31.routeIntent('Avalie o risco e saúde do deal estagnado').agentId).toBe('deal_health');
      expect(CommercialSupervisorOrchestratorV31.routeIntent('Projete a receita e o forecast do próximo trimestre').agentId).toBe('forecast');
    });

    it('deve executar uma missão comercial gerando síntese humana legível e envelope semântico V3.1', async () => {
      const response = await CommercialSupervisorOrchestratorV31.execute({
        organizationId: 'org-empresa-alfa',
        userId: 'usr-analista-1',
        userPrompt: 'Verifique a fila de leads e o mapeamento de campos do Bitrix24',
        mode: 'CONSULTIVO'
      });

      expect(response.status).toBe('COMPLETED');
      expect(response.mode).toBe('CONSULTIVO');
      expect(response.assignedAgent.id).toBe('crm');
      expect(response.skillsUsed.length).toBeGreaterThan(0);
      expect(response.resumo_humano).toContain('Guardião do CRM e do Bitrix');
      expect(response.artifacts.length).toBeGreaterThan(0);
      expect(response.rawEnvelope?.schemaVersion).toBe('3.1');
    });
  });
});
