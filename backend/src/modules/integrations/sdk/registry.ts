import { ConnectorAdapter, ProviderManifest } from './contracts';
import { validateProviderManifest } from './validator';
import { hashDocument } from '../domain/hash';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private adapters: Map<string, ConnectorAdapter> = new Map();

  private constructor() {}

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  public register(adapter: ConnectorAdapter): void {
    validateProviderManifest(adapter.manifest);
    const key = `${adapter.manifest.id}@${adapter.manifest.version}`;
    this.adapters.set(key, adapter);
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
