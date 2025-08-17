/*
  Warnings:

  - You are about to drop the `queue_jobs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `geocoding_cache` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `telegram_posts` table without a default value. This is not possible if the table is not empty.
  - Made the column `channel_username` on table `telegram_posts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "telegram_posts_channel_id_message_id_key";

-- AlterTable
ALTER TABLE "geocoding_cache" ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "telegram_posts" ADD COLUMN     "forwards" INTEGER,
ADD COLUMN     "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "post_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "views" INTEGER,
ALTER COLUMN "channel_username" SET NOT NULL;

-- DropTable
DROP TABLE "queue_jobs";

-- DropEnum
DROP TYPE "QueueJobStatus";

-- CreateTable
CREATE TABLE "parse_jobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "data" JSONB,
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "processed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parse_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis_cache" (
    "id" TEXT NOT NULL,
    "text_hash" TEXT NOT NULL,
    "is_rental" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extracted_data" JSONB NOT NULL,
    "language" TEXT NOT NULL,
    "reasoning" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analysis_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parse_jobs_status_idx" ON "parse_jobs"("status");

-- CreateIndex
CREATE INDEX "parse_jobs_type_idx" ON "parse_jobs"("type");

-- CreateIndex
CREATE INDEX "parse_jobs_created_at_idx" ON "parse_jobs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analysis_cache_text_hash_key" ON "ai_analysis_cache"("text_hash");

-- CreateIndex
CREATE INDEX "ai_analysis_cache_text_hash_idx" ON "ai_analysis_cache"("text_hash");

-- CreateIndex
CREATE INDEX "ai_analysis_cache_expires_at_idx" ON "ai_analysis_cache"("expires_at");

-- CreateIndex
CREATE INDEX "ai_analysis_cache_provider_idx" ON "ai_analysis_cache"("provider");

-- CreateIndex
CREATE INDEX "telegram_posts_post_date_idx" ON "telegram_posts"("post_date");
