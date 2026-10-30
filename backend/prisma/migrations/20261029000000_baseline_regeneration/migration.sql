-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CLOSER', 'SDR', 'BDR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ATIVO', 'INATIVO', 'EM_ANALISE');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('LEAD_RECEBIDO', 'CADENCIA_INICIADA', 'QUALIFICACAO_SDR', 'REUNIAO_AGENDADA', 'LEAD_DESQUALIFICADO', 'CONVERTIDO_EM_OPORTUNIDADE');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('PROSPECT', 'QUALIFICACAO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'FECHADO_GANHO', 'FECHADO_PERDIDO');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TAREFA', 'LIGACAO', 'REUNIAO', 'FOLLOW_UP', 'EMAIL');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "AgentScope" AS ENUM ('UNIVERSAL', 'SPECIALIZED');

-- CreateEnum
CREATE TYPE "AgentOperationalStatus" AS ENUM ('REGISTERED', 'AVAILABLE', 'EXECUTABLE', 'DISABLED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'ENTERPRISE_360',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SDR',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ATIVO',
    "annualRevenue" DOUBLE PRECISION,
    "employeeCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "roleTitle" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT,
    "assignedToId" TEXT,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'LEAD_RECEBIDO',
    "score" INTEGER NOT NULL DEFAULT 50,
    "estimatedValue" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyId" TEXT,
    "leadId" TEXT,
    "assignedToId" TEXT,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stage" "DealStage" NOT NULL DEFAULT 'PROSPECT',
    "expectedClose" TIMESTAMP(3),
    "probability" INTEGER NOT NULL DEFAULT 20,
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_stage_histories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fromStage" "DealStage" NOT NULL,
    "toStage" "DealStage" NOT NULL,
    "movedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_stage_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "companyId" TEXT,
    "contactId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "type" "ActivityType" NOT NULL DEFAULT 'TAREFA',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDENTE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_registrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "agentCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "characterRole" TEXT,
    "domain" TEXT NOT NULL,
    "subgroup" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'CATÁLOGO_NORMALIZADO',
    "sourceVersion" TEXT NOT NULL DEFAULT '79e150471d920b2737e6df6707c6afe5b10ed55d',
    "scope" "AgentScope" NOT NULL DEFAULT 'SPECIALIZED',
    "description" TEXT NOT NULL,
    "mission" TEXT,
    "universalCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specializedCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capabilities" TEXT[],
    "allowedTools" TEXT[],
    "inputs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outputs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissionsSummary" JSONB,
    "promptRef" TEXT,
    "operationalStatus" "AgentOperationalStatus" NOT NULL DEFAULT 'REGISTERED',
    "requiredRole" "UserRole" NOT NULL DEFAULT 'SDR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isExecutable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_executions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "targetModule" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "routedAgentCode" TEXT,
    "selectedTools" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "resultSummary" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervisor_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "companies_organizationId_idx" ON "companies"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_organizationId_cnpj_key" ON "companies"("organizationId", "cnpj");

-- CreateIndex
CREATE INDEX "contacts_organizationId_idx" ON "contacts"("organizationId");

-- CreateIndex
CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");

-- CreateIndex
CREATE INDEX "deals_organizationId_idx" ON "deals"("organizationId");

-- CreateIndex
CREATE INDEX "deal_stage_histories_organizationId_dealId_idx" ON "deal_stage_histories"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "activities_organizationId_idx" ON "activities"("organizationId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_registrations_agentCode_key" ON "agent_registrations"("agentCode");

-- CreateIndex
CREATE INDEX "agent_registrations_domain_operationalStatus_idx" ON "agent_registrations"("domain", "operationalStatus");

-- CreateIndex
CREATE INDEX "supervisor_executions_organizationId_idx" ON "supervisor_executions"("organizationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_histories" ADD CONSTRAINT "deal_stage_histories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_histories" ADD CONSTRAINT "deal_stage_histories_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_stage_histories" ADD CONSTRAINT "deal_stage_histories_movedById_fkey" FOREIGN KEY ("movedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_registrations" ADD CONSTRAINT "agent_registrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_executions" ADD CONSTRAINT "supervisor_executions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_executions" ADD CONSTRAINT "supervisor_executions_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
