/**
 * Testes do Audit Log Sanitizer
 */

import { describe, it, expect } from 'vitest';
import { sanitizeAuditDiff, sanitizeLogMessage } from '../src/lib/audit-sanitizer';

describe('audit-sanitizer', () => {
  describe('sanitizeAuditDiff', () => {
    it('deve mascarar email no diff', () => {
      const diff = {
        email: 'user@example.com',
        name: 'John Doe',
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.email).toBe('[EMAIL_REDACTED]');
      expect(sanitized.name).toBe('John Doe');
    });

    it('deve mascarar CPF no diff', () => {
      const diff = {
        cpf: '123.456.789-00',
        name: 'John Doe',
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.cpf).toBe('[CPF_REDACTED]');
      expect(sanitized.name).toBe('John Doe');
    });

    it('deve mascarar CNPJ no diff', () => {
      const diff = {
        cnpj: '12.345.678/0001-90',
        razaoSocial: 'Empresa XYZ',
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.cnpj).toBe('[CNPJ_REDACTED]');
      expect(sanitized.razaoSocial).toBe('Empresa XYZ');
    });

    it('deve mascarar telefone no diff', () => {
      const diff = {
        phone: '(11) 98765-4321',
        name: 'John Doe',
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.phone).toMatch(/\[PHONE_REDACTED\]/);
      expect(sanitized.name).toBe('John Doe');
    });

    it('deve mascarar token longo no diff', () => {
      const diff = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
        name: 'John Doe',
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.name).toBe('John Doe');
    });

    it('deve mascarar password no diff', () => {
      const diff = {
        password: 'Secret123!',
        name: 'John Doe',
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.name).toBe('John Doe');
    });

    it('deve preservar campos técnicos', () => {
      const diff = {
        id: '123',
        organizationId: '456',
        createdAt: '2024-01-01',
        email: 'user@example.com',
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.id).toBe('123');
      expect(sanitized.organizationId).toBe('456');
      expect(sanitized.createdAt).toBe('2024-01-01');
      expect(sanitized.email).toBe('[EMAIL_REDACTED]');
    });

    it('deve sanitizar array de objetos', () => {
      const diff = {
        contacts: [
          { email: 'user1@example.com', name: 'User 1' },
          { email: 'user2@example.com', name: 'User 2' },
        ],
      };

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.contacts[0].email).toBe('[EMAIL_REDACTED]');
      expect(sanitized.contacts[1].email).toBe('[EMAIL_REDACTED]');
      expect(sanitized.contacts[0].name).toBe('User 1');
    });

    it('deve sanitizar diff como string JSON', () => {
      const diff = JSON.stringify({ email: 'user@example.com', name: 'John Doe' });

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized.email).toBe('[EMAIL_REDACTED]');
      expect(sanitized.name).toBe('John Doe');
    });

    it('deve sanitizar diff como string simples', () => {
      const diff = 'Email: user@example.com, Name: John Doe';

      const sanitized = sanitizeAuditDiff(diff);

      expect(sanitized).toContain('[EMAIL_REDACTED]');
    });

    it('deve retornar null se diff for null', () => {
      const sanitized = sanitizeAuditDiff(null);
      expect(sanitized).toBeNull();
    });

    it('deve retornar undefined se diff for undefined', () => {
      const sanitized = sanitizeAuditDiff(undefined);
      expect(sanitized).toBeUndefined();
    });
  });

  describe('sanitizeLogMessage', () => {
    it('deve mascarar email em log message', () => {
      const message = 'User user@example.com logged in';

      const sanitized = sanitizeLogMessage(message);

      expect(sanitized).toContain('[EMAIL_REDACTED]');
    });

    it('deve mascarar CPF em log message', () => {
      const message = 'CPF 123.456.789-00 validated';

      const sanitized = sanitizeLogMessage(message);

      expect(sanitized).toContain('[CPF_REDACTED]');
    });

    it('deve retornar null se message for null', () => {
      const sanitized = sanitizeLogMessage(null);
      expect(sanitized).toBeNull();
    });
  });
});
