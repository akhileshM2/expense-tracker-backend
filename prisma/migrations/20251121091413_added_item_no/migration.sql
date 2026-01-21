/*
  Warnings:

  - A unique constraint covering the columns `[userId,itemNo]` on the table `Items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemNo` to the `Items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Items_item_key";

-- AlterTable
ALTER TABLE "public"."Items" ADD COLUMN     "itemNo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Items_userId_itemNo_key" ON "public"."Items"("userId", "itemNo");
