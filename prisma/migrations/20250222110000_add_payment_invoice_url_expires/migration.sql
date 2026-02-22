-- AlterTable
ALTER TABLE "payments" ADD COLUMN "invoiceUrl" TEXT,
ADD COLUMN "expiresAt" TIMESTAMP(3);
