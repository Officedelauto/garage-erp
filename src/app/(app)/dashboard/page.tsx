import Link from "next/link";
import { Euro, ReceiptText, Car, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/documents/status-badge";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_TYPE_LABELS } from "@/components/atelier/appointment-form";
import { vehicleStatus } from "@/lib/vehicle-status";
import { clientDisplayName, formatDate, formatEur, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  await verifySession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() + 1);

  const [
    monthInvoices,
    unpaidInvoices,
    vehiclesInProgress,
    allVehicles,
    recentDocuments,
    todaysAppointments,
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
    prisma.vehicle.findMany({ select: { clientId: true, salePrice: true, reservedByClientId: true } }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { client: true },
    }),
    prisma.appointment.findMany({
      where: { startAt: { gte: startOfToday, lt: startOfTomorrow } },
      include: { client: true, vehicle: true, assignedTo: true },
      orderBy: { startAt: "asc" },
    }),
  ]);

  const revenueThisMonth = monthInvoices.reduce((sum, d) => sum + Number(d.totalHT), 0);
  const unpaidTotal = unpaidInvoices.reduce((sum, d) => sum + Number(d.totalTTC), 0);
  const overdueCount = unpaidInvoices.filter((d) => d.dueDate && d.dueDate < now).length;
  const stockCount = allVehicles.filter((v) => vehicleStatus(v) === "STOCK").length;
  const reservedCount = allVehicles.filter((v) => vehicleStatus(v) === "RESERVE").length;

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
      label: "Véhicules en stock",
      value: stockCount,
      sub: "disponibles à la vente",
      icon: Car,
      accent: "bg-slate-100 text-slate-600",
    },
    {
      label: "Véhicules réservés",
      value: reservedCount,
      sub: "acompte reçu, livraison en cours",
      icon: Lock,
      accent: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-ink-900">Tableau de bord</h1>

      <div className="grid grid-cols-5 gap-4">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rendez-vous d&apos;aujourd&apos;hui</CardTitle>
            <Link href="/atelier" className="text-xs text-brand-600 hover:underline">
              Voir le planning →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {todaysAppointments.length === 0 && <p className="text-sm text-slate-400">Aucun rendez-vous aujourd&apos;hui.</p>}
          {todaysAppointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 w-12">{formatTime(a.startAt)}</span>
                <span className="text-slate-700">{a.title}</span>
                <Badge variant="default" className="text-[10px]">
                  {APPOINTMENT_TYPE_LABELS[a.type]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                {a.vehicle && <span>{a.vehicle.plate}</span>}
                {a.client && <span>{clientDisplayName(a.client)}</span>}
                {a.assignedTo && <span>👤 {a.assignedTo.name}</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
