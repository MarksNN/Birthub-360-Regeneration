-- CreateTable
CREATE TABLE "supervisor_missions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_missions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supervisor_missions_organizationId_idx" ON "supervisor_missions"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_missions_organizationId_correlationId_key" ON "supervisor_missions"("organizationId", "correlationId");

-- AddForeignKey
ALTER TABLE "supervisor_missions" ADD CONSTRAINT "supervisor_missions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_missions" ADD CONSTRAINT "supervisor_missions_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
