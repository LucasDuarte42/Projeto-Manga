-- New works start without a reading status selected.
ALTER TABLE "Manga"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" DROP NOT NULL;
