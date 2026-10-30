import { ProviderManifest, ALLOWED_FIELD_TRANSFORMS } from './contracts';
import { ManifestValidationError } from '../domain/errors';

export function validateProviderManifest(manifest: unknown): ProviderManifest {
  const issues: string[] = [];
  if (!manifest || typeof manifest !== 'object') {
    throw new ManifestValidationError(['Manifest deve ser um objeto válido.']);
  }

  const m = manifest as Partial<ProviderManifest>;

  if (!m.id || typeof m.id !== 'string' || !/^[a-z0-9-]+$/.test(m.id)) {
    issues.push('id deve ser uma string não vazia em formato kebab-case.');
  }
  if (!m.name || typeof m.name !== 'string') {
    issues.push('name é obrigatório.');
  }
  if (!m.version || typeof m.version !== 'string' || !/^\d+\.\d+\.\d+/.test(m.version)) {
    issues.push('version deve seguir o padrão semver (ex: 1.0.0).');
  }
  if (!m.providerKey || typeof m.providerKey !== 'string') {
    issues.push('providerKey é obrigatória.');
  }
  if (!m.category || typeof m.category !== 'string') {
    issues.push('category é obrigatória.');
  }

  if (!m.capabilities || typeof m.capabilities !== 'object') {
    issues.push('capabilities é obrigatório.');
  } else {
    if (!Array.isArray(m.capabilities.syncModes) || m.capabilities.syncModes.length === 0) {
      issues.push('capabilities.syncModes deve conter ao menos um modo de sincronização.');
    }
  }

  if (!m.authentication || typeof m.authentication !== 'object') {
    issues.push('authentication é obrigatório.');
  } else {
    if (!m.authentication.type) {
      issues.push('authentication.type é obrigatório.');
    }
  }

  if (!m.permissions || typeof m.permissions !== 'object') {
    issues.push('permissions é obrigatório.');
  } else {
    if (!Array.isArray(m.permissions.remoteScopes)) {
      issues.push('permissions.remoteScopes deve ser uma lista.');
    }
    if (!Array.isArray(m.permissions.localPermissions)) {
      issues.push('permissions.localPermissions deve ser uma lista.');
    }
  }

  if (!Array.isArray(m.entities)) {
    issues.push('entities deve ser uma lista.');
  } else {
    for (const ent of m.entities) {
      if (!ent.name || typeof ent.name !== 'string') {
        issues.push('Toda entidade deve conter um "name".');
      }
      if (!Array.isArray(ent.fields) || ent.fields.length === 0) {
        issues.push(`Entidade "${ent.name || 'desconhecida'}" deve declarar campos.`);
      }
      if (!Array.isArray(ent.operations) || ent.operations.length === 0) {
        issues.push(`Entidade "${ent.name || 'desconhecida'}" deve declarar ao menos uma operação.`);
      }
    }
  }

  if (!m.limits || typeof m.limits !== 'object') {
    issues.push('limits é obrigatório.');
  }

  if (!m.homologationStatus) {
    issues.push('homologationStatus é obrigatório.');
  }

  if (issues.length > 0) {
    throw new ManifestValidationError(issues);
  }

  return m as ProviderManifest;
}
