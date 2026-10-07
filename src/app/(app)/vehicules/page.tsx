import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { clientDisplayName } from "@/lib/utils";

const SORTABLE_FIELDS = ["brand", "stockNumber"] as const;
type SortField = (typeof SORTABLE_FIELDS)[number];

function isSortField(value: string | undefined): value is SortField {
  return SORTABLE_FIELDS.includes(value as SortField);
}

function sortLink(field: SortField, label: string, activeSort: SortField | null, activeDir: "asc" | "desc") {
  const nextDir = activeSort === field && activeDir === "asc" ? "desc" : "asc";
  const arrow = activeSort === field ? (activeDir === "asc" ? " ↑" : " ↓") : "";
  return (
    <Link href={`/vehicules?sort=${field}&dir=${nextDir}`} className="hover:underline">
      {label}
      {arrow}
    </Link>
  );
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  await verifySession();
  const { sort, dir } = await searchParams;
  const activeSort = isSortField(sort) ? sort : null;
  const activeDir: "asc" | "desc" = dir === "desc" ? "desc" : "asc";

  const vehicles = await prisma.vehicle.findMany({
    orderBy: activeSort ? { [activeSort]: activeDir } : { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl font-semibold text-ink-900">Véhicules</h1>
        <Link href="/vehicules/new">
          <Button>Nouveau véhicule</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Immatriculation</th>
              <th className="px-4 py-2 font-medium">{sortLink("brand", "Marque / Modèle", activeSort, activeDir)}</th>
              <th className="px-4 py-2 font-medium">{sortLink("stockNumber", "N° VO", activeSort, activeDir)}</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Kilométrage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-2">
                  <Link href={`/vehicules/${v.id}`} className="font-medium text-slate-900 hover:underline">
                    {v.plate}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{v.brand} {v.model}</td>
                <td className="px-4 py-2 text-slate-600">{v.stockNumber || "—"}</td>
                <td className="px-4 py-2 text-slate-600">
                  {v.clientId ? (
                    <Link href={`/clients/${v.clientId}`} className="hover:underline">
                      {clientDisplayName(v.client)}
                    </Link>
                  ) : (
                    <span className="text-slate-400">{clientDisplayName(null)}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{v.mileage ? `${v.mileage} km` : "—"}</td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
