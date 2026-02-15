-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMP(3);
