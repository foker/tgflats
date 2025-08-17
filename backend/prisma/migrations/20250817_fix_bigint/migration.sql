-- AlterTable
ALTER TABLE "telegram_posts" ADD COLUMN IF NOT EXISTS "channel_username" TEXT;
ALTER TABLE "telegram_posts" ALTER COLUMN "message_id" TYPE BIGINT;

-- CreateUniqueIndex if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'telegram_posts_message_id_channel_username_key') THEN
        CREATE UNIQUE INDEX "telegram_posts_message_id_channel_username_key" ON "telegram_posts"("message_id", "channel_username");
    END IF;
END $$;

-- CreateIndex if not exists
CREATE INDEX IF NOT EXISTS "telegram_posts_channel_username_idx" ON "telegram_posts"("channel_username");