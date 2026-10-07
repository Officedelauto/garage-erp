"use client";

import { useActionState, useState } from "react";
import { generateVehicleListing, saveVehicleListing } from "@/lib/actions/vehicle-listing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function VehicleListing({ vehicleId, adCopy }: { vehicleId: string; adCopy: string | null }) {
  const boundGenerate = generateVehicleListing.bind(null, vehicleId);
  const [state, formAction, pending] = useActionState(boundGenerate, undefined);
  const [text, setText] = useState(adCopy ?? "");
  const [copied, setCopied] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | undefined>(undefined);

  if (state?.adCopy && state.adCopy !== lastGenerated) {
    setLastGenerated(state.adCopy);
    setText(state.adCopy);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard indisponible, pas bloquant
    }
  }

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Génération..." : text ? "Régénérer l'annonce avec l'IA" : "Générer une annonce avec l'IA"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {(text || pending) && (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="L'annonce générée apparaîtra ici, vous pouvez la modifier avant de l'enregistrer."
          />
          <div className="flex gap-2">
            <form
              action={(formData) => {
                saveVehicleListing(vehicleId, formData);
              }}
            >
              <input type="hidden" name="adCopy" value={text} />
              <Button type="submit" size="sm">
                Enregistrer
              </Button>
            </form>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "Copié !" : "Copier"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
