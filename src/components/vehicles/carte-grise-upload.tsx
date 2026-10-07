"use client";

import { useActionState, useRef, useState } from "react";
import { extractCarteGrise, type CarteGriseData } from "@/lib/actions/carte-grise";
import { Button } from "@/components/ui/button";

export function CarteGriseUpload({ onExtracted }: { onExtracted: (data: CarteGriseData) => void }) {
  const [state, formAction, pending] = useActionState(extractCarteGrise, undefined);
  const [applied, setApplied] = useState<CarteGriseData | undefined>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.data && state.data !== applied) {
    setApplied(state.data);
    onExtracted(state.data);
  }

  return (
    <div className="rounded-md border border-dashed border-brand-300 bg-brand-50/40 p-3 space-y-2">
      <p className="text-sm font-medium text-slate-700">Pré-remplir depuis une carte grise</p>
      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
          formRef.current?.reset();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="file"
          name="document"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-ink-900/5 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-ink-900/10"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Analyse..." : "Analyser"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.data && !state.error && (
        <p className="text-sm text-green-700">
          Champs détectés et appliqués ci-dessous — vérifiez les informations avant d&apos;enregistrer.
        </p>
      )}
      <p className="text-xs text-slate-400">
        Prenez en photo, scannez le recto de la carte grise, ou déposez un PDF (seule la 1ère page est analysée).
        Le fichier est envoyé pour analyse mais n&apos;est pas conservé sur le serveur.
      </p>
    </div>
  );
}
