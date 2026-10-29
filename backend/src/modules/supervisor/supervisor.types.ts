import { UserRole, AgentScope } from '@prisma/client';

export interface AgentMetadata {
  code: string;
  name: string;
  domain: string;
  subgroup: string;
  scope: AgentScope;
  description: string;
  capabilities: string[];
  allowedTools: string[];
  requiredRole: UserRole;
  isActive: boolean;
  isExecutable: boolean;
}

export interface SupervisorRequest {
  targetModule: 'CRM' | 'INTELLIGENCE' | 'SALES_ORCHESTRATION' | 'REAL_TIME_PERFORMANCE' | 'REVENUE_FORECAST' | 'COPILOT' | 'AUTOMATIONS' | 'CADENCE';
  prompt: string;
  contextData?: Record<string, any>;
}

export interface SupervisorPlan {
  suggestedAgentCode: string;
  suggestedAgentName: string;
  reasoning: string;
  requiredTools: string[];
  isExecutable: boolean;
  authorizationCheck: {
    userRole: string;
    requiredRole: string;
    hasPermission: boolean;
  };
  simulatedOutput?: string;
}
