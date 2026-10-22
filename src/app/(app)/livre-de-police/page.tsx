import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { clientDisplayName, formatDate, formatEur } from "@/lib/utils";
import { PrintButton } from "@/components/shared/print-button";

// Trie par N° VO dans l'ordre chronologique d'attribution (numérique quand c'est un
// nombre, sinon ordre alphabétique en repli ; les véhicules sans N° VO passent en dernier).
function compareStockNumber(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

export default async function LivreDePolicePage() {
  const { role } = await verifySession();

  if (role !== "ADMIN") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Le livre de police est réservé aux comptes administrateur.
      </div>
    );
  }

  const vehicles = await prisma.vehicle.findMany({ include: { client: true } });
  vehicles.sort((a, b) => compareStockNumber(a.stockNumber, b.stockNumber));

  return (
    <div>
      <div className="flex items-center justify-between mb-1 print:hidden">
        <h1 className="font-heading text-xl font-semibold text-ink-900">Livre de police</h1>
        <PrintButton />
      </div>
      <p className="text-sm text-slate-500 mb-4 print:hidden">
        Registre des achats et ventes de véhicules d&apos;occasion, dans l&apos;ordre chronologique des N° VO
        (registre des objets mobiliers).
      </p>

      <h1 className="hidden font-heading text-lg font-semibold text-ink-900 mb-3 print:block">
        Livre de police — Registre des objets mobiliers
      </h1>

      <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden print:border-0 print:rounded-none">
        <table className="w-full text-xs print:text-[9px]">
          <thead className="bg-slate-50 text-left text-slate-500 print:bg-white">
            <tr>
              <th className="px-3 py-2 font-medium">N° VO</th>
              <th className="px-3 py-2 font-medium">Date d&apos;achat</th>
              <th className="px-3 py-2 font-medium">Vendeur</th>
              <th className="px-3 py-2 font-medium">Marque</th>
              <th className="px-3 py-2 font-medium">Modèle</th>
              <th className="px-3 py-2 font-medium">VIN</th>
              <th className="px-3 py-2 font-medium">Plaque</th>
              <th className="px-3 py-2 font-medium">KM</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Date de vente</th>
              <th className="px-3 py-2 font-medium">Prix de vente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="break-inside-avoid">
                <td className="px-3 py-1.5 font-medium text-slate-900">{v.stockNumber || "—"}</td>
                <td className="px-3 py-1.5 text-slate-600">{formatDate(v.purchaseDate)}</td>
                <td className="px-3 py-1.5 text-slate-600">{v.sellerName || "—"}</td>
                <td className="px-3 py-1.5 text-slate-600">{v.brand}</td>
                <td className="px-3 py-1.5 text-slate-600">{v.model}</td>
                <td className="px-3 py-1.5 text-slate-600">{v.vin || "—"}</td>
                <td className="px-3 py-1.5 text-slate-600">{v.plate}</td>
                <td className="px-3 py-1.5 text-slate-600">{v.mileage != null ? `${v.mileage} km` : "—"}</td>
                <td className="px-3 py-1.5 text-slate-600">{v.client ? clientDisplayName(v.client) : "—"}</td>
                <td className="px-3 py-1.5 text-slate-600">{formatDate(v.saleDate)}</td>
                <td className="px-3 py-1.5 text-slate-600">
                  {v.salePrice != null ? formatEur(v.salePrice.toString()) : "—"}
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-400">
                  Aucun véhicule enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
