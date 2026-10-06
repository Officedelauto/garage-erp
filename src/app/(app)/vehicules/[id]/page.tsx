import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { VehicleHistory } from "@/components/vehicles/vehicle-history";
import { VehiclePhotos } from "@/components/vehicles/vehicle-photos";
import { updateVehicle, deleteVehicle } from "@/lib/actions/vehicles";
import { DeleteButton } from "@/components/shared/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientDisplayName, formatDateInput, formatEur, monthsSince, yearsSince } from "@/lib/utils";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      notesLog: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!vehicle) notFound();

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const options = clients.map((c) => ({ id: c.id, label: clientDisplayName(c) }));

  const boundUpdate = updateVehicle.bind(null, vehicle.id);
  const boundDelete = deleteVehicle.bind(null, vehicle.id);

  const margin =
    vehicle.purchasePrice != null && vehicle.salePrice != null
      ? Number(vehicle.salePrice) - Number(vehicle.purchasePrice)
      : null;

  const vehicleAgeYears = yearsSince(vehicle.firstRegistrationDate);
  const ctAgeMonths = monthsSince(vehicle.technicalInspectionDate);
  const ctWarning =
    vehicleAgeYears != null &&
    vehicleAgeYears > 4 &&
    (vehicle.technicalInspectionDate == null || (ctAgeMonths != null && ctAgeMonths > 6));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold text-ink-900">
            {vehicle.plate} — {vehicle.brand} {vehicle.model}
          </h1>
          {ctWarning && <Badge variant="danger">CT &gt; 6 mois — non valide pour la revente</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {vehicle.salePrice != null && (
            <Link href={`/vehicules/${vehicle.id}/affiche`} target="_blank">
              <Button variant="outline" size="sm">
                Affiche prix (PDF)
              </Button>
            </Link>
          )}
          <DeleteButton action={boundDelete} confirmMessage="Supprimer ce véhicule ?" />
        </div>
      </div>

      {margin != null && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm inline-flex gap-6">
          <span>
            Achat : <strong>{formatEur(vehicle.purchasePrice!.toString())}</strong>
          </span>
          <span>
            Vente : <strong>{formatEur(vehicle.salePrice!.toString())}</strong>
          </span>
          <span className={margin >= 0 ? "text-green-700" : "text-red-700"}>
            Marge : <strong>{formatEur(margin)}</strong>
          </span>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Photos</h2>
        <VehiclePhotos vehicleId={vehicle.id} photos={vehicle.photos} />
      </div>

      <VehicleForm
        action={boundUpdate}
        clients={options}
        defaults={{
          clientId: vehicle.clientId ?? "",
          plate: vehicle.plate,
          stockNumber: vehicle.stockNumber ?? "",
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color ?? "",
          vin: vehicle.vin ?? "",
          firstRegistrationDate: formatDateInput(vehicle.firstRegistrationDate),
          technicalInspectionDate: formatDateInput(vehicle.technicalInspectionDate),
          fiscalHorsepower: vehicle.fiscalHorsepower?.toString() ?? "",
          mileage: vehicle.mileage?.toString() ?? "",
          fuelType: vehicle.fuelType,
          purchasePrice: vehicle.purchasePrice?.toString() ?? "",
          salePrice: vehicle.salePrice?.toString() ?? "",
          notes: vehicle.notes ?? "",
        }}
      />

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Historique des interventions</h2>
        <VehicleHistory vehicleId={vehicle.id} entries={vehicle.notesLog} />
      </div>
    </div>
  );
}
