import { IntegrationProjectStatus as S } from '@prisma/client';

/**
 * Máquina de estados oficial dos projetos de integração sob demanda (Fase 03).
 *
 * Regra absoluta: nenhum estado de desenvolvimento pode ser alcançado sem aceite comercial
 * válido + autorização interna. Esta tabela define apenas QUAIS transições existem; os
 * pré-requisitos comerciais são verificados pelo CommercialLock e, em defesa em profundidade,
 * por trigger no PostgreSQL.
 */
export const PROJECT_TRANSITIONS: Record<S, S[]> = {
  REQUESTED: [S.DISCOVERY, S.ON_HOLD, S.CANCELLED],
  DISCOVERY: [S.FEASIBILITY_REVIEW, S.ON_HOLD, S.CANCELLED],
  FEASIBILITY_REVIEW: [S.SCOPE_DRAFT, S.DISCOVERY, S.ON_HOLD, S.CANCELLED],
  SCOPE_DRAFT: [S.PRICING_REVIEW, S.FEASIBILITY_REVIEW, S.ON_HOLD, S.CANCELLED],
  PRICING_REVIEW: [S.PROPOSAL_READY, S.SCOPE_DRAFT, S.ON_HOLD, S.CANCELLED],
  PROPOSAL_READY: [S.PROPOSAL_SENT, S.PRICING_REVIEW, S.SCOPE_DRAFT, S.ON_HOLD, S.CANCELLED],
  PROPOSAL_SENT: [S.AWAITING_CUSTOMER_APPROVAL, S.PRICING_REVIEW, S.EXPIRED, S.CANCELLED],
  AWAITING_CUSTOMER_APPROVAL: [
    S.APPROVED_BY_CUSTOMER,
    S.REJECTED_BY_CUSTOMER,
    S.EXPIRED,
    S.PRICING_REVIEW, // Revisão material -> nova versão
    S.SCOPE_DRAFT,
    S.CANCELLED
  ],
  APPROVED_BY_CUSTOMER: [S.INTERNAL_AUTHORIZATION, S.PRICING_REVIEW, S.ON_HOLD, S.CANCELLED],
  REJECTED_BY_CUSTOMER: [S.SCOPE_DRAFT, S.PRICING_REVIEW, S.CANCELLED],
  EXPIRED: [S.PRICING_REVIEW, S.CANCELLED],
  INTERNAL_AUTHORIZATION: [S.AUTHORIZED_FOR_DEVELOPMENT, S.PRICING_REVIEW, S.ON_HOLD, S.CANCELLED],
  AUTHORIZED_FOR_DEVELOPMENT: [S.IN_DEVELOPMENT, S.ON_HOLD, S.CANCELLED],
  IN_DEVELOPMENT: [S.IN_TESTING, S.ON_HOLD, S.CANCELLED],
  IN_TESTING: [S.AWAITING_ACCEPTANCE, S.IN_DEVELOPMENT, S.ON_HOLD, S.CANCELLED],
  AWAITING_ACCEPTANCE: [S.ACCEPTED, S.IN_DEVELOPMENT, S.ON_HOLD],
  ACCEPTED: [S.AVAILABLE, S.ON_HOLD],
  AVAILABLE: [S.ON_HOLD],
  ON_HOLD: [S.CANCELLED], // Retomada só para o estado de origem (onHoldFromStatus)
  CANCELLED: []
};

/** Estados que exigem aceite comercial válido E ordem de projeto executável (autorização interna). */
export const DEVELOPMENT_GATED_STATES: ReadonlySet<S> = new Set([
  S.AUTHORIZED_FOR_DEVELOPMENT,
  S.IN_DEVELOPMENT,
  S.IN_TESTING,
  S.AWAITING_ACCEPTANCE,
  S.ACCEPTED,
  S.AVAILABLE
]);

/** Estados que exigem ao menos um aceite válido do cliente vinculado à versão vigente. */
export const APPROVAL_GATED_STATES: ReadonlySet<S> = new Set([S.APPROVED_BY_CUSTOMER, S.INTERNAL_AUTHORIZATION]);

/** Estados em que o escopo/preço ainda pode ser revisado sem afetar contratação. */
export const PRE_CONTRACT_STATES: ReadonlySet<S> = new Set([
  S.REQUESTED,
  S.DISCOVERY,
  S.FEASIBILITY_REVIEW,
  S.SCOPE_DRAFT,
  S.PRICING_REVIEW,
  S.PROPOSAL_READY,
  S.PROPOSAL_SENT,
  S.AWAITING_CUSTOMER_APPROVAL,
  S.REJECTED_BY_CUSTOMER,
  S.EXPIRED
]);

export function isTransitionAllowed(from: S, to: S, onHoldFromStatus?: S | null): boolean {
  if (from === S.ON_HOLD) {
    return to === S.CANCELLED || (!!onHoldFromStatus && to === onHoldFromStatus);
  }
  return PROJECT_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Rótulos amigáveis exibidos ao cliente — diferenciam proposta, projeto aprovado, desenvolvimento e operação. */
export const PROJECT_STATUS_LABELS: Record<S, { label: string; phase: 'PROPOSTA' | 'CONTRATACAO' | 'DESENVOLVIMENTO' | 'OPERACAO' | 'ENCERRADO' }> = {
  REQUESTED: { label: 'Solicitação recebida', phase: 'PROPOSTA' },
  DISCOVERY: { label: 'Discovery de requisitos', phase: 'PROPOSTA' },
  FEASIBILITY_REVIEW: { label: 'Análise de viabilidade', phase: 'PROPOSTA' },
  SCOPE_DRAFT: { label: 'Escopo em elaboração', phase: 'PROPOSTA' },
  PRICING_REVIEW: { label: 'Estimativa em revisão comercial', phase: 'PROPOSTA' },
  PROPOSAL_READY: { label: 'Proposta pronta', phase: 'PROPOSTA' },
  PROPOSAL_SENT: { label: 'Proposta enviada', phase: 'PROPOSTA' },
  AWAITING_CUSTOMER_APPROVAL: { label: 'Aguardando aprovação do cliente', phase: 'CONTRATACAO' },
  APPROVED_BY_CUSTOMER: { label: 'Aprovada pelo cliente', phase: 'CONTRATACAO' },
  REJECTED_BY_CUSTOMER: { label: 'Rejeitada pelo cliente', phase: 'ENCERRADO' },
  EXPIRED: { label: 'Proposta expirada', phase: 'ENCERRADO' },
  INTERNAL_AUTHORIZATION: { label: 'Autorização interna em andamento', phase: 'CONTRATACAO' },
  AUTHORIZED_FOR_DEVELOPMENT: { label: 'Autorizado para desenvolvimento', phase: 'DESENVOLVIMENTO' },
  IN_DEVELOPMENT: { label: 'Em desenvolvimento', phase: 'DESENVOLVIMENTO' },
  IN_TESTING: { label: 'Em testes', phase: 'DESENVOLVIMENTO' },
  AWAITING_ACCEPTANCE: { label: 'Aguardando aceite final da entrega', phase: 'DESENVOLVIMENTO' },
  ACCEPTED: { label: 'Entrega aceita', phase: 'OPERACAO' },
  AVAILABLE: { label: 'Integração disponível', phase: 'OPERACAO' },
  ON_HOLD: { label: 'Em espera', phase: 'ENCERRADO' },
  CANCELLED: { label: 'Cancelado', phase: 'ENCERRADO' }
};
