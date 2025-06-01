/*
  Warnings:

  - Made the column `address` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `latitude` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL;
