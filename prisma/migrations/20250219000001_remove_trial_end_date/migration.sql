-- Remove trialEndDate column; use endDate for all subscription expiry (including pro_trial)
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "trialEndDate";
