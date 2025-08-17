-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'RENTED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateTable
CREATE TABLE "telegram_channels" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "username" TEXT,
    "title" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_parsed" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_posts" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "channel_username" TEXT NOT NULL,
    "message_id" BIGINT NOT NULL,
    "text" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hidden_urls" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "post_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" TEXT,
    "views_count" INTEGER,
    "forwards" INTEGER,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "raw_data" JSONB,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "telegram_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "telegram_post_id" TEXT,
    "district" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "price_min" DOUBLE PRECISION,
    "price_max" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'GEL',
    "bedrooms" INTEGER,
    "area_sqm" DOUBLE PRECISION,
    "pets_allowed" BOOLEAN,
    "furnished" BOOLEAN,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "contact_info" TEXT,
    "source_url" TEXT,
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geocoding_cache" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "district" TEXT,
    "formatted_address" TEXT,
    "confidence" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geocoding_cache_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "telegram_channels_channel_id_key" ON "telegram_channels"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_channels_username_key" ON "telegram_channels"("username");

-- CreateIndex
CREATE INDEX "telegram_posts_processed_idx" ON "telegram_posts"("processed");

-- CreateIndex
CREATE INDEX "telegram_posts_created_at_idx" ON "telegram_posts"("created_at");

-- CreateIndex
CREATE INDEX "telegram_posts_channel_username_idx" ON "telegram_posts"("channel_username");

-- CreateIndex
CREATE INDEX "telegram_posts_post_date_idx" ON "telegram_posts"("post_date");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_posts_message_id_channel_username_key" ON "telegram_posts"("message_id", "channel_username");

-- CreateIndex
CREATE INDEX "listings_district_idx" ON "listings"("district");

-- CreateIndex
CREATE INDEX "listings_price_idx" ON "listings"("price");

-- CreateIndex
CREATE INDEX "listings_bedrooms_idx" ON "listings"("bedrooms");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at");

-- CreateIndex
CREATE INDEX "listings_latitude_longitude_idx" ON "listings"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "geocoding_cache_address_key" ON "geocoding_cache"("address");

-- CreateIndex
CREATE INDEX "parse_jobs_status_idx" ON "parse_jobs"("status");

-- CreateIndex
CREATE INDEX "parse_jobs_type_idx" ON "parse_jobs"("type");

-- CreateIndex
CREATE INDEX "parse_jobs_created_at_idx" ON "parse_jobs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "metrics_name_idx" ON "metrics"("name");

-- CreateIndex
CREATE INDEX "metrics_timestamp_idx" ON "metrics"("timestamp");

-- CreateIndex
CREATE INDEX "ai_api_usage_provider_idx" ON "ai_api_usage"("provider");

-- CreateIndex
CREATE INDEX "ai_api_usage_model_idx" ON "ai_api_usage"("model");

-- CreateIndex
CREATE INDEX "ai_api_usage_created_at_idx" ON "ai_api_usage"("created_at");

-- CreateIndex
CREATE INDEX "ai_api_usage_request_id_idx" ON "ai_api_usage"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analysis_cache_text_hash_key" ON "ai_analysis_cache"("text_hash");

-- CreateIndex
CREATE INDEX "ai_analysis_cache_text_hash_idx" ON "ai_analysis_cache"("text_hash");

-- CreateIndex
CREATE INDEX "ai_analysis_cache_expires_at_idx" ON "ai_analysis_cache"("expires_at");

-- CreateIndex
CREATE INDEX "ai_analysis_cache_provider_idx" ON "ai_analysis_cache"("provider");

-- AddForeignKey
ALTER TABLE "telegram_posts" ADD CONSTRAINT "telegram_posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "telegram_channels"("channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_telegram_post_id_fkey" FOREIGN KEY ("telegram_post_id") REFERENCES "telegram_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
