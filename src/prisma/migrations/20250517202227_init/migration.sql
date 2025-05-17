/*
  Warnings:

  - Added the required column `bio` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "bio" TEXT NOT NULL,
ALTER COLUMN "verified" DROP NOT NULL;
