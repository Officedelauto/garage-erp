-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "year",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "firstRegistrationDate" TIMESTAMP(3),
ADD COLUMN     "fiscalHorsepower" INTEGER,
ADD COLUMN     "stockNumber" TEXT,
ADD COLUMN     "technicalInspectionDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VehicleNote" ADD COLUMN     "mileage" INTEGER,
ADD COLUMN     "performedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
