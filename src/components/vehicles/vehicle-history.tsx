"use client";

import { useActionState } from "react";
import Link from "next/link";
import { addVehicleNote, deleteVehicleNote } from "@/lib/actions/vehicle-notes";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { formatDate } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  content: string;
  mileage: number | null;
  performedAt: Date | null;
  source: string;
  createdAt: Date;
};

export function VehicleHistory({ vehicleId, entries }: { vehicleId: string; entries: HistoryEntry[] }) {
  const boundAdd = addVehicleNote.bind(null, vehicleId);
  const [state, formAction, pending] = useActionState(boundAdd, undefined);

  return (
    <div className="space-y-4">
      <form action={formAction} className="rounded-xl border border-ink-900/10 bg-white p-4 space-y-3">
        <div>
          <Label htmlFor="note-content">Intervention réalisée</Label>
          <Textarea id="note-content" name="content" placeholder="Ex. Vidange + filtre à huile" required rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="note-mileage">Kilométrage</Label>
            <Input id="note-mileage" name="mileage" type="number" />
          </div>
          <div>
            <Label htmlFor="note-performedAt">Date</Label>
            <Input id="note-performedAt" name="performedAt" type="date" />
          </div>
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Ajout..." : "Ajouter au suivi"}
        </Button>
      </form>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune intervention enregistrée.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const boundDelete = deleteVehicleNote.bind(null, entry.id);
            return (
              <li key={entry.id} className="rounded-md border border-ink-900/10 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span>{formatDate(entry.performedAt ?? entry.createdAt)}</span>
                      {entry.mileage != null && <span>· {entry.mileage.toLocaleString("fr-FR")} km</span>}
                      {entry.source === "voice" && <span>· 🎙️ commande vocale</span>}
                    </div>
                    <p className="text-slate-800">{entry.content}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/vehicules/${vehicleId}/attestation/${entry.id}`} target="_blank">
                      <Button type="button" variant="outline" size="sm">
                        Attestation
                      </Button>
                    </Link>
                    <ConfirmSubmitButton
                      action={boundDelete}
                      confirmMessage="Supprimer cette intervention de l'historique ?"
                      label="Suppr."
                      variant="destructive"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
