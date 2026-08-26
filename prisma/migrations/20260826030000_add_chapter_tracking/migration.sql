-- Add chapter tracking to Manga
ALTER TABLE "Manga"
  ADD COLUMN "totalChapters" INTEGER,
  ADD COLUMN "readChapters" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- Create chapter ratings
CREATE TABLE "ChapterRating" (
  "id" TEXT NOT NULL,
  "mangaId" TEXT NOT NULL,
  "chapter" INTEGER NOT NULL,
  "note" DOUBLE PRECISION NOT NULL,

  CONSTRAINT "ChapterRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChapterRating_mangaId_chapter_key"
  ON "ChapterRating"("mangaId", "chapter");

ALTER TABLE "ChapterRating"
  ADD CONSTRAINT "ChapterRating_mangaId_fkey"
  FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
