import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ClientsPage() {
  await verifySession();
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { vehicles: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
        <Link href="/clients/new">
          <Button>Nouveau client</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nom / Raison sociale</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Téléphone</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Véhicules</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/clients/${client.id}`} className="text-slate-900 font-medium hover:underline">
                    {client.type === "PROFESSIONNEL"
                      ? client.companyName
                      : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || "—"}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Badge variant={client.type === "PROFESSIONNEL" ? "info" : "default"}>
                    {client.type === "PROFESSIONNEL" ? "Pro" : "Particulier"}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-slate-600">{client.phone || "—"}</td>
                <td className="px-4 py-2 text-slate-600">{client.email || "—"}</td>
                <td className="px-4 py-2 text-slate-600">{client._count.vehicles}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucun client pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
