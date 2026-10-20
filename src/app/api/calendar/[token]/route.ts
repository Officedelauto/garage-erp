import { prisma } from "@/lib/prisma";
import { buildIcsFeed } from "@/lib/ics";
import { clientDisplayName } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  REVISION: "Révision",
  REPARATION: "Réparation",
  CONTROLE_TECHNIQUE: "Contrôle technique",
  LIVRAISON: "Livraison",
  ESSAI: "Essai",
  AUTRE: "Autre",
};

// Flux public protégé uniquement par le jeton secret dans l'URL (pas de session requise :
// c'est Google qui interroge cette adresse directement, sans cookie de connexion).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const company = await prisma.company.findFirst({ where: { calendarFeedToken: token } });
  if (!company) {
    return new Response("Flux introuvable ou désactivé.", { status: 404 });
  }

  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: { startAt: { gte: from, lte: to } },
    include: { client: true, vehicle: true, assignedTo: true },
    orderBy: { startAt: "asc" },
  });

  const events = appointments.map((a) => ({
    uid: a.id,
    start: a.startAt,
    end: a.endAt,
    summary: a.title,
    description: [
      TYPE_LABELS[a.type] ?? a.type,
      a.client ? `Client : ${clientDisplayName(a.client)}` : null,
      a.vehicle ? `Véhicule : ${a.vehicle.plate} — ${a.vehicle.brand} ${a.vehicle.model}` : null,
      a.assignedTo ? `Collaborateur : ${a.assignedTo.name}` : null,
      a.notes,
    ]
      .filter(Boolean)
      .join("\n"),
  }));

  const ics = buildIcsFeed(`${company.name} — Planning atelier`, events);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="planning.ics"',
      "Cache-Control": "public, max-age=1800",
    },
  });
}
