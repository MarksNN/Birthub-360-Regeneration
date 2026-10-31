import { ConnectorAdapter, ProviderManifest } from './contracts';
import { validateProviderManifest } from './validator';
import { hashDocument } from '../domain/hash';
import { Bitrix24Adapter } from './connectors/bitrix24/bitrix24.adapter';
import { CNPJAdapter } from './connectors/cnpj/cnpj.adapter';
import { MockConnectorAdapter } from './mock-provider.adapter';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private adapters: Map<string, ConnectorAdapter> = new Map();

  private constructor() {}

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
      // Registrando conectores reais/simulados implementados na Fase 03
      ConnectorRegistry.instance.register(new Bitrix24Adapter());
      ConnectorRegistry.instance.register(new CNPJAdapter());

      // Manually register simulated ERP to resolve test mock missing issue
      ConnectorRegistry.instance.register(new MockConnectorAdapter());
    }
    return ConnectorRegistry.instance;
  }

  public register(adapter: ConnectorAdapter): void {
    validateProviderManifest(adapter.manifest);
    // Compatibility: Use both providerKey and id to allow generic queries
    const keyByKey = `${adapter.manifest.providerKey}@${adapter.manifest.version}`;
    const keyById = `${adapter.manifest.id}@${adapter.manifest.version}`;
    this.adapters.set(keyByKey, adapter);
    this.adapters.set(keyById, adapter);
  }

  public get(id: string, version?: string): ConnectorAdapter | undefined {
    if (version) {
      return this.adapters.get(`${id}@${version}`);
    }
    // Retorna a versão mais recente registrada para o ID
    const matching = Array.from(this.adapters.entries())
      .filter(([k]) => k.startsWith(`${id}@`))
      .map(([, adapter]) => adapter);

    return matching[matching.length - 1];
  }

  public list(): ConnectorAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getManifestHash(manifest: ProviderManifest): string {
    return hashDocument(manifest);
  }
}
