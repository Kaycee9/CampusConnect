-- AlterTable
ALTER TABLE "Payment"
ADD COLUMN "settlementAvailableAt" TIMESTAMP(3),
ADD COLUMN "settlementReleasedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GatewayWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "reference" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatewayWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GatewayWebhookEvent_dedupeKey_key" ON "GatewayWebhookEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "GatewayWebhookEvent_provider_eventType_reference_idx" ON "GatewayWebhookEvent"("provider", "eventType", "reference");

-- CreateIndex
CREATE INDEX "GatewayWebhookEvent_processedAt_idx" ON "GatewayWebhookEvent"("processedAt");
