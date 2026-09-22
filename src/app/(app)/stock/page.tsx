import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEur } from "@/lib/utils";

export default async function StockPage() {
  await verifySession();
  const items = await prisma.stockItem.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl font-semibold text-ink-900">Stock</h1>
        <Link href="/stock/new">
          <Button>Nouvelle pièce</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Référence</th>
              <th className="px-4 py-2 font-medium">Nom</th>
              <th className="px-4 py-2 font-medium">Prix vente HT</th>
              <th className="px-4 py-2 font-medium">Quantité</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const low = item.quantity <= item.alertThreshold;
              return (
                <tr key={item.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-2">
                    <Link href={`/stock/${item.id}`} className="font-medium text-slate-900 hover:underline">
                      {item.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{item.name}</td>
                  <td className="px-4 py-2 text-slate-600">{formatEur(item.salePriceHT.toString())}</td>
                  <td className="px-4 py-2 text-slate-600">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-2">
                    {low ? (
                      <Badge variant="danger">Stock bas</Badge>
                    ) : (
                      <Badge variant="success">OK</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucune pièce en stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
