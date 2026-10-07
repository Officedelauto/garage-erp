"use client";

import { useActionState, useRef } from "react";
import { uploadCompanyLogo, deleteCompanyLogo } from "@/lib/actions/company-logo";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";

export function CompanyLogoForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, formAction, pending] = useActionState(uploadCompanyLogo, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-40 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo de l'entreprise" className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-xs text-slate-400">Aucun logo</span>
          )}
        </div>
        {logoUrl && <ConfirmSubmitButton action={deleteCompanyLogo} confirmMessage="Supprimer le logo ?" label="Supprimer" variant="destructive" size="sm" />}
      </div>

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
          name="logo"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          required
          className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-ink-900/5 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-ink-900/10"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Envoi..." : logoUrl ? "Remplacer le logo" : "Ajouter un logo"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <p className="text-xs text-slate-400">
        Ce logo apparaît sur l&apos;affiche prix des véhicules. Formats acceptés : JPEG, PNG, WebP, SVG (4 Mo max).
      </p>
    </div>
  );
}
