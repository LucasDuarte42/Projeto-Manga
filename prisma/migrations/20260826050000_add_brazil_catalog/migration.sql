-- Brazilian catalog: work, edition, volume, and verification sources
CREATE TYPE "EditionType" AS ENUM (
  'STANDARD', 'TWO_IN_ONE', 'THREE_IN_ONE', 'BIG', 'DELUXE',
  'KANZENBAN', 'OMNIBUS', 'SPECIAL', 'BOX_SET', 'DIGITAL', 'OTHER'
);

CREATE TYPE "PublicationStatus" AS ENUM (
  'ONGOING', 'COMPLETE', 'HIATUS', 'UNKNOWN'
);

CREATE TABLE "CatalogWork" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "normalizedTitle" TEXT NOT NULL,
  "author" TEXT,
  "workType" "CollectionType" NOT NULL DEFAULT 'MANGA',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogWork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogEdition" (
  "id" TEXT NOT NULL,
  "workId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "editionType" "EditionType" NOT NULL DEFAULT 'STANDARD',
  "publisher" TEXT,
  "country" TEXT NOT NULL DEFAULT 'BR',
  "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'UNKNOWN',
  "latestVolumeObserved" INTEGER,
  "totalVolumes" INTEGER,
  "sourceUrl" TEXT,
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogEdition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogVolume" (
  "id" TEXT NOT NULL,
  "editionId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT,
  "isbn" TEXT,
  "releaseDateBR" TIMESTAMP(3),
  "sourceUrl" TEXT,
  "coverUrl" TEXT,
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogVolume_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CatalogSource" (
  "id" TEXT NOT NULL,
  "editionId" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "observedYear" INTEGER NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "evidence" TEXT,
  CONSTRAINT "CatalogSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogWork_normalizedTitle_workType_key"
  ON "CatalogWork"("normalizedTitle", "workType");
CREATE INDEX "CatalogWork_title_idx" ON "CatalogWork"("title");
CREATE UNIQUE INDEX "CatalogEdition_workId_publisher_name_country_key"
  ON "CatalogEdition"("workId", "publisher", "name", "country");
CREATE INDEX "CatalogEdition_publisher_editionType_idx"
  ON "CatalogEdition"("publisher", "editionType");
CREATE UNIQUE INDEX "CatalogVolume_editionId_number_key"
  ON "CatalogVolume"("editionId", "number");
CREATE INDEX "CatalogVolume_isbn_idx" ON "CatalogVolume"("isbn");
CREATE UNIQUE INDEX "CatalogSource_editionId_sourceUrl_observedYear_key"
  ON "CatalogSource"("editionId", "sourceUrl", "observedYear");
CREATE INDEX "CatalogSource_observedYear_sourceName_idx"
  ON "CatalogSource"("observedYear", "sourceName");

ALTER TABLE "CatalogEdition"
  ADD CONSTRAINT "CatalogEdition_workId_fkey"
  FOREIGN KEY ("workId") REFERENCES "CatalogWork"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogVolume"
  ADD CONSTRAINT "CatalogVolume_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "CatalogEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CatalogSource"
  ADD CONSTRAINT "CatalogSource_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "CatalogEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
