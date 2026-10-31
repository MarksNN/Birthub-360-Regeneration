/**
 * Testes do Supervisor Execution Sanitizer
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizePrompt,
  sanitizeResultSummary,
  sanitizePromptWithConfig,
} from '../src/modules/supervisor/execution-sanitizer';

describe('execution-sanitizer', () => {
  describe('sanitizePrompt', () => {
    it('deve mascarar JWT token', () => {
      const prompt = 'Use this token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

      const sanitized = sanitizePrompt(prompt);

      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('deve mascarar secret', () => {
      const prompt = 'Secret: my_secret_value_123';

      const sanitized = sanitizePrompt(prompt);

      expect(sanitized).not.toContain('my_secret_value_123');
    });

    it('deve mascarar password', () => {
      const prompt = 'Password: MyPassword123!';

      const sanitized = sanitizePrompt(prompt);

      expect(sanitized).not.toContain('MyPassword123!');
    });

    it('deve mascarar credit card', () => {
      const prompt = 'Card: 1234-5678-9012-3456';

      const sanitized = sanitizePrompt(prompt);

      expect(sanitized).not.toContain('1234-5678-9012-3456');
    });

    it('NÃO deve mascarar email por padrão', () => {
      const prompt = 'Contact user@example.com for support';

      const sanitized = sanitizePrompt(prompt);

      expect(sanitized).toContain('user@example.com');
    });

    it('NÃO deve mascarar telefone por padrão', () => {
      const prompt = 'Call (11) 98765-4321';

      const sanitized = sanitizePrompt(prompt);

      expect(sanitized).toContain('(11) 98765-4321');
    });

    it('deve retornar null se prompt for null', () => {
      const sanitized = sanitizePrompt(null);
      expect(sanitized).toBeNull();
    });

    it('deve retornar undefined se prompt for undefined', () => {
      const sanitized = sanitizePrompt(undefined);
      expect(sanitized).toBeUndefined();
    });
  });

  describe('sanitizeResultSummary', () => {
    it('deve mascarar token em result summary', () => {
      const summary = 'Response contains token: abc123def456';

      const sanitized = sanitizeResultSummary(summary);

      expect(sanitized).not.toContain('abc123def456');
    });

    it('deve mascarar password em result summary', () => {
      const summary = 'Password: NewPass123!';

      const sanitized = sanitizeResultSummary(summary);

      expect(sanitized).not.toContain('NewPass123!');
    });
  });

  describe('sanitizePromptWithConfig', () => {
    it('deve mascarar email quando configurado', () => {
      const prompt = 'Contact user@example.com for support';
      const config = { sanitizeEmail: true };

      const sanitized = sanitizePromptWithConfig(prompt, config);

      expect(sanitized).toContain('[EMAIL_REDACTED]');
    });

    it('deve mascarar telefone quando configurado', () => {
      const prompt = 'Call (11) 98765-4321';
      const config = { sanitizePhone: true };

      const sanitized = sanitizePromptWithConfig(prompt, config);

      expect(sanitized).toContain('[PHONE_REDACTED]');
    });

    it('deve mascarar CPF quando configurado', () => {
      const prompt = 'CPF: 123.456.789-00';
      const config = { sanitizeCPF: true };

      const sanitized = sanitizePromptWithConfig(prompt, config);

      expect(sanitized).toContain('[CPF_REDACTED]');
    });

    it('deve mascarar CNPJ quando configurado', () => {
      const prompt = 'CNPJ: 12.345.678/0001-90';
      const config = { sanitizeCNPJ: true };

      const sanitized = sanitizePromptWithConfig(prompt, config);

      expect(sanitized).toContain('[CNPJ_REDACTED]');
    });

    it('deve sempre mascarar credenciais independentemente da config', () => {
      const prompt = 'Password: Secret123! and email: user@example.com';
      const config = { sanitizeEmail: false };

      const sanitized = sanitizePromptWithConfig(prompt, config);

      expect(sanitized).toContain('[PASSWORD_REDACTED]');
      expect(sanitized).toContain('user@example.com'); // Email preservado
    });

    it('deve usar config padrão se não fornecida', () => {
      const prompt = 'Contact user@example.com for support';

      const sanitized = sanitizePromptWithConfig(prompt);

      expect(sanitized).toContain('user@example.com'); // Não mascarado por padrão
    });
  });
});
