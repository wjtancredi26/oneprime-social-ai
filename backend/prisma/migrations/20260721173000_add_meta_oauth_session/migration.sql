CREATE TABLE "MetaOAuthSession" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "payloadEncrypted" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    CONSTRAINT "MetaOAuthSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MetaOAuthSession_tokenHash_key" ON "MetaOAuthSession"("tokenHash");
CREATE INDEX "MetaOAuthSession_userId_idx" ON "MetaOAuthSession"("userId");
CREATE INDEX "MetaOAuthSession_companyId_idx" ON "MetaOAuthSession"("companyId");
CREATE INDEX "MetaOAuthSession_expiresAt_idx" ON "MetaOAuthSession"("expiresAt");
ALTER TABLE "MetaOAuthSession" ADD CONSTRAINT "MetaOAuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetaOAuthSession" ADD CONSTRAINT "MetaOAuthSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
