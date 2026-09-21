import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { clientDisplayName } from "@/lib/utils";

export default async function VehiclesPage() {
  await verifySession();
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Véhicules</h1>
        <Link href="/vehicules/new">
          <Button>Nouveau véhicule</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Immatriculation</th>
              <th className="px-4 py-2 font-medium">Marque / Modèle</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Kilométrage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/vehicules/${v.id}`} className="font-medium text-slate-900 hover:underline">
                    {v.plate}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{v.brand} {v.model}</td>
                <td className="px-4 py-2 text-slate-600">
                  <Link href={`/clients/${v.clientId}`} className="hover:underline">
                    {clientDisplayName(v.client)}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{v.mileage ? `${v.mileage} km` : "—"}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Aucun véhicule pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
