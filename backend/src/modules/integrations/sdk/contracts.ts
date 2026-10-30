/**
 * BIRTHUB 360 — UNIVERSAL CONNECTOR SDK (Fase 03)
 *
 * Contratos reutilizáveis para qualquer provedor (CRM, ERP, IA, comunicação, produtividade...).
 * O núcleo do CRM nunca conhece um provedor específico: ele só conversa com estas interfaces.
 *
 * Regras de segurança do SDK:
 *  - Manifests são DECLARATIVOS (dados). Nunca contêm código executável.
 *  - Adaptadores só entram no registro quando fazem parte do código-fonte revisado da plataforma.
 *  - Não existe carregamento dinâmico de código enviado por clientes.
 *  - Código gerado por agentes é desenvolvido em ambiente de engenharia isolado e só é
 *    disponibilizado após revisão e aprovação técnica (IntegrationRelease).
 */

export type ConnectorCategory =
  | 'CRM'
  | 'ERP'
  | 'FINANCIAL'
  | 'BILLING'
  | 'DATA_PROVIDER'
  | 'COMMUNICATION'
  | 'AI_PROVIDER'
  | 'PRODUCTIVITY'
  | 'CUSTOM';

export type AuthenticationType = 'OAUTH2' | 'API_KEY' | 'INBOUND_WEBHOOK_TOKEN' | 'BASIC' | 'NONE';

export type EntityOperation = 'read' | 'search' | 'create' | 'update' | 'delete';

/** Modos de troca de dados — NÃO são equivalentes entre si. */
export type SyncMode =
  | 'INBOUND' // Provedor -> Birthub (webhook ou pull)
  | 'OUTBOUND' // Birthub -> Provedor
  | 'BIDIRECTIONAL' // Ambos, com gestão de conflitos
  | 'ENRICHMENT' // Consulta pontual para enriquecer um registro local (sem vínculo bidirecional)
  | 'QUERY'; // Consulta sob demanda somente leitura

export type CatalogHomologationStatus =
  | 'PLANNED'
  | 'UNDER_DISCOVERY'
  | 'AVAILABLE_FOR_PROPOSAL'
  | 'UNDER_DEVELOPMENT'
  | 'IN_TESTING'
  | 'HOMOLOGATED'
  | 'AVAILABLE'
  | 'DEPRECATED';

/** Transformações declarativas permitidas no mapeamento de campos (lista branca). */
export const ALLOWED_FIELD_TRANSFORMS = [
  'trim',
  'lowercase',
  'uppercase',
  'digitsOnly',
  'toNumber',
  'toISODate',
  'firstArrayValue'
] as const;
export type FieldTransform = (typeof ALLOWED_FIELD_TRANSFORMS)[number];

export interface EntityFieldDescriptor {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'json';
  required?: boolean;
  description?: string;
}

export interface EntityDescriptor {
  name: string; // Nome remoto da entidade (ex.: contact, company, deal)
  localEntity?: 'contact' | 'company' | 'lead' | 'deal' | 'activity'; // Entidade do CRM Birthub correspondente
  fields: EntityFieldDescriptor[];
  operations: EntityOperation[];
}

/** Permissões que o conector exige no provedor e no Birthub — exibidas ao cliente antes da ativação. */
export interface ConnectorPermissionManifest {
  remoteScopes: string[]; // Escopos/permissões solicitados no provedor
  localPermissions: string[]; // Ex.: "contact:read", "contact:write"
  dataCategories: string[]; // Ex.: "dados cadastrais", "dados financeiros"
  justification: string;
}

export interface ProviderManifest {
  id: string; // Identificador estável do conector (kebab-case)
  name: string;
  version: string; // semver
  providerKey: string;
  category: ConnectorCategory;
  description: string;
  capabilities: {
    syncModes: SyncMode[];
    webhooks: boolean;
    pagination: boolean;
    incrementalSync: boolean;
  };
  authentication: {
    type: AuthenticationType;
    scopes?: string[];
    notes?: string;
  };
  permissions: ConnectorPermissionManifest;
  entities: EntityDescriptor[];
  operations: string[]; // Operações remotas efetivamente utilizadas (ex.: crm.contact.list)
  limits: {
    requestsPerSecond?: number | null;
    dailyQuota?: number | null;
    notes: string;
  };
  events: string[]; // Eventos de webhook suportados
  technicalRequirements: string[];
  homologationStatus: CatalogHomologationStatus;
}

