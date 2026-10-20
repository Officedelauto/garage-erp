-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ESPECES', 'CARTE', 'CHEQUE', 'VIREMENT', 'AUTRE');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "depositPaymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "depositAmount" DECIMAL(10,2),
ADD COLUMN     "depositDate" TIMESTAMP(3),
ADD COLUMN     "depositPaymentMethod" "PaymentMethod",
ADD COLUMN     "reservationOrderId" TEXT,
ADD COLUMN     "reservedByClientId" TEXT;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_reservedByClientId_fkey" FOREIGN KEY ("reservedByClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_reservationOrderId_fkey" FOREIGN KEY ("reservationOrderId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
