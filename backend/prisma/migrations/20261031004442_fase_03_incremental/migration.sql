-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_ADMIN', 'PLATFORM_COMMERCIAL', 'PLATFORM_ENGINEERING');

-- CreateEnum
CREATE TYPE "IntegrationProjectStatus" AS ENUM ('REQUESTED', 'DISCOVERY', 'FEASIBILITY_REVIEW', 'SCOPE_DRAFT', 'PRICING_REVIEW', 'PROPOSAL_READY', 'PROPOSAL_SENT', 'AWAITING_CUSTOMER_APPROVAL', 'APPROVED_BY_CUSTOMER', 'REJECTED_BY_CUSTOMER', 'EXPIRED', 'INTERNAL_AUTHORIZATION', 'AUTHORIZED_FOR_DEVELOPMENT', 'IN_DEVELOPMENT', 'IN_TESTING', 'AWAITING_ACCEPTANCE', 'ACCEPTED', 'AVAILABLE', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConnectorCatalogStatus" AS ENUM ('PLANNED', 'UNDER_DISCOVERY', 'AVAILABLE_FOR_PROPOSAL', 'UNDER_DEVELOPMENT', 'IN_TESTING', 'HOMOLOGATED', 'AVAILABLE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "ConnectorVisibility" AS ENUM ('SHARED', 'PRIVATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "IntegrationSquad" AS ENUM ('CRM_INTEGRATION', 'DATA_INTELLIGENCE', 'COMMUNICATION', 'AI_PROVIDER', 'PRODUCTIVITY', 'FINANCIAL_INTEGRATION', 'CUSTOM_ENTERPRISE');

-- CreateEnum
CREATE TYPE "ProposalKind" AS ENUM ('MAIN', 'PAID_DISCOVERY', 'CHANGE_ORDER');

-- CreateEnum
CREATE TYPE "ProposalVersionStatus" AS ENUM ('ESTIMATE_PENDING_APPROVAL', 'COMMERCIALLY_APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProjectOrderStatus" AS ENUM ('PENDING_INTERNAL_AUTHORIZATION', 'EXECUTABLE', 'INVALIDATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DevelopmentTaskStatus" AS ENUM ('PENDING', 'QUEUED', 'IN_PROGRESS', 'AWAITING_ENGINEERING', 'DONE', 'BLOCKED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'TECHNICALLY_APPROVED', 'TECHNICALLY_REJECTED', 'CUSTOMER_ACCEPTED', 'RELEASED');

-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('REGISTERED', 'ESTIMATED', 'PROPOSAL_ISSUED', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING_CONFIGURATION', 'ACTIVE', 'PAUSED', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "SyncRunKind" AS ENUM ('INBOUND', 'OUTBOUND', 'RECONCILIATION', 'ENRICHMENT', 'QUERY');

-- CreateEnum
CREATE TYPE "EventProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'RETRY_SCHEDULED', 'QUARANTINED', 'DUPLICATE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canApproveIntegrationProposals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "platformRole" "PlatformRole";

-- CreateTable
CREATE TABLE "integration_providers" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "squad" "IntegrationSquad" NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "documentationUrl" TEXT,
    "hasOfficialApi" BOOLEAN,
    "authMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportsWebhooks" BOOLEAN,
    "rateLimitNotes" TEXT,
    "readCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "writeCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "licensingNotes" TEXT,
    "catalogStatus" "ConnectorCatalogStatus" NOT NULL DEFAULT 'PLANNED',
    "factsSource" TEXT,
    "factsVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_connectors" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visibility" "ConnectorVisibility" NOT NULL DEFAULT 'SHARED',
    "ownerOrganizationId" TEXT,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "catalogStatus" "ConnectorCatalogStatus" NOT NULL DEFAULT 'PLANNED',
    "manifest" JSONB NOT NULL,
    "manifestHash" TEXT NOT NULL,
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "originProjectId" TEXT,
    "technicalApprovedById" TEXT,
    "technicalApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_connections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING_CONFIGURATION',
    "direction" "SyncDirection" NOT NULL DEFAULT 'INBOUND',
    "conflictStrategy" TEXT NOT NULL DEFAULT 'MANUAL',
    "config" JSONB NOT NULL DEFAULT '{}',
    "credentialRef" TEXT,
    "webhookSecretHash" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "activatedById" TEXT,
    "activatedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'FORM',
    "requestedProviderName" TEXT,
    "rawRequest" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "providerId" TEXT,
    "squad" "IntegrationSquad",
    "status" "IntegrationProjectStatus" NOT NULL DEFAULT 'REQUESTED',
    "onHoldFromStatus" "IntegrationProjectStatus",
    "priority" INTEGER NOT NULL DEFAULT 3,
    "contractedVersionId" TEXT,
    "connectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_project_status_history" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromStatus" "IntegrationProjectStatus",
    "toStatus" "IntegrationProjectStatus" NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "channel" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_project_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_discoveries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "toolName" TEXT,
    "objective" TEXT,
    "processes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dataEntities" JSONB NOT NULL DEFAULT '[]',
    "direction" "SyncDirection",
    "frequency" TEXT,
    "estimatedVolume" TEXT,
    "technicalRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authenticationNeeds" TEXT,
    "thirdPartyDependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "operationalConstraints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questions" JSONB NOT NULL DEFAULT '[]',
    "completeness" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_discoveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_feasibility_assessments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "hasOfficialApi" BOOLEAN,
    "documentationUrl" TEXT,
    "authMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateLimitNotes" TEXT,
    "supportsWebhooks" BOOLEAN,
    "readCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "writeCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "licensingDependencies" TEXT,
    "risks" JSONB NOT NULL DEFAULT '[]',
    "uncertainties" JSONB NOT NULL DEFAULT '[]',
    "reusableConnectorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiresPaidDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "assessedBy" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_feasibility_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_scopes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_estimates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "kind" "ProposalKind" NOT NULL DEFAULT 'MAIN',
    "status" TEXT NOT NULL DEFAULT 'ESTIMATE_PENDING_APPROVAL',
    "currency" TEXT NOT NULL,
    "effort" JSONB NOT NULL,
    "internalBreakdown" JSONB NOT NULL,
    "clientBreakdown" JSONB NOT NULL,
    "oneTimeTotal" DECIMAL(14,2) NOT NULL,
    "monthlyTotal" DECIMAL(14,2) NOT NULL,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pricingSnapshot" JSONB NOT NULL,
    "createdByType" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_pricing_parameters" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "value" DECIMAL(14,4),
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_pricing_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_pricing_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "defaultMarginPct" DECIMAL(5,2),
    "maxDiscountPct" DECIMAL(5,2),
    "supervisorMaxDiscountPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRatePct" DECIMAL(5,2),
    "proposalValidityDays" INTEGER,
    "paymentTerms" TEXT,
    "warrantyTerms" TEXT,
    "changeScopeTerms" TEXT,
    "requirePaymentConfirmationToStart" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_pricing_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_plan_entitlements" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_plan_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_proposals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "ProposalKind" NOT NULL DEFAULT 'MAIN',
    "proposalNumber" TEXT NOT NULL,
    "currentVersionId" TEXT,
    "changeRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_proposal_versions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ProposalVersionStatus" NOT NULL DEFAULT 'ESTIMATE_PENDING_APPROVAL',
    "scopeId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "oneTimeTotal" DECIMAL(14,2) NOT NULL,
    "monthlyTotal" DECIMAL(14,2) NOT NULL,
    "content" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "changeReason" TEXT,
    "commerciallyApprovedById" TEXT,
    "commerciallyApprovedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentById" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_proposal_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_approvals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposalVersionId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "userId" TEXT NOT NULL,
    "userRoleSnapshot" TEXT NOT NULL,
    "hadContractingAuthority" BOOLEAN NOT NULL,
    "approvedAmounts" JSONB NOT NULL,
    "approvedScopeHash" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "conditionsAccepted" JSONB NOT NULL,
    "effectsAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "legalStatus" TEXT NOT NULL DEFAULT 'AUDITABLE_ACCEPTANCE_PENDING_LEGAL_VALIDATION',
    "invalidatedAt" TIMESTAMP(3),
    "invalidationReason" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_project_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "proposalVersionId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "ProjectOrderStatus" NOT NULL DEFAULT 'PENDING_INTERNAL_AUTHORIZATION',
    "paymentAuthorizationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "authorizationChecklist" JSONB,
    "authorizedById" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "invalidationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_project_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_artifacts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposalVersionId" TEXT,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_project_milestones" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_development_tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "changeRequestId" TEXT,
    "step" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "squad" "IntegrationSquad",
    "responsibleRole" TEXT NOT NULL,
    "responsibleAgent" TEXT,
    "executor" TEXT NOT NULL,
    "status" "DevelopmentTaskStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "evidence" JSONB,
    "lastError" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_development_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_releases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "connectorId" TEXT,
    "version" TEXT NOT NULL,
    "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "testEvidence" JSONB NOT NULL DEFAULT '[]',
    "submittedById" TEXT,
    "technicalReviewerId" TEXT,
    "technicalReviewedAt" TIMESTAMP(3),
    "technicalNotes" TEXT,
    "customerAcceptedById" TEXT,
    "customerAcceptedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_change_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedById" TEXT,
    "contractedScopeHash" TEXT NOT NULL,
    "impactSummary" JSONB,
    "deltaHours" DECIMAL(10,2),
    "deltaOneTime" DECIMAL(14,2),
    "deltaMonthly" DECIMAL(14,2),
    "deltaDays" INTEGER,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'REGISTERED',
    "proposalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_field_mappings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "localField" TEXT NOT NULL,
    "remoteField" TEXT NOT NULL,
    "direction" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "transform" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_entity_links" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "remoteHash" TEXT,
    "localHash" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_entity_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_sync_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "kind" "SyncRunKind" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "stats" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "integration_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_conflicts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "localId" TEXT,
    "localSnapshot" JSONB,
    "remoteSnapshot" JSONB,
    "strategy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_inbox_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalEventId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "status" "EventProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_inbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_outbox_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT,
    "projectId" TEXT,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "EventProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatchedAt" TIMESTAMP(3),

    CONSTRAINT "integration_outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_providers_key_key" ON "integration_providers"("key");

-- CreateIndex
CREATE INDEX "integration_providers_squad_catalogStatus_idx" ON "integration_providers"("squad", "catalogStatus");

-- CreateIndex
CREATE INDEX "integration_connectors_ownerOrganizationId_idx" ON "integration_connectors"("ownerOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_connectors_key_version_key" ON "integration_connectors"("key", "version");

-- CreateIndex
CREATE INDEX "integration_connections_organizationId_idx" ON "integration_connections"("organizationId");

-- CreateIndex
CREATE INDEX "integration_requests_organizationId_idx" ON "integration_requests"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_projects_requestId_key" ON "integration_projects"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_projects_code_key" ON "integration_projects"("code");

-- CreateIndex
CREATE INDEX "integration_projects_organizationId_status_idx" ON "integration_projects"("organizationId", "status");

-- CreateIndex
CREATE INDEX "integration_project_status_history_organizationId_projectId_idx" ON "integration_project_status_history"("organizationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_discoveries_projectId_key" ON "integration_discoveries"("projectId");

-- CreateIndex
CREATE INDEX "integration_discoveries_organizationId_idx" ON "integration_discoveries"("organizationId");

-- CreateIndex
CREATE INDEX "integration_feasibility_assessments_organizationId_idx" ON "integration_feasibility_assessments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_feasibility_assessments_projectId_version_key" ON "integration_feasibility_assessments"("projectId", "version");

-- CreateIndex
CREATE INDEX "integration_scopes_organizationId_idx" ON "integration_scopes"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_scopes_projectId_version_key" ON "integration_scopes"("projectId", "version");

-- CreateIndex
CREATE INDEX "integration_estimates_organizationId_projectId_idx" ON "integration_estimates"("organizationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_pricing_parameters_key_key" ON "integration_pricing_parameters"("key");

-- CreateIndex
CREATE UNIQUE INDEX "integration_plan_entitlements_plan_component_key" ON "integration_plan_entitlements"("plan", "component");

-- CreateIndex
CREATE UNIQUE INDEX "integration_proposals_proposalNumber_key" ON "integration_proposals"("proposalNumber");

-- CreateIndex
CREATE INDEX "integration_proposals_organizationId_projectId_idx" ON "integration_proposals"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "integration_proposal_versions_organizationId_idx" ON "integration_proposal_versions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_proposal_versions_proposalId_version_key" ON "integration_proposal_versions"("proposalId", "version");

-- CreateIndex
CREATE INDEX "integration_approvals_organizationId_projectId_idx" ON "integration_approvals"("organizationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_project_orders_approvalId_key" ON "integration_project_orders"("approvalId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_project_orders_orderNumber_key" ON "integration_project_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "integration_project_orders_organizationId_projectId_idx" ON "integration_project_orders"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "integration_artifacts_organizationId_projectId_idx" ON "integration_artifacts"("organizationId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_project_milestones_projectId_code_key" ON "integration_project_milestones"("projectId", "code");

-- CreateIndex
CREATE INDEX "integration_development_tasks_organizationId_projectId_idx" ON "integration_development_tasks"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "integration_releases_organizationId_projectId_idx" ON "integration_releases"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "integration_change_requests_organizationId_projectId_idx" ON "integration_change_requests"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "integration_field_mappings_organizationId_idx" ON "integration_field_mappings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_field_mappings_connectionId_entity_localField_key" ON "integration_field_mappings"("connectionId", "entity", "localField");

-- CreateIndex
CREATE INDEX "integration_entity_links_organizationId_entity_localId_idx" ON "integration_entity_links"("organizationId", "entity", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_entity_links_connectionId_entity_externalId_key" ON "integration_entity_links"("connectionId", "entity", "externalId");

-- CreateIndex
CREATE INDEX "integration_sync_runs_organizationId_connectionId_idx" ON "integration_sync_runs"("organizationId", "connectionId");

-- CreateIndex
CREATE INDEX "integration_conflicts_organizationId_status_idx" ON "integration_conflicts"("organizationId", "status");

-- CreateIndex
CREATE INDEX "webhook_inbox_events_organizationId_status_idx" ON "webhook_inbox_events"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_inbox_events_connectionId_idempotencyKey_key" ON "webhook_inbox_events"("connectionId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "integration_outbox_events_idempotencyKey_key" ON "integration_outbox_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "integration_outbox_events_status_nextAttemptAt_idx" ON "integration_outbox_events"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "integration_outbox_events_organizationId_idx" ON "integration_outbox_events"("organizationId");

-- AddForeignKey
ALTER TABLE "integration_connectors" ADD CONSTRAINT "integration_connectors_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "integration_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_connectors" ADD CONSTRAINT "integration_connectors_ownerOrganizationId_fkey" FOREIGN KEY ("ownerOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "integration_connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_requests" ADD CONSTRAINT "integration_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_projects" ADD CONSTRAINT "integration_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_projects" ADD CONSTRAINT "integration_projects_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "integration_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_projects" ADD CONSTRAINT "integration_projects_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "integration_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_project_status_history" ADD CONSTRAINT "integration_project_status_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_discoveries" ADD CONSTRAINT "integration_discoveries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_feasibility_assessments" ADD CONSTRAINT "integration_feasibility_assessments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_scopes" ADD CONSTRAINT "integration_scopes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_estimates" ADD CONSTRAINT "integration_estimates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_estimates" ADD CONSTRAINT "integration_estimates_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "integration_scopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_proposals" ADD CONSTRAINT "integration_proposals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_proposals" ADD CONSTRAINT "integration_proposals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_proposal_versions" ADD CONSTRAINT "integration_proposal_versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "integration_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_approvals" ADD CONSTRAINT "integration_approvals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_approvals" ADD CONSTRAINT "integration_approvals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_approvals" ADD CONSTRAINT "integration_approvals_proposalVersionId_fkey" FOREIGN KEY ("proposalVersionId") REFERENCES "integration_proposal_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_project_orders" ADD CONSTRAINT "integration_project_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_project_orders" ADD CONSTRAINT "integration_project_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_project_orders" ADD CONSTRAINT "integration_project_orders_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "integration_approvals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_artifacts" ADD CONSTRAINT "integration_artifacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_project_milestones" ADD CONSTRAINT "integration_project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_development_tasks" ADD CONSTRAINT "integration_development_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_development_tasks" ADD CONSTRAINT "integration_development_tasks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "integration_project_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_releases" ADD CONSTRAINT "integration_releases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_releases" ADD CONSTRAINT "integration_releases_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "integration_connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_change_requests" ADD CONSTRAINT "integration_change_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "integration_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_field_mappings" ADD CONSTRAINT "integration_field_mappings_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_entity_links" ADD CONSTRAINT "integration_entity_links_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_sync_runs" ADD CONSTRAINT "integration_sync_runs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_conflicts" ADD CONSTRAINT "integration_conflicts_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_inbox_events" ADD CONSTRAINT "webhook_inbox_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_inbox_events" ADD CONSTRAINT "webhook_inbox_events_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_outbox_events" ADD CONSTRAINT "integration_outbox_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_outbox_events" ADD CONSTRAINT "integration_outbox_events_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "integration_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
