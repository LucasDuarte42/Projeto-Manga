-- Persist the user's manually selected profile highlights.
ALTER TABLE "User"
ADD COLUMN "featuredMangaIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
