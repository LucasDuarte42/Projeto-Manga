-- CreateEnum
CREATE TYPE "VolumeStatus" AS ENUM ('MISSING', 'OWNED', 'READ', 'LOANED');

-- CreateTable
CREATE TABLE "MangaVolume" (
    "id" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "VolumeStatus" NOT NULL DEFAULT 'MISSING',
    "loanedTo" TEXT,
    "loanedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MangaVolume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolumeHistory" (
    "id" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "fromStatus" "VolumeStatus",
    "toStatus" "VolumeStatus" NOT NULL,
    "loanedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolumeHistory_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "MangaVolume_mangaId_number_key" ON "MangaVolume"("mangaId", "number");
CREATE INDEX "MangaVolume_mangaId_status_idx" ON "MangaVolume"("mangaId", "status");
CREATE INDEX "VolumeHistory_volumeId_changedAt_idx" ON "VolumeHistory"("volumeId", "changedAt");

-- Foreign keys
ALTER TABLE "MangaVolume" ADD CONSTRAINT "MangaVolume_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VolumeHistory" ADD CONSTRAINT "VolumeHistory_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "MangaVolume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing acquired volumes first so legacy ownedVolumes is preserved.
INSERT INTO "MangaVolume" ("id", "mangaId", "number", "status", "createdAt", "updatedAt")
SELECT md5(m."id" || ':owned:' || volume_number::text), m."id", volume_number, 'OWNED'::"VolumeStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Manga" m
CROSS JOIN LATERAL unnest(m."ownedVolumes") AS volume_number
WHERE volume_number > 0
ON CONFLICT ("mangaId", "number") DO NOTHING;

-- Add missing rows for known total volumes.
INSERT INTO "MangaVolume" ("id", "mangaId", "number", "status", "createdAt", "updatedAt")
SELECT md5(m."id" || ':missing:' || volume_number::text), m."id", volume_number, 'MISSING'::"VolumeStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Manga" m
CROSS JOIN LATERAL generate_series(1, COALESCE(m."totalVolumes", 0)) AS volume_number
WHERE NOT EXISTS (
  SELECT 1 FROM "MangaVolume" v
  WHERE v."mangaId" = m."id" AND v."number" = volume_number
)
ON CONFLICT ("mangaId", "number") DO NOTHING;

-- Record the migrated state in the audit history.
INSERT INTO "VolumeHistory" ("id", "volumeId", "fromStatus", "toStatus", "changedAt")
SELECT md5(v."id" || ':initial'), v."id", NULL, v."status", CURRENT_TIMESTAMP
FROM "MangaVolume" v;
