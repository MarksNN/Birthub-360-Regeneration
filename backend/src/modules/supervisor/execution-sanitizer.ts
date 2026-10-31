/**
 * Supervisor Execution Sanitizer
 *
 * Sanitiza dados pessoais sensíveis em SupervisorExecution.userPrompt antes de salvar.
 * Remove ou mascara: tokens, credenciais, dados sensíveis, PII explícito.
 */

/**
 * Padrões de regex para identificação de dados sensíveis em prompts
 */
const PATTERNS = {
  // Tokens JWT (Bearer, API keys)
  jwt: /Bearer\s+[A-Za-z0-9\-._~+/=]+/gi,
  apiKey: /api[_-]?key\s*[:=]\s*\S+/gi,
  secret: /secret\s*[:=]\s*\S+/gi,
  token: /token\s*[:=]\s*\S+/gi,

  // Credenciais
  password: /password\s*[:=]\s*\S+/gi,
  pass: /pass\s*[:=]\s*\S+/gi,
  pwd: /pwd\s*[:=]\s*\S+/gi,

  // Dados pessoais explícitos
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  cnpj: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
  telefone: /\b\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g,

  // Cards de crédito (PCI DSS - nunca deve aparecer em prompt)
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // URLs com tokens
  urlWithToken: /https?:\/\/[^\s?]*\?[^&]*token=[^&\s]+/gi,
};

/**
 * Placeholder para mascaramento
 */
const PLACEHOLDERS = {
  jwt: '[JWT_TOKEN_REDACTED]',
  apiKey: '[API_KEY_REDACTED]',
  secret: '[SECRET_REDACTED]',
  token: '[TOKEN_REDACTED]',
  password: '[PASSWORD_REDACTED]',
  email: '[EMAIL_REDACTED]',
  cpf: '[CPF_REDACTED]',
  cnpj: '[CNPJ_REDACTED]',
  telefone: '[PHONE_REDACTED]',
  creditCard: '[CREDIT_CARD_REDACTED]',
  url: '[URL_WITH_TOKEN_REDACTED]',
};

/**
 * Mascara valor detectado
 */
function maskValue(text: string, pattern: RegExp, placeholder: string): string {
  return text.replace(pattern, placeholder);
}

/**
 * Sanitiza texto de prompt
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return prompt;
  }

  let sanitized = prompt;

  // Sanitiza tokens JWT
  sanitized = maskValue(sanitized, PATTERNS.jwt, PLACEHOLDERS.jwt);

  // Sanitiza API keys
  sanitized = maskValue(sanitized, PATTERNS.apiKey, PLACEHOLDERS.apiKey);

  // Sanitiza secrets
  sanitized = maskValue(sanitized, PATTERNS.secret, PLACEHOLDERS.secret);

  // Sanitiza tokens genéricos
  sanitized = maskValue(sanitized, PATTERNS.token, PLACEHOLDERS.token);

  // Sanitiza passwords
  sanitized = maskValue(sanitized, PATTERNS.password, PLACEHOLDERS.password);
  sanitized = maskValue(sanitized, PATTERNS.pass, PLACEHOLDERS.password);
  sanitized = maskValue(sanitized, PATTERNS.pwd, PLACEHOLDERS.password);

  // Sanitiza dados pessoais (opcional - depende da política de privacidade do cliente)
  // Nota: Alguns clientes podem precisar que o prompt contenha dados reais para funcionamento
  // Atualmente, vamos sanitizar apenas se explicitamente configurado
  // sanitized = maskValue(sanitized, PATTERNS.email, PLACEHOLDERS.email);
  // sanitized = maskValue(sanitized, PATTERNS.cpf, PLACEHOLDERS.cpf);
  // sanitized = maskValue(sanitized, PATTERNS.cnpj, PLACEHOLDERS.cnpj);
  // sanitized = maskValue(sanitized, PATTERNS.telefone, PLACEHOLDERS.telefone);

  // Sanitiza cards de crédito (nunca deve aparecer)
  sanitized = maskValue(sanitized, PATTERNS.creditCard, PLACEHOLDERS.creditCard);

  // Sanitiza URLs com tokens
  sanitized = maskValue(sanitized, PATTERNS.urlWithToken, PLACEHOLDERS.url);

  return sanitized;
}

/**
 * Sanitiza resultSummary (pode conter dados sensíveis da resposta da IA)
 */
export function sanitizeResultSummary(summary: string): string {
  if (!summary || typeof summary !== 'string') {
    return summary;
  }

  // Aplica mesma sanitização do prompt
  return sanitizePrompt(summary);
}

/**
 * Configuração de sanitização (pode ser personalizada por tenant)
 */
interface SanitizationConfig {
  sanitizeEmail: boolean;
  sanitizePhone: boolean;
  sanitizeCPF: boolean;
  sanitizeCNPJ: boolean;
}

const DEFAULT_CONFIG: SanitizationConfig = {
  sanitizeEmail: false, // Preserva email por padrão (pode ser necessário para o funcionamento)
  sanitizePhone: false,
  sanitizeCPF: false,
  sanitizeCNPJ: false,
};

/**
 * Sanitiza com configuração personalizada
 */
export function sanitizePromptWithConfig(
  prompt: string,
  config: Partial<SanitizationConfig> = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let sanitized = prompt;

  // Sanitiza credenciais e tokens (sempre)
  sanitized = maskValue(sanitized, PATTERNS.jwt, PLACEHOLDERS.jwt);
  sanitized = maskValue(sanitized, PATTERNS.apiKey, PLACEHOLDERS.apiKey);
  sanitized = maskValue(sanitized, PATTERNS.secret, PLACEHOLDERS.secret);
  sanitized = maskValue(sanitized, PATTERNS.token, PLACEHOLDERS.token);
  sanitized = maskValue(sanitized, PATTERNS.password, PLACEHOLDERS.password);
  sanitized = maskValue(sanitized, PATTERNS.creditCard, PLACEHOLDERS.creditCard);
  sanitized = maskValue(sanitized, PATTERNS.urlWithToken, PLACEHOLDERS.url);

  // Sanitiza dados pessoais conforme configuração
  if (finalConfig.sanitizeEmail) {
    sanitized = maskValue(sanitized, PATTERNS.email, PLACEHOLDERS.email);
  }
  if (finalConfig.sanitizePhone) {
    sanitized = maskValue(sanitized, PATTERNS.telefone, PLACEHOLDERS.telefone);
  }
  if (finalConfig.sanitizeCPF) {
    sanitized = maskValue(sanitized, PATTERNS.cpf, PLACEHOLDERS.cpf);
  }
  if (finalConfig.sanitizeCNPJ) {
    sanitized = maskValue(sanitized, PATTERNS.cnpj, PLACEHOLDERS.cnpj);
  }

  return sanitized;
}
