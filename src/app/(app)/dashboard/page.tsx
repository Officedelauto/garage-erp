import Link from "next/link";
import { Euro, ReceiptText, Car, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/documents/status-badge";
import { clientDisplayName, formatDate, formatEur } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  await verifySession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    monthInvoices,
    unpaidInvoices,
    vehiclesInProgress,
    stockItems,
    recentDocuments,
  ] = await Promise.all([
    prisma.document.findMany({
      where: {
        kind: "INVOICE",
        status: { in: ["FINALIZED", "PAID"] },
        issueDate: { gte: startOfMonth },
      },
      select: { totalHT: true },
    }),
    prisma.document.findMany({
      where: { kind: "INVOICE", status: "FINALIZED" },
      select: { id: true, number: true, totalTTC: true, dueDate: true, client: true },
    }),
    prisma.vehicle.findMany({
      where: {
        documents: {
          some: { status: { in: ["DRAFT", "FINALIZED"] } },
        },
      },
      distinct: ["id"],
      include: { client: true },
    }),
    prisma.stockItem.findMany({ orderBy: { quantity: "asc" } }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { client: true },
    }),
  ]);

  const revenueThisMonth = monthInvoices.reduce((sum, d) => sum + Number(d.totalHT), 0);
  const unpaidTotal = unpaidInvoices.reduce((sum, d) => sum + Number(d.totalTTC), 0);
  const overdueCount = unpaidInvoices.filter((d) => d.dueDate && d.dueDate < now).length;
  const lowStockItems = stockItems.filter((item) => item.quantity <= item.alertThreshold);

  const stats = [
    {
      label: "CA du mois (HT)",
      value: formatEur(revenueThisMonth),
      icon: Euro,
      accent: "bg-brand-50 text-brand-600",
    },
    {
      label: "Factures impayées",
      value: formatEur(unpaidTotal),
      sub: `${unpaidInvoices.length} facture(s)${overdueCount > 0 ? `, dont ${overdueCount} en retard` : ""}`,
      icon: ReceiptText,
      accent: "bg-red-50 text-red-600",
    },
    {
      label: "Véhicules en atelier",
      value: vehiclesInProgress.length,
      sub: "devis ou facture en cours",
      icon: Car,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      label: "Alertes stock bas",
      value: lowStockItems.length,
      sub: "pièce(s) sous le seuil",
      icon: TriangleAlert,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-ink-900">Tableau de bord</h1>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle>{stat.label}</CardTitle>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.accent)}>
                  <stat.icon size={16} strokeWidth={2.5} />
                </span>
              </div>
              <p className="font-heading text-2xl font-semibold text-ink-900">{stat.value}</p>
              {stat.sub && <p className="text-xs text-ink-700/60 mt-1">{stat.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Factures impayées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unpaidInvoices.length === 0 && <p className="text-sm text-slate-400">Aucune facture impayée.</p>}
            {unpaidInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <Link href={`/documents/factures/${inv.id}`} className="hover:underline">
                  {inv.number} — {clientDisplayName(inv.client)}
                </Link>
                <span className={inv.dueDate && inv.dueDate < now ? "text-red-600 font-medium" : "text-slate-600"}>
                  {formatEur(inv.totalTTC.toString())}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockItems.length === 0 && <p className="text-sm text-slate-400">Aucune alerte.</p>}
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <Link href={`/stock/${item.id}`} className="hover:underline">
                  {item.reference} — {item.name}
                </Link>
                <span className="text-red-600 font-medium">
                  {item.quantity} / seuil {item.alertThreshold}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dernière activité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between text-sm">
              <Link
                href={`/documents/${doc.kind === "QUOTE" ? "devis" : "factures"}/${doc.id}`}
                className="hover:underline"
              >
                {doc.kind === "QUOTE" ? "Devis" : "Facture"} {doc.number ?? "(brouillon)"} — {clientDisplayName(doc.client)}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{formatDate(doc.createdAt)}</span>
                <StatusBadge status={doc.status} />
              </div>
            </div>
          ))}
          {recentDocuments.length === 0 && <p className="text-sm text-slate-400">Aucune activité pour l&apos;instant.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
