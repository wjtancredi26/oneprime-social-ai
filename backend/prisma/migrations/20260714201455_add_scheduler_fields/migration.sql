-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "facebookPostId" TEXT,
ADD COLUMN     "instagramPostId" TEXT,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3);
