import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { updateVehicle, deleteVehicle } from "@/lib/actions/vehicles";
import { DeleteButton } from "@/components/shared/delete-button";
import { clientDisplayName, formatEur } from "@/lib/utils";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) notFound();

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const options = clients.map((c) => ({ id: c.id, label: clientDisplayName(c) }));

  const boundUpdate = updateVehicle.bind(null, vehicle.id);
  const boundDelete = deleteVehicle.bind(null, vehicle.id);

  const margin =
    vehicle.purchasePrice != null && vehicle.salePrice != null
      ? Number(vehicle.salePrice) - Number(vehicle.purchasePrice)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          {vehicle.plate} — {vehicle.brand} {vehicle.model}
        </h1>
        <DeleteButton action={boundDelete} confirmMessage="Supprimer ce véhicule ?" />
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

      <VehicleForm
        action={boundUpdate}
        clients={options}
        defaults={{
          clientId: vehicle.clientId,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          vin: vehicle.vin ?? "",
          year: vehicle.year?.toString() ?? "",
          mileage: vehicle.mileage?.toString() ?? "",
          fuelType: vehicle.fuelType,
          purchasePrice: vehicle.purchasePrice?.toString() ?? "",
          salePrice: vehicle.salePrice?.toString() ?? "",
          notes: vehicle.notes ?? "",
        }}
      />
    </div>
  );
}
