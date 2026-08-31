CREATE TABLE "MangaReview" (
  "id" TEXT NOT NULL,
  "mangaId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" DOUBLE PRECISION,
  "body" TEXT NOT NULL,
  "containsSpoilers" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MangaReview_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReviewLike" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewLike_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MangaReview_mangaId_userId_key" ON "MangaReview"("mangaId", "userId");
CREATE INDEX "MangaReview_mangaId_createdAt_idx" ON "MangaReview"("mangaId", "createdAt");
CREATE UNIQUE INDEX "ReviewLike_reviewId_userId_key" ON "ReviewLike"("reviewId", "userId");
ALTER TABLE "MangaReview" ADD CONSTRAINT "MangaReview_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MangaReview" ADD CONSTRAINT "MangaReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewLike" ADD CONSTRAINT "ReviewLike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "MangaReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewLike" ADD CONSTRAINT "ReviewLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
