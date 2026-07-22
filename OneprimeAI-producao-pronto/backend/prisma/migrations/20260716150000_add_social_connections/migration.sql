CREATE TABLE IF NOT EXISTS "SocialConnection" (
  "id" SERIAL NOT NULL,
  "companyId" INTEGER NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'META',
  "facebookPageId" TEXT NOT NULL,
  "facebookPageName" TEXT NOT NULL,
  "instagramUserId" TEXT,
  "instagramUsername" TEXT,
  "pageAccessTokenEncrypted" TEXT NOT NULL,
  "userAccessTokenEncrypted" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'CONNECTED',
  "lastError" TEXT,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SocialConnection_companyId_provider_key"
ON "SocialConnection"("companyId", "provider");

CREATE INDEX IF NOT EXISTS "SocialConnection_companyId_idx"
ON "SocialConnection"("companyId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SocialConnection_companyId_fkey'
  ) THEN
    ALTER TABLE "SocialConnection"
    ADD CONSTRAINT "SocialConnection_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
