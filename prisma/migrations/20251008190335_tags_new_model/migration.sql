/*
  Warnings:

  - You are about to drop the column `tags` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "tags";

-- CreateTable
CREATE TABLE "JobTag" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JobToJobTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobToJobTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobTag_tag_key" ON "JobTag"("tag");

-- CreateIndex
CREATE INDEX "_JobToJobTag_B_index" ON "_JobToJobTag"("B");

-- AddForeignKey
ALTER TABLE "_JobToJobTag" ADD CONSTRAINT "_JobToJobTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobToJobTag" ADD CONSTRAINT "_JobToJobTag_B_fkey" FOREIGN KEY ("B") REFERENCES "JobTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
