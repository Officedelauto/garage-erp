import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { WeeklyPlanner, type AppointmentWithRelations } from "@/components/atelier/weekly-planner";
import { clientDisplayName } from "@/lib/utils";
import { addDays, parseWeekParam, toWeekParam, weekDays } from "@/lib/week";

export default async function AtelierPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await verifySession();
  const { week } = await searchParams;
  const weekStart = parseWeekParam(week);
  const weekEnd = addDays(weekStart, 7);
  const days = weekDays(weekStart);

  const [appointments, clients, vehicles, users] = await Promise.all([
    prisma.appointment.findMany({
      where: { startAt: { gte: weekStart, lt: weekEnd } },
      include: { client: true, vehicle: true, assignedTo: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.client.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  const appointmentsByDay: Record<string, AppointmentWithRelations[]> = {};
  for (const a of appointments) {
    const key = toWeekParam(new Date(a.startAt));
    const entry: AppointmentWithRelations = {
      ...a,
      clientId: a.clientId ?? "",
      vehicleId: a.vehicleId ?? "",
      assignedToId: a.assignedToId ?? "",
    };
    (appointmentsByDay[key] ??= []).push(entry);
  }

  const clientOptions = clients.map((c) => ({ id: c.id, label: clientDisplayName(c) }));
  const vehicleOptions = vehicles.map((v) => ({ id: v.id, label: `${v.plate} — ${v.brand} ${v.model}` }));
  const userOptions = users.map((u) => ({ id: u.id, name: u.name }));

  const weekEndDisplay = addDays(weekStart, 6);
  const rangeLabel = `${weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} – ${weekEndDisplay.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-ink-900">Atelier — Planning</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/atelier?week=${toWeekParam(addDays(weekStart, -7))}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50"
            aria-label="Semaine précédente"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="font-medium text-slate-700 min-w-[160px] text-center">{rangeLabel}</span>
          <Link
            href={`/atelier?week=${toWeekParam(addDays(weekStart, 7))}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50"
            aria-label="Semaine suivante"
          >
            <ChevronRight size={16} />
          </Link>
          <Link href={`/atelier?week=${toWeekParam(new Date())}`} className="text-brand-600 hover:underline ml-2">
            Aujourd&apos;hui
          </Link>
        </div>
      </div>

      <WeeklyPlanner
        days={days}
        appointmentsByDay={appointmentsByDay}
        clients={clientOptions}
        vehicles={vehicleOptions}
        users={userOptions}
      />
    </div>
  );
}
