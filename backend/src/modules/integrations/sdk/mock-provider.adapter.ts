import {
  ConnectorAdapter,
  ProviderManifest,
  AuthenticationAdapter,
  EntityMapper,
  InboundSyncAdapter,
  OutboundSyncAdapter,
  WebhookHandler,
  ConflictResolver,
  ConnectorHealthCheck,
  ConnectorTestSuite,
  ConnectorContext,
  RemoteRecord,
  RecordChange,
  ConflictResolution
} from './contracts';
import { sha256 } from '../domain/hash';

export const SIMULATED_ERP_MANIFEST: ProviderManifest = {
  id: 'simulated-erp',
  name: 'ERP Corporativo Simulado',
  version: '1.0.0',
  providerKey: 'SIMULATED_ERP',
  category: 'ERP',
  description: 'Conector simulado para testes de integração, pedidos, contratos e faturamento.',
  capabilities: {
    syncModes: ['INBOUND', 'OUTBOUND', 'BIDIRECTIONAL', 'QUERY'],
    webhooks: true,
    pagination: true,
    incrementalSync: true
  },
  authentication: {
    type: 'API_KEY',
    notes: 'Exige Header X-ERP-API-Key'
  },
  permissions: {
    remoteScopes: ['erp.customer.read', 'erp.customer.write', 'erp.invoice.read'],
    localPermissions: ['company:read', 'company:write', 'deal:read'],
    dataCategories: ['dados cadastrais', 'faturamento'],
    justification: 'Sincronizar clientes e contratos entre Birthub e ERP'
  },
  entities: [
    {
      name: 'customer',
      localEntity: 'company',
      fields: [
        { name: 'code', type: 'string', required: true },
        { name: 'corporate_name', type: 'string', required: true },
        { name: 'tax_id', type: 'string', required: true },
        { name: 'billing_email', type: 'email' },
        { name: 'annual_revenue', type: 'number' }
      ],
      operations: ['read', 'search', 'create', 'update']
    },
    {
      name: 'contract',
      localEntity: 'deal',
      fields: [
        { name: 'contract_id', type: 'string', required: true },
        { name: 'customer_code', type: 'string', required: true },
        { name: 'value', type: 'number', required: true },
        { name: 'status', type: 'string' }
      ],
      operations: ['read', 'create', 'update']
    }
  ],
  operations: ['erp.customer.list', 'erp.customer.upsert', 'erp.contract.upsert'],
  limits: {
    requestsPerSecond: 20,
    dailyQuota: 50000,
    notes: 'Rate limit padrão por organização contratante'
  },
  events: ['customer.created', 'customer.updated', 'invoice.paid'],
  technicalRequirements: ['HTTPS', 'TLS 1.3', 'IP Allowlist opcional'],
  homologationStatus: 'AVAILABLE'
};

export class MockAuthenticationAdapter implements AuthenticationAdapter {
  readonly type = 'API_KEY' as const;

  async validateConfiguration(ctx: ConnectorContext): Promise<{ valid: boolean; issues: string[] }> {
    const key = ctx.config.apiKey || ctx.credentials?.apiKey;
    if (!key) {
      return { valid: false, issues: ['Chave de API (apiKey) ausente na configuração da conexão.'] };
    }
    return { valid: true, issues: [] };
  }

  async authorize(ctx: ConnectorContext): Promise<Record<string, string>> {
    const key = (ctx.config.apiKey as string) || ctx.credentials?.apiKey || 'simulated-key';
    return { 'X-ERP-API-Key': key };
  }
}

export class MockEntityMapper implements EntityMapper {
  toLocal(entity: string, remote: Record<string, unknown>): Record<string, unknown> {
    if (entity === 'customer') {
      return {
        name: remote.corporate_name,
        cnpj: remote.tax_id,
        annualRevenue: remote.annual_revenue ? Number(remote.annual_revenue) : null
      };
    }
    if (entity === 'contract') {
      return {
        title: `Contrato ERP #${remote.contract_id}`,
        amount: Number(remote.value || 0)
      };
    }
    return remote;
  }

  toRemote(entity: string, local: Record<string, unknown>): Record<string, unknown> {
    if (entity === 'customer') {
      return {
        corporate_name: local.name,
        tax_id: local.cnpj,
        annual_revenue: local.annualRevenue
      };
    }
    if (entity === 'contract') {
      return {
        value: local.amount,
        status: 'ACTIVE'
      };
    }
    return local;
  }
}

export class MockInboundSyncAdapter implements InboundSyncAdapter {
  // Simulação in-memory de banco remoto para teste
  public inMemoryStore: Map<string, RemoteRecord> = new Map();

  async list(ctx: ConnectorContext, entity: string, cursor?: string): Promise<{ records: RemoteRecord[]; nextCursor?: string }> {
    const all = Array.from(this.inMemoryStore.values()).filter((r) => r.entity === entity);
    return { records: all };
  }
}

export class MockOutboundSyncAdapter implements OutboundSyncAdapter {
  public sentStore: Map<string, { entity: string; data: Record<string, unknown>; idempotencyKey: string }> = new Map();

