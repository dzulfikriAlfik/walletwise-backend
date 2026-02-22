-- CreateTable for caching FX rates from external API
CREATE TABLE IF NOT EXISTS "fx_rates" (
    "id" TEXT NOT NULL,
    "baseCode" TEXT NOT NULL DEFAULT 'USD',
    "rates" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- Insert default row with fallback rates
INSERT INTO "fx_rates" ("id", "baseCode", "rates", "updatedAt")
VALUES (
  'default',
  'USD',
  '{"USD": 1, "IDR": 16862, "EUR": 0.92}'::jsonb,
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
