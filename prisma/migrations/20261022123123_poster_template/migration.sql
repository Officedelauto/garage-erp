-- CreateEnum
CREATE TYPE "PosterTemplate" AS ENUM ('CLASSIQUE', 'MODERNE', 'MINIMALISTE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "posterTemplate" "PosterTemplate" NOT NULL DEFAULT 'CLASSIQUE';
