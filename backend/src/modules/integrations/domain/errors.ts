/**
 * Erros de domínio da Integration Factory. Todos carregam statusCode HTTP e um código estável
 * para que interface, API, Supervisor e Worker reportem o mesmo motivo de bloqueio.
 */
export class IntegrationDomainError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'IntegrationDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** Bloqueio comercial: desenvolvimento sem aceite válido + autorização interna. */
export class CommercialLockError extends IntegrationDomainError {
  public readonly reasons: string[];
  constructor(reasons: string[]) {
    super(
      'COMMERCIAL_LOCK',
      `Bloqueio comercial: o projeto não pode entrar em desenvolvimento. ${reasons.join(' ')}`,
      409,
      { reasons }
    );
    this.name = 'CommercialLockError';
    this.reasons = reasons;
  }
}

export class InvalidTransitionError extends IntegrationDomainError {
  constructor(from: string, to: string) {
    super('INVALID_TRANSITION', `Transição de estado não permitida: ${from} → ${to}.`, 409, { from, to });
    this.name = 'InvalidTransitionError';
  }
}

export class IntegrationPermissionError extends IntegrationDomainError {
  constructor(message: string) {
    super('FORBIDDEN', message, 403);
    this.name = 'IntegrationPermissionError';
  }
}

export class IntegrationNotFoundError extends IntegrationDomainError {
  constructor(entity: string) {
    super('NOT_FOUND', `${entity} não encontrado(a) na organização atual.`, 404);
    this.name = 'IntegrationNotFoundError';
  }
}

export class PricingConfigurationError extends IntegrationDomainError {
  constructor(missing: string[]) {
    super(
      'PRICING_PARAMETERS_MISSING',
      `Parâmetros comerciais não configurados pelo administrador da plataforma: ${missing.join(', ')}. Nenhum valor foi inventado.`,
      422,
      { missing }
    );
    this.name = 'PricingConfigurationError';
  }
}

export class ManifestValidationError extends IntegrationDomainError {
  constructor(issues: string[]) {
    super('INVALID_MANIFEST', `Manifest de conector inválido: ${issues.join('; ')}`, 422, { issues });
    this.name = 'ManifestValidationError';
  }
}

/** Erro sinalizado por adaptadores quando o provedor aplica limite de taxa. */
export class RateLimitError extends Error {
  public readonly retryAfterMs: number;
  constructor(retryAfterMs: number, message = 'Limite de requisições do provedor atingido') {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}
