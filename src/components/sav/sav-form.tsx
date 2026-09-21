"use client";

import { useActionState, useMemo, useState } from "react";
import { generateSavMessage } from "@/lib/actions/sav";
import { SAV_MESSAGE_TYPE_OPTIONS } from "@/lib/sav-message-types";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";

export function SavForm({
  clients,
  vehicles,
}: {
  clients: { id: string; label: string }[];
  vehicles: { id: string; clientId: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(generateSavMessage, undefined);
  const [clientId, setClientId] = useState("");
  const [copied, setCopied] = useState(false);

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => !clientId || v.clientId === clientId),
    [vehicles, clientId]
  );

  async function copyToClipboard() {
    if (!state?.message) return;
    try {
      await navigator.clipboard.writeText(state.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponible, tant pis
    }
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="messageType">Type de message</Label>
          <Select id="messageType" name="messageType" defaultValue="CLIENT_RESPONSE">
            {SAV_MESSAGE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientId">Client (optionnel)</Label>
            <Select id="clientId" name="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Aucun</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="vehicleId">Véhicule (optionnel)</Label>
            <Select id="vehicleId" name="vehicleId">
              <option value="">Aucun</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="problemDescription">Problème signalé</Label>
          <Textarea
            id="problemDescription"
            name="problemDescription"
            rows={8}
            placeholder="Colle ici le message du client, ou décris le problème en quelques mots..."
            required
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Génération..." : "Générer le message"}
        </Button>
      </form>

      <div>
        <Label>Message généré</Label>
        <div className="rounded-md border border-slate-200 bg-white p-4 min-h-[280px] whitespace-pre-wrap text-sm text-slate-800">
          {pending ? (
            <span className="text-slate-400">Génération en cours...</span>
          ) : state?.message ? (
            state.message
          ) : (
            <span className="text-slate-400">Le message généré apparaîtra ici.</span>
          )}
        </div>
        {state?.message && (
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={copyToClipboard}>
            {copied ? "Copié !" : "Copier"}
          </Button>
        )}
      </div>
    </div>
  );
}
