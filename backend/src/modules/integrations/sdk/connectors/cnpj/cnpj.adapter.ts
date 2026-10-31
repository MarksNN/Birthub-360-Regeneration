import { ConnectorAdapter, ProviderManifest, AuthenticationAdapter, EntityMapper, ConnectorContext, RemoteRecord } from '../../contracts';

export const CNPJ_MANIFEST: ProviderManifest = {
  id: 'cnpj-api',
  name: 'ReceitaWS CNPJ API',
  version: '1.0.0',
  providerKey: 'CNPJ_API',
  category: 'DATA_PROVIDER',
  description: 'Conector para consulta de CNPJ',
  capabilities: { syncModes: ['ENRICHMENT', 'QUERY'], webhooks: false, pagination: false, incrementalSync: false },
  authentication: { type: 'NONE', notes: 'API pública/comercial baseada em plano' },
  permissions: { remoteScopes: [], localPermissions: ['company:read'], dataCategories: ['public_data'], justification: 'Enriquecimento de dados de empresas' },
  entities: [
    { name: 'cnpj', localEntity: 'company', fields: [{ name: 'cnpj', type: 'string', required: true }, { name: 'nome', type: 'string', required: true }], operations: ['read'] }
  ],
  operations: ['consulta.cnpj'],
  limits: { requestsPerSecond: 3, dailyQuota: 300, notes: 'Plano free limite' },
  events: [],
  technicalRequirements: ['HTTPS'],
  homologationStatus: 'AVAILABLE'
};

export class CNPJAuthAdapter implements AuthenticationAdapter {
  readonly type = 'NONE';
  async validateConfiguration(ctx: ConnectorContext) { return { valid: true, issues: [] }; }
  async authorize(ctx: ConnectorContext) { return {}; }
}

export class CNPJEntityMapper implements EntityMapper {
  toLocal(entity: string, remote: Record<string, unknown>) {
    if (entity === 'cnpj') return { name: remote.nome, cnpj: remote.cnpj, annualRevenue: 0 };
    return remote;
  }
  toRemote(entity: string, local: Record<string, unknown>) { return {}; }
}

export class CNPJAdapter implements ConnectorAdapter {
  readonly manifest = CNPJ_MANIFEST;
  readonly auth = new CNPJAuthAdapter();
  readonly mapper = new CNPJEntityMapper();
  readonly health = { async check() { return { healthy: true, details: 'CNPJ mock health' }; } };
  async query(ctx: ConnectorContext, entity: string, criteria: Record<string, unknown>): Promise<RemoteRecord[]> {
    if (entity === 'cnpj' && criteria.cnpj) {
      return [{ externalId: criteria.cnpj as string, entity: 'cnpj', data: { cnpj: criteria.cnpj, nome: 'EMPRESA MOCK LTDA' } }];
    }
    return [];
  }
}
