-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_clientId_fkey";

-- AlterTable
ALTER TABLE "Vehicle" ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
