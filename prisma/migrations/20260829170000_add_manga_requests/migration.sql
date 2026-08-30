CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "MangaRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "totalVolumes" INTEGER,
    "collectionType" "CollectionType" NOT NULL DEFAULT 'MANGA',
    "coverUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MangaRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MangaRequest_userId_status_idx" ON "MangaRequest"("userId", "status");
ALTER TABLE "MangaRequest" ADD CONSTRAINT "MangaRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
