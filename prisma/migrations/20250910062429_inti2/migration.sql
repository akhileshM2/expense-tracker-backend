-- DropForeignKey
ALTER TABLE "public"."Items" DROP CONSTRAINT "Items_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Items" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "parentId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Linked_User" (
    "email" TEXT NOT NULL,
    "admin" TEXT[]
);

-- CreateIndex
CREATE UNIQUE INDEX "Linked_User_email_key" ON "public"."Linked_User"("email");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Items" ADD CONSTRAINT "Items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
