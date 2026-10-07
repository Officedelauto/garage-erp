import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clientDisplayName, cn } from "@/lib/utils";
import { vehicleStatus, VEHICLE_STATUS_BADGES } from "@/lib/vehicle-status";

const SORTABLE_FIELDS = ["brand", "stockNumber"] as const;
type SortField = (typeof SORTABLE_FIELDS)[number];

const STATUS_FILTERS = ["stock", "vendu", "client"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function isSortField(value: string | undefined): value is SortField {
  return SORTABLE_FIELDS.includes(value as SortField);
}

function isStatusFilter(value: string | undefined): value is StatusFilter {
  return STATUS_FILTERS.includes(value as StatusFilter);
}

function buildQuery(params: Record<string, string | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `/vehicules?${qs}` : "/vehicules";
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; dir?: string; status?: string }>;
}) {
  await verifySession();
  const { sort, dir, status } = await searchParams;
  const activeSort = isSortField(sort) ? sort : null;
  const activeDir: "asc" | "desc" = dir === "desc" ? "desc" : "asc";
  const activeStatus = isStatusFilter(status) ? status : null;

  const allVehicles = await prisma.vehicle.findMany({
    orderBy: activeSort ? { [activeSort]: activeDir } : { createdAt: "desc" },
    include: { client: true },
  });

  const counts = { stock: 0, vendu: 0, client: 0 };
  for (const v of allVehicles) {
    const s = vehicleStatus(v);
    if (s === "STOCK") counts.stock++;
    else if (s === "VENDU") counts.vendu++;
    else counts.client++;
  }

  const vehicles = activeStatus
    ? allVehicles.filter((v) => vehicleStatus(v).toLowerCase() === activeStatus)
    : allVehicles;

  function sortLink(field: SortField, label: string) {
    const nextDir = activeSort === field && activeDir === "asc" ? "desc" : "asc";
    const arrow = activeSort === field ? (activeDir === "asc" ? " ↑" : " ↓") : "";
    return (
      <Link href={buildQuery({ sort: field, dir: nextDir, status: activeStatus })} className="hover:underline">
        {label}
        {arrow}
      </Link>
    );
  }

  function statusTab(value: StatusFilter | null, label: string, count: number) {
    const active = activeStatus === value;
    return (
      <Link
        href={buildQuery({ status: value, sort: activeSort, dir: activeDir })}
        className={cn(
          "rounded-full px-3 py-1 text-sm font-medium transition-colors",
          active ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        {label} ({count})
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl font-semibold text-ink-900">Véhicules</h1>
        <Link href="/vehicules/new">
          <Button>Nouveau véhicule</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {statusTab(null, "Tous", allVehicles.length)}
        {statusTab("stock", "En stock", counts.stock)}
        {statusTab("vendu", "Vendus", counts.vendu)}
        {statusTab("client", "Client (atelier)", counts.client)}
      </div>

      <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Immatriculation</th>
              <th className="px-4 py-2 font-medium">{sortLink("brand", "Marque / Modèle")}</th>
              <th className="px-4 py-2 font-medium">{sortLink("stockNumber", "N° VO")}</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Kilométrage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => {
              const statusInfo = VEHICLE_STATUS_BADGES[vehicleStatus(v)];
              return (
                <tr key={v.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-2">
                    <Link href={`/vehicules/${v.id}`} className="font-medium text-slate-900 hover:underline">
                      {v.plate}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{v.brand} {v.model}</td>
                  <td className="px-4 py-2 text-slate-600">{v.stockNumber || "—"}</td>
                  <td className="px-4 py-2">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </td>
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
              );
            })}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aucun véhicule dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
