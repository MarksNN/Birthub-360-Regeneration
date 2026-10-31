import { CommercialCatalogV31 } from './catalog';
import {
  AgentIdV31,
  ExecutionPolicyLimitsV31,
  ComplianceV31
} from './types';

export interface MissionTrackingState {
  missionId: string;
  organizationId: string;
  supervisorSteps: number;
  totalHandoffs: number;
  handoffsBySpecialist: Record<string, number>;
  depth: number;
  historyAgentIds: AgentIdV31[];
  startTime: number;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  blockCode?: string;
}

export class CommercialPolicyGuardV31 {
  private static defaultLimits: ExecutionPolicyLimitsV31 = {
    maxSupervisorStepsPerMission: 8,
    maxHandoffDepth: 3,
    maxHandoffsPerMission: 6,
    maxParallelTasks: 3,
    missionTimeoutSeconds: 120,
    stepTimeoutSeconds: 45,
    maxRetriesPerIdempotentAction: 1,
    tokenBudgetPerMission: 12000,
    maxHandoffsPerSpecialist: 2
  };

  public static getLimits(): ExecutionPolicyLimitsV31 {
    const catalog = CommercialCatalogV31.getInstance();
    const policy = catalog.getExecutionPolicy();
    return policy.limits || this.defaultLimits;
  }

  /**
   * Avalia se uma ação de envio real de mensagem é elegível perante a governança de contatos B2B e LGPD:
   * - LGPD / Legítimo interesse verificado
   * - Opt-out / supressão checado
   * - Nenhum check com status UNKNOWN ou FAIL
   * - Nenhum signal impeditivo (optOutSuppression, touchHistory, whatsappOptIn, etc.)
   */
  public static evaluateSendEligibility(compliance: ComplianceV31): { eligible: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (compliance.channel === 'NONE') {
      return { eligible: false, reasons: ['Canal é NONE — nenhuma comunicação configurada'] };
    }

    // Regra crítica para WhatsApp
    if (compliance.channel === 'WHATSAPP' || compliance.channel === 'MULTICHANNEL') {
      if (compliance.signals.whatsappOptIn !== 'CONFIRMED') {
        reasons.push(`WhatsApp opt-in em estado ${compliance.signals.whatsappOptIn}; envio direto não autorizado.`);
      }
    }

    const failedChecks = compliance.checks.filter((c) => c.state === 'FAIL');
    if (failedChecks.length > 0) {
      reasons.push(`Checks reprovados: ${failedChecks.map((c) => c.check).join(', ')}`);
    }

    const unknownChecks = compliance.checks.filter((c) => c.state === 'UNKNOWN');
    if (unknownChecks.length > 0) {
      reasons.push(`Checks em estado UNKNOWN não conferem aprovação: ${unknownChecks.map((c) => c.check).join(', ')}`);
    }

    if (compliance.signals.optOutSuppression !== 'CLEAR') {
      reasons.push(`Sinal optOutSuppression (${compliance.signals.optOutSuppression}) impede envio real.`);
    }

    if (compliance.signals.touchHistory !== 'NO_CONFLICT') {
      reasons.push(`Sinal touchHistory (${compliance.signals.touchHistory}) impede envio real.`);
    }

    if (compliance.signals.businessHours !== 'WITHIN_WINDOW' && compliance.signals.businessHours !== 'NOT_APPLICABLE') {
      reasons.push(`Sinal businessHours (${compliance.signals.businessHours}) fora da janela autorizada.`);
    }

    const eligible = reasons.length === 0;
    return { eligible, reasons };
  }

  /**
   * Verifica limites de orquestração e previne loops cíclicos
   */
  public static validateHandoff(
    state: MissionTrackingState,
    fromAgent: AgentIdV31,
    toAgent: AgentIdV31
  ): PolicyCheckResult {
    const limits = this.getLimits();

    // 1. Timeout da missão
    const elapsedSeconds = (Date.now() - state.startTime) / 1000;
    if (elapsedSeconds > limits.missionTimeoutSeconds) {
      return {
        allowed: false,
        reason: `Tempo limite da missão excedido (${elapsedSeconds.toFixed(1)}s > ${limits.missionTimeoutSeconds}s)`,
        blockCode: 'MISSION_TIMEOUT'
      };
    }

    // 2. Máximo de passos de supervisor
    if (state.supervisorSteps >= limits.maxSupervisorStepsPerMission) {
      return {
        allowed: false,
        reason: `Limite de passos do supervisor atingido (${state.supervisorSteps}/${limits.maxSupervisorStepsPerMission})`,
        blockCode: 'MAX_SUPERVISOR_STEPS_REACHED'
      };
    }

    // 3. Máximo de handoffs totais
    if (state.totalHandoffs >= limits.maxHandoffsPerMission) {
      return {
        allowed: false,
        reason: `Limite de handoffs por missão atingido (${state.totalHandoffs}/${limits.maxHandoffsPerMission})`,
        blockCode: 'MAX_HANDOFFS_REACHED'
      };
    }

    // 4. Máximo de handoffs por especialista
    const specialistCount = state.handoffsBySpecialist[fromAgent] || 0;
    if (specialistCount >= limits.maxHandoffsPerSpecialist) {
      return {
        allowed: false,
        reason: `Especialista "${fromAgent}" atingiu o limite de ${limits.maxHandoffsPerSpecialist} handoffs originados`,
        blockCode: 'SPECIALIST_HANDOFF_LIMIT'
      };
    }

    // 5. Profundidade máxima de delegação
    if (state.depth >= limits.maxHandoffDepth) {
      return {
        allowed: false,
        reason: `Profundidade máxima de delegação atingida (${state.depth}/${limits.maxHandoffDepth})`,
        blockCode: 'MAX_DEPTH_REACHED'
      };
    }

    // 6. Prevenção de loop cíclico imediato A -> B -> A sem nova evidência
    const history = state.historyAgentIds;
    if (history.length >= 2) {
      const prevAgent = history[history.length - 2];
      if (prevAgent === toAgent) {
        return {
          allowed: false,
          reason: `Loop cíclico rejeitado: ${fromAgent} tentando repassar de volta para ${toAgent} sem nova evidência`,
          blockCode: 'CYCLIC_LOOP_BLOCKED'
        };
      }
    }

    return { allowed: true };
  }
}
