/*
  Warnings:

  - You are about to drop the `_JobToJobTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_JobToJobTag" DROP CONSTRAINT "_JobToJobTag_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobToJobTag" DROP CONSTRAINT "_JobToJobTag_B_fkey";

-- DropTable
DROP TABLE "public"."_JobToJobTag";

-- CreateTable
CREATE TABLE "_JobTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_JobTags_B_index" ON "_JobTags"("B");

-- AddForeignKey
ALTER TABLE "_JobTags" ADD CONSTRAINT "_JobTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobTags" ADD CONSTRAINT "_JobTags_B_fkey" FOREIGN KEY ("B") REFERENCES "JobTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
