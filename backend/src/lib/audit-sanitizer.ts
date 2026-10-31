/**
 * Audit Log Sanitizer
 *
 * Sanitiza dados pessoais sensíveis em AuditLog.diff antes de salvar no banco.
 * Remove ou mascara: email, CPF/CNPJ, telefone, endereço, tokens, credenciais.
 */

interface AuditDiff {
  [key: string]: any;
}

/**
 * Padrões de regex para identificação de dados sensíveis
 */
const PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  cnpj: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
  telefone_br: /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g,
  telefone_intl: /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
  token: /[A-Za-z0-9_-]{32,}/g, // Tokens longos (JWT, API keys) - com underline e hífen
  credencial: /["']?password["']?\s*[:=]\s*\S+/gi,
  cep: /\b\d{5}-?\d{3}\b/g,
};

/**
 * Mascara valor detectado
 */
function maskValue(value: string, pattern: RegExp, placeholder: string): string {
  return value.replace(pattern, placeholder);
}

/**
 * Sanitiza um valor individual
 */
function sanitizeValue(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }

  let sanitized = value;

  // Sanitiza email
  if (PATTERNS.email.test(sanitized)) {
    sanitized = maskValue(sanitized, PATTERNS.email, '[EMAIL_REDACTED]');
  }

  // Sanitiza CPF
  if (PATTERNS.cpf.test(sanitized)) {
    sanitized = maskValue(sanitized, PATTERNS.cpf, '[CPF_REDACTED]');
  }

  // Sanitiza CNPJ
  if (PATTERNS.cnpj.test(sanitized)) {
    sanitized = maskValue(sanitized, PATTERNS.cnpj, '[CNPJ_REDACTED]');
  }

  // Sanitiza telefone (remove caracteres não numéricos primeiro)
  if (PATTERNS.telefone_br.test(sanitized) || PATTERNS.telefone_intl.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.telefone_br, '[PHONE_REDACTED]');
    sanitized = sanitized.replace(PATTERNS.telefone_intl, '[PHONE_REDACTED]');
  }

  // Sanitiza CEP
  if (PATTERNS.cep.test(sanitized)) {
    sanitized = maskValue(sanitized, PATTERNS.cep, '[CEP_REDACTED]');
  }

  // Sanitiza tokens longos (>= 32 caracteres)
  if (PATTERNS.token.test(sanitized)) {
    sanitized = maskValue(sanitized, PATTERNS.token, '[TOKEN_REDACTED]');
  }

  // Sanitiza credenciais em texto
  if (PATTERNS.credencial.test(sanitized)) {
    sanitized = sanitized.replace(PATTERNS.credencial, '[PASSWORD_REDACTED]');
  }

  return sanitized;
}

/**
 * Sanitiza recursivamente um objeto (diff)
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Não sanitiza chaves que indicam campos técnicos
        const isTechnicalField = /^(id|_id|uuid|createdAt|updatedAt|organizationId|status|stage)$/i.test(key);

        // Mascarar campos sensíveis por nome
        const isSensitiveField = /^(password|pass|pwd|secret|token|api[_-]?key|credential)$/i.test(key);

        if (isTechnicalField) {
          sanitized[key] = obj[key];
        } else if (isSensitiveField && typeof obj[key] === 'string') {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Função principal de sanitização de AuditLog.diff
 */
export function sanitizeAuditDiff(diff: AuditDiff): AuditDiff {
  if (!diff) {
    return diff;
  }

  try {
    // Se diff já é string, tenta parsear
    if (typeof diff === 'string') {
      try {
        const parsed = JSON.parse(diff);
        const sanitized = sanitizeObject(parsed);
        return sanitized;
      } catch {
        // Se não for JSON, sanitiza como string
        return sanitizeValue(diff);
      }
    }

    // Se diff é objeto, sanitiza diretamente
    return sanitizeObject(diff);
  } catch (error) {
    console.error('Erro ao sanitizar AuditLog.diff:', error);
    // Em caso de erro, retorna objeto sanitizado mínimo
    return { error: 'SANITIZATION_ERROR', originalType: typeof diff };
  }
}

/**
 * Versão simplificada para logs (não estruturados)
 */
export function sanitizeLogMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return message;
  }

  return sanitizeValue(message);
}
