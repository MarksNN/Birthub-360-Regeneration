import { createHash } from 'crypto';

/** Serialização canônica (chaves ordenadas) para hashing determinístico de documentos. */
export function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  // Prisma.Decimal (decimal.js) — serializa pelo valor textual, nunca pela estrutura interna
  if (typeof value === 'object' && (value as { constructor?: { name?: string } }).constructor?.name === 'Decimal') {
    return JSON.stringify(String(value));
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort((a, b) => a.localeCompare(b, 'en'));
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
  }
  if (typeof value === 'object' && value !== null && 'toString' in (value as object)) {
    return JSON.stringify(String(value));
  }
  return JSON.stringify(value);
}

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function hashDocument(value: unknown): string {
  return sha256(canonicalJson(value));
}
