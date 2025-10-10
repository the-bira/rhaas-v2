/*
  Warnings:

  - You are about to alter the column `embedding` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `embedding` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - A unique constraint covering the columns `[accessToken]` on the table `Interview` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "embedding" SET DATA TYPE vector(768);

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "accessToken" TEXT;

-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "embedding" SET DATA TYPE vector(768);

-- CreateIndex
CREATE UNIQUE INDEX "Interview_accessToken_key" ON "Interview"("accessToken");
