import { ConnectorAdapter, ProviderManifest, AuthenticationAdapter, EntityMapper, ConnectorContext } from '../../contracts';

export const BITRIX24_MANIFEST: ProviderManifest = {
  id: 'bitrix24',
  name: 'Bitrix24 CRM',
  version: '1.0.0',
  providerKey: 'BITRIX24',
  category: 'CRM',
  description: 'Conector Bitrix24',
  capabilities: { syncModes: ['INBOUND', 'OUTBOUND', 'BIDIRECTIONAL'], webhooks: true, pagination: true, incrementalSync: true },
  authentication: { type: 'OAUTH2', notes: 'Requer Webhook URL ou OAuth' },
  permissions: { remoteScopes: ['crm'], localPermissions: ['company:read', 'company:write'], dataCategories: ['crm'], justification: 'Sincronizar CRM' },
  entities: [
    { name: 'crm.company', localEntity: 'company', fields: [{ name: 'ID', type: 'string', required: true }, { name: 'TITLE', type: 'string', required: true }], operations: ['read', 'create', 'update'] }
  ],
  operations: ['crm.company.list', 'crm.company.add', 'crm.company.update'],
  limits: { requestsPerSecond: 2, dailyQuota: null, notes: '2 req/s limit' },
  events: ['ONCRMCOMPANYADD', 'ONCRMCOMPANYUPDATE'],
  technicalRequirements: ['HTTPS'],
  homologationStatus: 'AVAILABLE'
};

export class Bitrix24AuthAdapter implements AuthenticationAdapter {
  readonly type = 'OAUTH2';
  async validateConfiguration(ctx: ConnectorContext) {
    if (!ctx.config.webhookUrl) return { valid: false, issues: ['Webhook URL missing'] };
    return { valid: true, issues: [] };
  }
  async authorize(ctx: ConnectorContext) {
    return {};
  }
}

export class Bitrix24EntityMapper implements EntityMapper {
  toLocal(entity: string, remote: Record<string, unknown>) {
    if (entity === 'crm.company') return { name: remote.TITLE, cnpj: remote.UF_CRM_CNPJ || '' };
    return remote;
  }
  toRemote(entity: string, local: Record<string, unknown>) {
    if (entity === 'crm.company') return { TITLE: local.name, UF_CRM_CNPJ: local.cnpj };
    return local;
  }
}

export class Bitrix24Adapter implements ConnectorAdapter {
  readonly manifest = BITRIX24_MANIFEST;
  readonly auth = new Bitrix24AuthAdapter();
  readonly mapper = new Bitrix24EntityMapper();
  readonly health = { async check() { return { healthy: true, details: 'Bitrix24 mock health' }; } };
}
