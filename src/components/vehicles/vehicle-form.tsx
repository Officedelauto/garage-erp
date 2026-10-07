"use client";

import { useActionState, useState } from "react";
import type { VehicleFormState } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { VEHICLE_OPTIONS } from "@/lib/vehicle-options";
import { VEHICLE_COLORS } from "@/lib/vehicle-colors";

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
  co2Emissions: string;
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
  co2Emissions: "",
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

  const colorOptions = d.color && !(VEHICLE_COLORS as readonly string[]).includes(d.color) ? [d.color, ...VEHICLE_COLORS] : VEHICLE_COLORS;

  const [customOptions, setCustomOptions] = useState<string[]>(
    d.options.filter((o) => !(VEHICLE_OPTIONS as readonly string[]).includes(o))
  );
  const [customOptionInput, setCustomOptionInput] = useState("");

  function addCustomOption() {
    const value = customOptionInput.trim();
    if (value && !customOptions.includes(value)) {
      setCustomOptions((prev) => [...prev, value]);
    }
    setCustomOptionInput("");
  }

  function removeCustomOption(value: string) {
    setCustomOptions((prev) => prev.filter((o) => o !== value));
  }

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
          <Select id="color" name="color" defaultValue={d.color}>
            <option value="">—</option>
            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </Select>
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
          <Label htmlFor="co2Emissions">Émissions de CO2 (g/km)</Label>
          <Input id="co2Emissions" name="co2Emissions" type="number" defaultValue={d.co2Emissions} />
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

        <div className="mt-3">
          <Label htmlFor="customOptionInput">Ajouter une option personnalisée</Label>
          <div className="flex gap-2">
            <Input
              id="customOptionInput"
              value={customOptionInput}
              onChange={(e) => setCustomOptionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomOption();
                }
              }}
              placeholder="Ex : Caméra 360°, Sièges massants..."
            />
            <Button type="button" variant="outline" size="sm" onClick={addCustomOption}>
              Ajouter
            </Button>
          </div>
          {customOptions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {customOptions.map((option) => (
                <span
                  key={option}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-800"
                >
                  {option}
                  <input type="hidden" name="options" value={option} />
                  <button
                    type="button"
                    onClick={() => removeCustomOption(option)}
                    className="text-brand-600 hover:text-brand-900"
                    aria-label={`Retirer ${option}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
