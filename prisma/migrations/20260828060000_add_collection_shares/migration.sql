-- CreateTable
CREATE TABLE "CollectionShare" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionShare_tokenHash_key" ON "CollectionShare"("tokenHash");
CREATE INDEX "CollectionShare_userId_revokedAt_idx" ON "CollectionShare"("userId", "revokedAt");

-- AddForeignKey
ALTER TABLE "CollectionShare" ADD CONSTRAINT "CollectionShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
