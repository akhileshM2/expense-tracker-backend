/*
  Warnings:

  - You are about to drop the column `parentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Linked_User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_parentId_fkey";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "parentId";

-- DropTable
DROP TABLE "public"."Linked_User";
