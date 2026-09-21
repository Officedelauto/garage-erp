import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/documents/status-badge";
import { clientDisplayName, formatDate, formatEur } from "@/lib/utils";

export default async function InvoicesPage() {
  await verifySession();
  const invoices = await prisma.document.findMany({
    where: { kind: "INVOICE" },
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Factures</h1>
        <Link href="/documents/factures/new">
          <Button>Nouvelle facture</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Numéro</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Total TTC</th>
              <th className="px-4 py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/documents/factures/${doc.id}`} className="font-medium text-slate-900 hover:underline">
                    {doc.number ?? "Brouillon"}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{clientDisplayName(doc.client)}</td>
                <td className="px-4 py-2 text-slate-600">{formatDate(doc.issueDate ?? doc.createdAt)}</td>
                <td className="px-4 py-2 text-slate-600">{formatEur(doc.totalTTC.toString())}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={doc.status} />
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucune facture pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
