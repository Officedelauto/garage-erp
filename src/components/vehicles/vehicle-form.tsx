"use client";

import { useActionState } from "react";
import type { VehicleFormState } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { VEHICLE_OPTIONS } from "@/lib/vehicle-options";

export type VehicleDefaults = {
  clientId: string;
  plate: string;
  stockNumber: string;
  brand: string;
  model: string;
  color: string;
  vin: string;
  firstRegistrationDate: string;
  technicalInspectionDate: string;
  fiscalHorsepower: string;
  mileage: string;
  fuelType: string;
  purchasePrice: string;
  salePrice: string;
  options: string[];
  notes: string;
};

const emptyDefaults: VehicleDefaults = {
  clientId: "",
  plate: "",
  stockNumber: "",
  brand: "",
  model: "",
  color: "",
  vin: "",
  firstRegistrationDate: "",
  technicalInspectionDate: "",
  fiscalHorsepower: "",
  mileage: "",
  fuelType: "AUTRE",
  purchasePrice: "",
  salePrice: "",
  options: [],
  notes: "",
};

const FUEL_LABELS: Record<string, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
  AUTRE: "Autre",
};

export function VehicleForm({
  action,
  clients,
  defaults = emptyDefaults,
  submitLabel = "Enregistrer",
}: {
  action: (state: VehicleFormState, formData: FormData) => Promise<VehicleFormState>;
  clients: { id: string; label: string }[];
  defaults?: Partial<VehicleDefaults>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const d = { ...emptyDefaults, ...defaults };

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="clientId">Client (optionnel)</Label>
        <Select id="clientId" name="clientId" defaultValue={d.clientId}>
          <option value="">Aucun — véhicule en stock</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plate">Immatriculation</Label>
          <Input id="plate" name="plate" defaultValue={d.plate} required className="uppercase" />
        </div>
        <div>
          <Label htmlFor="stockNumber">N° VO (stock)</Label>
          <Input id="stockNumber" name="stockNumber" defaultValue={d.stockNumber} />
        </div>
        <div>
          <Label htmlFor="brand">Marque</Label>
          <Input id="brand" name="brand" defaultValue={d.brand} required />
        </div>
        <div>
          <Label htmlFor="model">Modèle</Label>
          <Input id="model" name="model" defaultValue={d.model} required />
        </div>
        <div>
          <Label htmlFor="color">Couleur</Label>
          <Input id="color" name="color" defaultValue={d.color} />
        </div>
        <div>
          <Label htmlFor="vin">VIN (n° de série)</Label>
          <Input id="vin" name="vin" defaultValue={d.vin} />
        </div>
        <div>
          <Label htmlFor="firstRegistrationDate">1ère mise en circulation</Label>
          <Input id="firstRegistrationDate" name="firstRegistrationDate" type="date" defaultValue={d.firstRegistrationDate} />
        </div>
        <div>
          <Label htmlFor="technicalInspectionDate">Date du dernier contrôle technique</Label>
          <Input
            id="technicalInspectionDate"
            name="technicalInspectionDate"
            type="date"
            defaultValue={d.technicalInspectionDate}
          />
        </div>
        <div>
          <Label htmlFor="fiscalHorsepower">Puissance fiscale (CV)</Label>
          <Input id="fiscalHorsepower" name="fiscalHorsepower" type="number" defaultValue={d.fiscalHorsepower} />
        </div>
        <div>
          <Label htmlFor="mileage">Kilométrage</Label>
          <Input id="mileage" name="mileage" type="number" defaultValue={d.mileage} />
        </div>
        <div>
          <Label htmlFor="fuelType">Carburant</Label>
          <Select id="fuelType" name="fuelType" defaultValue={d.fuelType}>
            {Object.entries(FUEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-md bg-slate-50 p-3">
        <div>
          <Label htmlFor="purchasePrice">Prix d&apos;achat (€)</Label>
          <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={d.purchasePrice} />
        </div>
        <div>
          <Label htmlFor="salePrice">Prix de vente (€)</Label>
          <Input id="salePrice" name="salePrice" type="number" step="0.01" defaultValue={d.salePrice} />
        </div>
      </div>

      <div>
        <Label>Options et équipements</Label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md border border-slate-200 p-3 sm:grid-cols-3">
          {VEHICLE_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="options"
                value={option}
                defaultChecked={d.options.includes(option)}
                className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400"
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={d.notes} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : submitLabel}
      </Button>
    </form>
  );
}
