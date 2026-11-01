import { ConnectorContext, AuthenticationAdapter, ConnectorHealthCheck } from './contracts';

export class BaseMockAuthAdapter implements AuthenticationAdapter {
  readonly type = 'NONE' as const;

  async validateConfiguration(ctx: ConnectorContext) {
    return { valid: true, issues: [] };
  }

  async authorize(ctx: ConnectorContext) {
    return {};
  }
}

export class BaseMockHealthCheck implements ConnectorHealthCheck {
  constructor(private mockName: string) {}

  async check(ctx: ConnectorContext) {
    return { healthy: true, details: `${this.mockName} mock health` };
  }
}
