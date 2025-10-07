/*
  Warnings:

  - You are about to drop the column `seniority` on the `Job` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('TECH', 'EDUCATION', 'FINANCE', 'JURIDICAL', 'LOGISTICS', 'MANUFACTURING', 'MEDIA', 'REAL_ESTATE', 'RETAIL', 'HEALTH', 'TOURISM', 'CONSTRUCTION', 'GOVERNMENT', 'ENERGY', 'NGO', 'RESEARCH', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('OTHER');

-- CreateEnum
CREATE TYPE "WorkModel" AS ENUM ('REMOTE', 'HYBRID', 'PRESENTIAL');

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "seniority",
ADD COLUMN     "applicationUrl" TEXT,
ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contractType" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "metadataJson" JSONB,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "requirements" TEXT,
ADD COLUMN     "responsibilities" TEXT,
ADD COLUMN     "salaryCurrency" TEXT DEFAULT 'BRL',
ADD COLUMN     "salaryRangeMax" DOUBLE PRECISION,
ADD COLUMN     "salaryRangeMin" DOUBLE PRECISION,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workModel" TEXT,
ADD COLUMN     "workSchedule" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "industry" "Industry",
ADD COLUMN     "longDescription" TEXT;

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
