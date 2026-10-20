"use client";

import { useActionState, useState } from "react";
import type { AppointmentFormState } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  REVISION: "Révision",
  REPARATION: "Réparation",
  CONTROLE_TECHNIQUE: "Contrôle technique",
  LIVRAISON: "Livraison",
  ESSAI: "Essai",
  AUTRE: "Autre",
};

export type AppointmentDefaults = {
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  clientId: string;
  vehicleId: string;
  assignedToId: string;
  notes: string;
};

export const emptyAppointmentDefaults: AppointmentDefaults = {
  title: "",
  type: "AUTRE",
  startAt: "",
  endAt: "",
  clientId: "",
  vehicleId: "",
  assignedToId: "",
  notes: "",
};

export function AppointmentForm({
  action,
  defaults,
  clients,
  vehicles,
  users,
  onSaved,
  onCancel,
  submitLabel = "Enregistrer",
}: {
  action: (state: AppointmentFormState, formData: FormData) => Promise<AppointmentFormState>;
  defaults: AppointmentDefaults;
  clients: { id: string; label: string }[];
  vehicles: { id: string; label: string }[];
  users: { id: string; name: string }[];
  onSaved: () => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [handled, setHandled] = useState(false);

  if (state?.success && !handled) {
    setHandled(true);
    onSaved();
  }

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-brand-200 bg-brand-50/40 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="ap-title">Titre</Label>
          <Input id="ap-title" name="title" defaultValue={defaults.title} required placeholder="Ex : Vidange + révision" />
        </div>
        <div>
          <Label htmlFor="ap-type">Type</Label>
          <Select id="ap-type" name="type" defaultValue={defaults.type}>
            {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ap-assignedTo">Assigné à</Label>
          <Select id="ap-assignedTo" name="assignedToId" defaultValue={defaults.assignedToId}>
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ap-startAt">Début</Label>
          <Input id="ap-startAt" name="startAt" type="datetime-local" defaultValue={defaults.startAt} required />
        </div>
        <div>
          <Label htmlFor="ap-endAt">Fin (optionnel)</Label>
          <Input id="ap-endAt" name="endAt" type="datetime-local" defaultValue={defaults.endAt} />
        </div>
        <div>
          <Label htmlFor="ap-client">Client (optionnel)</Label>
          <Select id="ap-client" name="clientId" defaultValue={defaults.clientId}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ap-vehicle">Véhicule (optionnel)</Label>
          <Select id="ap-vehicle" name="vehicleId" defaultValue={defaults.vehicleId}>
            <option value="">—</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-2">
          <Label htmlFor="ap-notes">Notes</Label>
          <Textarea id="ap-notes" name="notes" defaultValue={defaults.notes} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Enregistrement..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
