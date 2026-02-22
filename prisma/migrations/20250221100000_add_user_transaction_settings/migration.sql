-- Add transaction display settings to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "transactionTimeRange" TEXT NOT NULL DEFAULT 'weekly';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstDayOfWeek" INTEGER NOT NULL DEFAULT 0;
