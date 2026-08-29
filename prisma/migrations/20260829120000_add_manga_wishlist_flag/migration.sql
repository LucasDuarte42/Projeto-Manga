-- Keep wishlist membership independent from the reading status.
ALTER TABLE "Manga"
ADD COLUMN "isInWishlist" BOOLEAN NOT NULL DEFAULT false;
