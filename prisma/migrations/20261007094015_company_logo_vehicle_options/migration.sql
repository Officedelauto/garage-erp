-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "adCopy" TEXT,
ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[];
