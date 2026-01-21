/*
  Warnings:

  - A unique constraint covering the columns `[item]` on the table `Items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Items_item_key" ON "public"."Items"("item");
