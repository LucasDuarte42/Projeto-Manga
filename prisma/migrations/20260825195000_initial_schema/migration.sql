-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('MANGA', 'HQ');

-- CreateEnum
CREATE TYPE "MangaStatus" AS ENUM ('READ', 'READING', 'WANT_TO_READ');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manga" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT,
    "volume" INTEGER NOT NULL,
    "totalVolumes" INTEGER,
    "ownedVolumes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" "MangaStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "collectionType" "CollectionType" NOT NULL DEFAULT 'MANGA',
    "rating" DOUBLE PRECISION,
    "genre" TEXT,
    "coverUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolumeRating" (
    "id" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VolumeRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Manga_userId_name_volume_key" ON "Manga"("userId", "name", "volume");

-- CreateIndex
CREATE UNIQUE INDEX "VolumeRating_mangaId_volume_key" ON "VolumeRating"("mangaId", "volume");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manga" ADD CONSTRAINT "Manga_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolumeRating" ADD CONSTRAINT "VolumeRating_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga"("id") ON DELETE CASCADE ON UPDATE CASCADE;

