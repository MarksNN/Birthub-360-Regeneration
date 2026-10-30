import { UserRole, AgentScope, AgentOperationalStatus } from '@prisma/client';

export interface AgentMetadata {
  code: string;
  name: string;
  characterRole?: string | null;
  domain: string;
  subgroup: string;
  origin: string;
  sourceVersion: string;
  scope: AgentScope;
  description: string;
  mission?: string | null;
  universalCapabilities: string[];
  specializedCapabilities: string[];
  capabilities: string[];
  allowedTools: string[];
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  permissionsSummary?: Record<string, any>;
  promptRef?: string | null;
  operationalStatus: AgentOperationalStatus;
  requiredRole: UserRole;
  isActive: boolean;
  isExecutable: boolean;
}

export interface SupervisorRequest {
  targetModule:
    | 'CRM'
    | 'HUB'
    | 'INTELLIGENCE'
    | 'SALES_ORCHESTRATION'
    | 'REAL_TIME_PERFORMANCE'
    | 'REVENUE_FORECAST'
    | 'COPILOT'
    | 'AUTOMATIONS'
    | 'CADENCE';
  prompt: string;
  agentCode?: string;
  contextData?: Record<string, any>;
}

export interface SupervisorPlan {
  suggestedAgentCode: string;
  suggestedAgentName: string;
  characterRole?: string | null;
  domain: string;
  subgroup: string;
  operationalStatus: 'REGISTERED' | 'AVAILABLE' | 'EXECUTABLE' | 'DISABLED';
  reasoning: string;
  requiredTools: string[];
  universalCapabilities: string[];
  specializedCapabilities: string[];
  isExecutable: boolean;
  authorizationCheck: {
    userRole: string;
    requiredRole: string;
    hasPermission: boolean;
  };
  simulatedOutput?: string;
}