// ------------------------------------------------------------------- Contratos de runtime

export interface ConnectorContext {
  organizationId: string;
  connectionId: string;
  config: Record<string, unknown>;
  /** Credenciais resolvidas a partir de credentialRef em tempo de execução (nunca persistidas em claro). */
  credentials?: Record<string, string>;
}

export interface RemoteRecord {
  externalId: string;
  entity: string;
  data: Record<string, unknown>;
  updatedAt?: string;
}

export interface RecordChange {
  entity: string;
  externalId: string;
  action: 'upsert' | 'delete';
  data?: Record<string, unknown>;
  occurredAt?: string;
}

export interface AuthenticationAdapter {
  readonly type: AuthenticationType;
  /** Valida a configuração de autenticação sem expor segredos. */
  validateConfiguration(ctx: ConnectorContext): Promise<{ valid: boolean; issues: string[] }>;
  /** Monta cabeçalhos/parâmetros de autenticação para chamadas ao provedor. */
  authorize(ctx: ConnectorContext): Promise<Record<string, string>>;
}

export interface EntityMapper {
  toLocal(entity: string, remote: Record<string, unknown>): Record<string, unknown>;
  toRemote(entity: string, local: Record<string, unknown>): Record<string, unknown>;
}

export interface InboundSyncAdapter {
  /** Lista registros remotos (pull) — usado em carga inicial e reconciliação. */
  list(ctx: ConnectorContext, entity: string, cursor?: string): Promise<{ records: RemoteRecord[]; nextCursor?: string }>;
}

export interface OutboundSyncAdapter {
  /** Envia um registro local ao provedor; deve ser idempotente pela chave informada. */
  push(
    ctx: ConnectorContext,
    entity: string,
    data: Record<string, unknown>,
    options: { externalId?: string; idempotencyKey: string }
  ): Promise<{ externalId: string }>;
}

export interface WebhookHandler {
  /** Verifica autenticidade do webhook (assinatura/token). */
  verify(ctx: ConnectorContext, headers: Record<string, string | string[] | undefined>, body: unknown): boolean;
  /** Chave de idempotência do evento (identificador do provedor ou hash do conteúdo). */
  idempotencyKey(body: unknown): string;
  eventType(body: unknown): string;
  /** Converte o evento em mudanças normalizadas. */
  toChanges(body: unknown): RecordChange[];
}

export interface ConflictResolution {
  winner: 'LOCAL' | 'REMOTE' | 'MANUAL';
  reason: string;
}

export interface ConflictResolver {
  resolve(input: {
    strategy: string;
    local: { data: Record<string, unknown>; updatedAt: Date };
    remote: { data: Record<string, unknown>; updatedAt?: Date };
    lastSyncedAt: Date;
  }): ConflictResolution;
}

export interface ConnectorHealthCheck {
  check(ctx: ConnectorContext): Promise<{ healthy: boolean; latencyMs?: number; details: string }>;
}

export interface ConnectorTestCase {
  name: string;
  run(adapter: ConnectorAdapter, ctx: ConnectorContext): Promise<void>;
}

export interface ConnectorTestSuite {
  cases: ConnectorTestCase[];
}

export interface ConnectorAdapter {
  readonly manifest: ProviderManifest;
  readonly auth: AuthenticationAdapter;
  readonly mapper: EntityMapper;
  readonly inbound?: InboundSyncAdapter;
  readonly outbound?: OutboundSyncAdapter;
  readonly webhook?: WebhookHandler;
  readonly conflictResolver?: ConflictResolver;
  readonly health: ConnectorHealthCheck;
  readonly testSuite?: ConnectorTestSuite;
  /** Consulta pontual (modos QUERY/ENRICHMENT). */
  query?(ctx: ConnectorContext, entity: string, criteria: Record<string, unknown>): Promise<RemoteRecord[]>;
}

export interface ConnectorTestReport {
  connectorId: string;
  version: string;
  passed: number;
  failed: number;
  results: Array<{ name: string; ok: boolean; error?: string; durationMs: number }>;
  executedAt: string;
}
