-- CreateTable
CREATE TABLE "ai_api_usage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "request_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_api_usage_provider_idx" ON "ai_api_usage"("provider");

-- CreateIndex
CREATE INDEX "ai_api_usage_model_idx" ON "ai_api_usage"("model");

-- CreateIndex
CREATE INDEX "ai_api_usage_created_at_idx" ON "ai_api_usage"("created_at");

-- CreateIndex
CREATE INDEX "ai_api_usage_request_id_idx" ON "ai_api_usage"("request_id");