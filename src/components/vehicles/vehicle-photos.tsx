"use client";

import { useActionState, useRef } from "react";
import { uploadVehiclePhoto, setPrimaryPhoto, deleteVehiclePhoto } from "@/lib/actions/vehicle-photos";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { cn } from "@/lib/utils";

type Photo = { id: string; url: string; isPrimary: boolean };

export function VehiclePhotos({ vehicleId, photos }: { vehicleId: string; photos: Photo[] }) {
  const boundUpload = uploadVehiclePhoto.bind(null, vehicleId);
  const [state, formAction, pending] = useActionState(boundUpload, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {photos.map((photo) => {
            const boundSetPrimary = setPrimaryPhoto.bind(null, vehicleId, photo.id);
            const boundDelete = deleteVehiclePhoto.bind(null, photo.id);
            return (
              <div key={photo.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="Photo du véhicule"
                  className={cn(
                    "h-28 w-full rounded-lg object-cover border",
                    photo.isPrimary ? "border-brand-500 ring-2 ring-brand-200" : "border-ink-900/10"
                  )}
                />
                {photo.isPrimary && (
                  <span className="absolute top-1 left-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Principale
                  </span>
                )}
                <div className="mt-1 flex gap-1">
                  {!photo.isPrimary && (
                    <form action={boundSetPrimary}>
                      <Button type="submit" variant="outline" size="sm" className="text-[11px] px-1.5 py-0.5 h-auto">
                        Définir
                      </Button>
                    </form>
                  )}
                  <ConfirmSubmitButton
                    action={boundDelete}
                    confirmMessage="Supprimer cette photo ?"
                    label="Suppr."
                    variant="destructive"
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-ink-900/5 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-ink-900/10"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Envoi..." : "Ajouter une photo"}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
