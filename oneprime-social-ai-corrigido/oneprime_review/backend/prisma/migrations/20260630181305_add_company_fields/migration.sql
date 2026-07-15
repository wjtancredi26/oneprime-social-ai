-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "brands" TEXT,
ADD COLUMN     "colors" TEXT,
ADD COLUMN     "ctas" TEXT,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "products" TEXT,
ADD COLUMN     "segment" TEXT,
ADD COLUMN     "tone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "whatsapp" TEXT,
ALTER COLUMN "cnpj" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "companyId" INTEGER,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "ScheduledPost" ADD CONSTRAINT "ScheduledPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
