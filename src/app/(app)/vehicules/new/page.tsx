import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { createVehicle } from "@/lib/actions/vehicles";
import { clientDisplayName } from "@/lib/utils";

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  await verifySession();
  const { clientId } = await searchParams;

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const options = clients.map((c) => ({ id: c.id, label: clientDisplayName(c) }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Nouveau véhicule</h1>
      <VehicleForm action={createVehicle} clients={options} defaults={{ clientId }} submitLabel="Créer le véhicule" />
    </div>
  );
}
