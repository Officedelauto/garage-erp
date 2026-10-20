"use client";

import { useState } from "react";
import {
  AppointmentForm,
  APPOINTMENT_TYPE_LABELS,
  emptyAppointmentDefaults,
  type AppointmentDefaults,
} from "@/components/atelier/appointment-form";
import { createAppointment, updateAppointment, deleteAppointment } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { clientDisplayName, formatDateTimeInput, formatTime } from "@/lib/utils";
import { isSameDay, toWeekParam } from "@/lib/week";

export type AppointmentWithRelations = {
  id: string;
  title: string;
  type: string;
  startAt: Date;
  endAt: Date | null;
  notes: string | null;
  client: { type: string; firstName: string | null; lastName: string | null; companyName: string | null } | null;
  vehicle: { plate: string; brand: string; model: string } | null;
  assignedTo: { name: string } | null;
  clientId: string;
  vehicleId: string;
  assignedToId: string;
};

const TYPE_BADGE_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  REVISION: "info",
  REPARATION: "warning",
  CONTROLE_TECHNIQUE: "danger",
  LIVRAISON: "success",
  ESSAI: "default",
  AUTRE: "default",
};

function toDefaults(a: AppointmentWithRelations): AppointmentDefaults {
  return {
    title: a.title,
    type: a.type,
    startAt: formatDateTimeInput(a.startAt),
    endAt: a.endAt ? formatDateTimeInput(a.endAt) : "",
    clientId: "",
    vehicleId: "",
    assignedToId: "",
    notes: a.notes ?? "",
  };
}

export function WeeklyPlanner({
  days,
  appointmentsByDay,
  clients,
  vehicles,
  users,
}: {
  days: { date: Date; label: string }[];
  appointmentsByDay: Record<string, AppointmentWithRelations[]>;
  clients: { id: string; label: string }[];
  vehicles: { id: string; label: string }[];
  users: { id: string; name: string }[];
}) {
  const [mode, setMode] = useState<{ type: "closed" } | { type: "create"; date?: Date } | { type: "edit"; id: string }>({
    type: "closed",
  });

  const today = new Date();

  function openCreate(date?: Date) {
    setMode({ type: "create", date });
  }

  function openEdit(id: string) {
    setMode({ type: "edit", id });
  }

  function close() {
    setMode({ type: "closed" });
  }

  let editingAppointment: AppointmentWithRelations | null = null;
  if (mode.type === "edit") {
    for (const list of Object.values(appointmentsByDay)) {
      const found = list.find((a) => a.id === mode.id);
      if (found) {
        editingAppointment = found;
        break;
      }
    }
  }

  return (
    <div className="space-y-4">
      <Button size="sm" onClick={() => openCreate()}>
        Nouveau rendez-vous
      </Button>

      {mode.type === "create" && (
        <AppointmentForm
          action={createAppointment}
          defaults={{
            ...emptyAppointmentDefaults,
            startAt: formatDateTimeInput(mode.date ?? new Date()),
          }}
          clients={clients}
          vehicles={vehicles}
          users={users}
          onSaved={close}
          onCancel={close}
          submitLabel="Créer le rendez-vous"
        />
      )}

      {mode.type === "edit" && editingAppointment && (
        <AppointmentForm
          action={updateAppointment.bind(null, editingAppointment.id)}
          defaults={{
            ...toDefaults(editingAppointment),
            clientId: editingAppointment.clientId,
            vehicleId: editingAppointment.vehicleId,
            assignedToId: editingAppointment.assignedToId,
          }}
          clients={clients}
          vehicles={vehicles}
          users={users}
          onSaved={close}
          onCancel={close}
          submitLabel="Enregistrer les modifications"
        />
      )}

      <div className="grid grid-cols-7 gap-3">
        {days.map(({ date, label }) => {
          const key = toWeekParam(date);
          const dayAppointments = (appointmentsByDay[key] ?? []).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
          const isToday = isSameDay(date, today);

          return (
            <div key={key} className={`rounded-lg border p-2 ${isToday ? "border-brand-400 bg-brand-50/30" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                  <p className="text-[11px] text-slate-400">
                    {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0))}
                  className="text-xs text-brand-600 hover:text-brand-800"
                  aria-label={`Nouveau rendez-vous le ${label}`}
                >
                  +
                </button>
              </div>

              <div className="space-y-1.5">
                {dayAppointments.map((a) => (
                  <div key={a.id} className="rounded-md border border-slate-200 bg-slate-50 p-1.5 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-slate-800">{formatTime(a.startAt)}</span>
                      <Badge variant={TYPE_BADGE_VARIANT[a.type]} className="text-[10px]">
                        {APPOINTMENT_TYPE_LABELS[a.type]}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-900 mt-0.5">{a.title}</p>
                    {a.client && <p className="text-slate-500">{clientDisplayName(a.client)}</p>}
                    {a.vehicle && (
                      <p className="text-slate-500">
                        {a.vehicle.plate} — {a.vehicle.brand} {a.vehicle.model}
                      </p>
                    )}
                    {a.assignedTo && <p className="text-slate-500">👤 {a.assignedTo.name}</p>}
                    <div className="flex gap-2 mt-1">
                      <button type="button" onClick={() => openEdit(a.id)} className="text-brand-600 hover:underline">
                        Modifier
                      </button>
                      <ConfirmSubmitButton
                        action={deleteAppointment.bind(null, a.id)}
                        confirmMessage="Supprimer ce rendez-vous ?"
                        label="Suppr."
                        variant="destructive"
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
                {dayAppointments.length === 0 && <p className="text-[11px] text-slate-300">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
