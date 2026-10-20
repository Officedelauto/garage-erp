-- AlterEnum
ALTER TYPE "DocumentKind" ADD VALUE 'ORDER';
ALTER TYPE "DocumentKind" ADD VALUE 'CREDIT_NOTE';

-- AlterEnum
ALTER TYPE "LineType" ADD VALUE 'VEHICLE';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "creditNotePrefix" TEXT NOT NULL DEFAULT 'AV',
ADD COLUMN     "nextCreditNoteNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nextOrderNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "orderPrefix" TEXT NOT NULL DEFAULT 'BC';

-- AlterTable
ALTER TABLE "DocumentLine" ADD COLUMN     "vehicleId" TEXT;

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceHT" DECIMAL(10,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentLine" ADD CONSTRAINT "DocumentLine_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
