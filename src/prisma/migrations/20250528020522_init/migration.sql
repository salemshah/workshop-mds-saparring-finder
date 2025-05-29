/*
  Warnings:

  - Added the required column `sender_id` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "sender_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "_SparringToUser" ADD CONSTRAINT "_SparringToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_SparringToUser_AB_unique";

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
