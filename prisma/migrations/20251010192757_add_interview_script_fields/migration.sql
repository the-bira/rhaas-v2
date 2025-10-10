/*
  Warnings:

  - You are about to alter the column `embedding` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.
  - You are about to alter the column `embedding` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `vector(768)` to `Unsupported("vector(768)")`.

*/
-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "embedding" SET DATA TYPE vector(768);

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "stateJson" JSONB,
ADD COLUMN     "stepsJson" JSONB;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "interviewScriptJson" JSONB,
ALTER COLUMN "embedding" SET DATA TYPE vector(768);
