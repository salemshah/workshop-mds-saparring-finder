-- AlterTable
ALTER TABLE "Sparring" ALTER COLUMN "notes" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fcmToken" TEXT;
