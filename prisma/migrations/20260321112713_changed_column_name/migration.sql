/*
  Warnings:

  - You are about to drop the column `category` on the `Items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Items" DROP COLUMN "category",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Expense';
