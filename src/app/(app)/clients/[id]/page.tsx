import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ClientForm } from "@/components/clients/client-form";
import { updateClient, deleteClient } from "@/lib/actions/clients";
import { DeleteButton } from "@/components/shared/delete-button";
import { Button } from "@/components/ui/button";
import { formatEur } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { vehicles: { orderBy: { createdAt: "desc" } } },
  });

  if (!client) notFound();

  const boundUpdate = updateClient.bind(null, client.id);
  const boundDelete = deleteClient.bind(null, client.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-ink-900">
          {client.type === "PROFESSIONNEL"
            ? client.companyName
            : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()}
        </h1>
        <DeleteButton
          action={boundDelete}
          confirmMessage="Supprimer ce client et tous ses véhicules associés ?"
        />
      </div>

      <ClientForm action={boundUpdate} defaults={{
        type: client.type,
        firstName: client.firstName ?? "",
        lastName: client.lastName ?? "",
        companyName: client.companyName ?? "",
        siret: client.siret ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        address: client.address ?? "",
        postalCode: client.postalCode ?? "",
        city: client.city ?? "",
        notes: client.notes ?? "",
      }} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Véhicules</h2>
          <Link href={`/vehicules/new?clientId=${client.id}`}>
            <Button variant="outline" size="sm">Ajouter un véhicule</Button>
          </Link>
        </div>
        <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Immatriculation</th>
                <th className="px-4 py-2 font-medium">Marque / Modèle</th>
                <th className="px-4 py-2 font-medium">Kilométrage</th>
                <th className="px-4 py-2 font-medium">Prix de vente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-2">
                    <Link href={`/vehicules/${v.id}`} className="font-medium text-slate-900 hover:underline">
                      {v.plate}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{v.brand} {v.model}</td>
                  <td className="px-4 py-2 text-slate-600">{v.mileage ? `${v.mileage} km` : "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{v.salePrice ? formatEur(v.salePrice.toString()) : "—"}</td>
                </tr>
              ))}
              {client.vehicles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Aucun véhicule enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
