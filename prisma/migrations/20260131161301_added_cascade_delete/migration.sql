-- DropForeignKey
ALTER TABLE "public"."Items" DROP CONSTRAINT "Items_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Items" ADD CONSTRAINT "Items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
