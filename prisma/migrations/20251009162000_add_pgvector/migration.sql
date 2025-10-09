/*
  Warnings:

  - You are about to alter the column `embedding` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `ByteA` to `Unsupported("vector(768)")`.
  - You are about to alter the column `embedding` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `ByteA` to `Unsupported("vector(768)")`.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable (drop and recreate to avoid cast issues)
ALTER TABLE "Candidate" DROP COLUMN "embedding";
ALTER TABLE "Candidate" ADD COLUMN "embedding" vector(768);

-- AlterTable (drop and recreate to avoid cast issues)
ALTER TABLE "Job" DROP COLUMN "embedding";
ALTER TABLE "Job" ADD COLUMN "embedding" vector(768);

-- CreateIndex (usando HNSW para cosine similarity - mais eficiente)
CREATE INDEX "Candidate_embedding_idx" ON "Candidate" USING hnsw ("embedding" vector_cosine_ops);

-- CreateIndex (usando HNSW para cosine similarity - mais eficiente)
CREATE INDEX "Job_embedding_idx" ON "Job" USING hnsw ("embedding" vector_cosine_ops);
