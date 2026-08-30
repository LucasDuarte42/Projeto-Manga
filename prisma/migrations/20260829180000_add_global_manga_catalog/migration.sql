CREATE TABLE "CatalogManga" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "author" TEXT,
    "totalVolumes" INTEGER,
    "totalChapters" INTEGER,
    "genre" TEXT,
    "coverUrl" TEXT,
    "collectionType" "CollectionType" NOT NULL DEFAULT 'MANGA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CatalogManga_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogManga_normalizedName_collectionType_key" ON "CatalogManga"("normalizedName", "collectionType");
CREATE INDEX "CatalogManga_name_idx" ON "CatalogManga"("name");
ALTER TABLE "Manga" ADD COLUMN "catalogId" TEXT;
CREATE INDEX "Manga_catalogId_idx" ON "Manga"("catalogId");
ALTER TABLE "Manga" ADD CONSTRAINT "Manga_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "CatalogManga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "CatalogManga" ("id", "name", "normalizedName", "author", "totalVolumes", "totalChapters", "genre", "coverUrl", "collectionType", "createdAt", "updatedAt")
SELECT
  'cat_' || md5(lower(trim("name")) || '|' || "collectionType"::text),
  min("name"),
  lower(trim("name")),
  (array_agg("author" ORDER BY "updatedAt" DESC))[1],
  (array_agg("totalVolumes" ORDER BY "updatedAt" DESC))[1],
  (array_agg("totalChapters" ORDER BY "updatedAt" DESC))[1],
  (array_agg("genre" ORDER BY "updatedAt" DESC))[1],
  (array_agg("coverUrl" ORDER BY "updatedAt" DESC))[1],
  "collectionType",
  min("createdAt"),
  max("updatedAt")
FROM "Manga"
GROUP BY lower(trim("name")), "collectionType";

UPDATE "Manga" m
SET "catalogId" = c."id"
FROM "CatalogManga" c
WHERE c."normalizedName" = lower(trim(m."name"))
  AND c."collectionType" = m."collectionType";