  async push(
    ctx: ConnectorContext,
    entity: string,
    data: Record<string, unknown>,
    options: { externalId?: string; idempotencyKey: string }
  ): Promise<{ externalId: string }> {
    const externalId = options.externalId || `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.sentStore.set(options.idempotencyKey, {
      entity,
      data,
      idempotencyKey: options.idempotencyKey
    });
    return { externalId };
  }
}

export class MockWebhookHandler implements WebhookHandler {
  verify(ctx: ConnectorContext, headers: Record<string, string | string[] | undefined>, body: unknown): boolean {
    const signature = headers['x-webhook-signature'];
    const secret = ctx.config.webhookSecret as string;
    if (!secret) return true; // Se não configurou secret, aceita em ambiente simulado
    const computed = sha256(JSON.stringify(body) + secret);
    return signature === computed;
  }

  idempotencyKey(body: unknown): string {
    const b = body as Record<string, unknown>;
    return (b.eventId as string) || sha256(JSON.stringify(body));
  }

  eventType(body: unknown): string {
    const b = body as Record<string, unknown>;
    return (b.eventType as string) || 'unknown';
  }

  toChanges(body: unknown): RecordChange[] {
    const b = body as Record<string, unknown>;
    return [
      {
        entity: (b.entity as string) || 'customer',
        externalId: (b.externalId as string) || (b.id as string) || 'mock-id',
        action: b.action === 'delete' ? 'delete' : 'upsert',
        data: (b.data as Record<string, unknown>) || b
      }
    ];
  }
}

export class MockConflictResolver implements ConflictResolver {
  resolve(input: {
    strategy: string;
    local: { data: Record<string, unknown>; updatedAt: Date };
    remote: { data: Record<string, unknown>; updatedAt?: Date };
    lastSyncedAt: Date;
  }): ConflictResolution {
    if (input.strategy === 'REMOTE_WINS') {
      return { winner: 'REMOTE', reason: 'Estratégia configurada: Remote Wins' };
    }
    if (input.strategy === 'LOCAL_WINS') {
      return { winner: 'LOCAL', reason: 'Estratégia configurada: Local Wins' };
    }
    if (input.strategy === 'LAST_WRITE_WINS') {
      const localTime = input.local.updatedAt.getTime();
      const remoteTime = input.remote.updatedAt ? input.remote.updatedAt.getTime() : 0;
      return localTime >= remoteTime
        ? { winner: 'LOCAL', reason: 'Last write wins: alteração local mais recente' }
        : { winner: 'REMOTE', reason: 'Last write wins: alteração remota mais recente' };
    }
    return { winner: 'MANUAL', reason: 'Conflito detectado: resolução manual requerida' };
  }
}

export class MockHealthCheck implements ConnectorHealthCheck {
  async check(ctx: ConnectorContext): Promise<{ healthy: boolean; latencyMs?: number; details: string }> {
    const start = Date.now();
    return {
      healthy: true,
      latencyMs: Date.now() - start + 12,
      details: 'Conexão simulada operando normalmente'
    };
  }
}

export class MockConnectorTestSuite implements ConnectorTestSuite {
  cases = [
    {
      name: 'Autenticação e handshake',
      run: async (adapter: ConnectorAdapter, ctx: ConnectorContext) => {
        const val = await adapter.auth.validateConfiguration(ctx);
        if (!val.valid) throw new Error(val.issues.join(', '));
      }
    },
    {
      name: 'Verificação de Saúde (Health Check)',
      run: async (adapter: ConnectorAdapter, ctx: ConnectorContext) => {
        const h = await adapter.health.check(ctx);
        if (!h.healthy) throw new Error(h.details);
      }
    },
    {
      name: 'Mapeamento bidirecional de entidades',
      run: async (adapter: ConnectorAdapter) => {
        const local = { name: 'Empresa Teste', cnpj: '123456', annualRevenue: 50000 };
        const remote = adapter.mapper.toRemote('customer', local);
        const backToLocal = adapter.mapper.toLocal('customer', remote);
        if (backToLocal.name !== local.name) throw new Error('Falha no mapeamento reverso de empresa');
      }
    }
  ];
}

export class MockConnectorAdapter implements ConnectorAdapter {
  readonly manifest = SIMULATED_ERP_MANIFEST;
  readonly auth = new MockAuthenticationAdapter();
  readonly mapper = new MockEntityMapper();
  readonly inbound = new MockInboundSyncAdapter();
  readonly outbound = new MockOutboundSyncAdapter();
  readonly webhook = new MockWebhookHandler();
  readonly conflictResolver = new MockConflictResolver();
  readonly health = new MockHealthCheck();
  readonly testSuite = new MockConnectorTestSuite();

  async query(ctx: ConnectorContext, entity: string, criteria: Record<string, unknown>): Promise<RemoteRecord[]> {
    return Array.from(this.inbound.inMemoryStore.values()).filter(
      (r) => r.entity === entity && (!criteria.taxId || r.data.tax_id === criteria.taxId)
    );
  }
}
