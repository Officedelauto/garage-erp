-- CreateTable
CREATE TABLE "VehicleNote" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleNote" ADD CONSTRAINT "VehicleNote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
