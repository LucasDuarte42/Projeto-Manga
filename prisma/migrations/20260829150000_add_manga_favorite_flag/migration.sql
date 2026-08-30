-- Keep favorites independent from the wishlist.
ALTER TABLE "Manga"
ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;
