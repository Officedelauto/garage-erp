"use client";

import { useState } from "react";
import type { VehicleFormState } from "@/lib/actions/vehicles";
import type { CarteGriseData } from "@/lib/actions/carte-grise";
import { VehicleForm, type VehicleDefaults } from "@/components/vehicles/vehicle-form";
import { CarteGriseUpload } from "@/components/vehicles/carte-grise-upload";

function toFormDefaults(data: CarteGriseData): Partial<VehicleDefaults> {
  const out: Partial<VehicleDefaults> = {};
  if (data.plate) out.plate = data.plate.toUpperCase();
  if (data.brand) out.brand = data.brand;
  if (data.model) out.model = data.model;
  if (data.vin) out.vin = data.vin;
  if (data.color) out.color = data.color;
  if (data.firstRegistrationDate) out.firstRegistrationDate = data.firstRegistrationDate;
  if (data.fiscalHorsepower != null) out.fiscalHorsepower = String(data.fiscalHorsepower);
  if (data.co2Emissions != null) out.co2Emissions = String(data.co2Emissions);
  if (data.fuelType) out.fuelType = data.fuelType;
  return out;
}

export function VehicleFormWithImport({
  action,
  clients,
  defaults: initialDefaults,
  submitLabel,
  canViewPurchaseInfo = true,
}: {
  action: (state: VehicleFormState, formData: FormData) => Promise<VehicleFormState>;
  clients: { id: string; label: string }[];
  defaults?: Partial<VehicleDefaults>;
  submitLabel?: string;
  canViewPurchaseInfo?: boolean;
}) {
  const [defaults, setDefaults] = useState(initialDefaults);
  const [version, setVersion] = useState(0);

  return (
    <div className="space-y-4">
      <CarteGriseUpload
        onExtracted={(data) => {
          setDefaults((d) => ({ ...d, ...toFormDefaults(data) }));
          setVersion((v) => v + 1);
        }}
      />
      <VehicleForm
        key={version}
        action={action}
        clients={clients}
        defaults={defaults}
        submitLabel={submitLabel}
        canViewPurchaseInfo={canViewPurchaseInfo}
      />
    </div>
  );
}
