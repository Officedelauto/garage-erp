"use client";

import { useState } from "react";
import { REGIONAL_CV_RATES, FIXED_REGISTRATION_FEES } from "@/lib/regional-tax-rates";
import { Input, Label, Select } from "@/components/ui/input";
import { formatEur } from "@/lib/utils";

export function CarteGriseSimulator({ fiscalHorsepower }: { fiscalHorsepower: number | null }) {
  const regions = Object.keys(REGIONAL_CV_RATES);
  const [region, setRegion] = useState(regions[0]);
  const [ratePerCv, setRatePerCv] = useState<string>(
    REGIONAL_CV_RATES[regions[0]] != null ? String(REGIONAL_CV_RATES[regions[0]]) : ""
  );
  const [cv, setCv] = useState<string>(fiscalHorsepower != null ? String(fiscalHorsepower) : "");

  function handleRegionChange(value: string) {
    setRegion(value);
    const defaultRate = REGIONAL_CV_RATES[value];
    setRatePerCv(defaultRate != null ? String(defaultRate) : "");
  }

  const rateNumber = Number(ratePerCv);
  const cvNumber = Number(cv);
  const hasInputs = ratePerCv !== "" && cv !== "" && !Number.isNaN(rateNumber) && !Number.isNaN(cvNumber);
  const regionalTax = hasInputs ? rateNumber * cvNumber : null;
  const total = regionalTax != null ? regionalTax + FIXED_REGISTRATION_FEES : null;

  return (
    <div className="rounded-md border border-slate-200 p-3 space-y-3 max-w-2xl">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="cgRegion">Région</Label>
          <Select id="cgRegion" value={region} onChange={(e) => handleRegionChange(e.target.value)}>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cgRate">Tarif au CV (€)</Label>
          <Input
            id="cgRate"
            type="number"
            step="0.01"
            value={ratePerCv}
            onChange={(e) => setRatePerCv(e.target.value)}
            placeholder="à renseigner"
          />
        </div>
        <div>
          <Label htmlFor="cgCv">Puissance fiscale (CV)</Label>
          <Input id="cgCv" type="number" value={cv} onChange={(e) => setCv(e.target.value)} />
        </div>
      </div>

      {total != null ? (
        <div className="text-sm space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Taxe régionale ({cvNumber} CV × {formatEur(rateNumber)})</span>
            <span>{formatEur(regionalTax!)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Frais fixes (gestion + acheminement)</span>
            <span>{formatEur(FIXED_REGISTRATION_FEES)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
            <span>Total estimé</span>
            <span>{formatEur(total)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Renseignez le tarif régional et la puissance fiscale pour estimer le coût.</p>
      )}

      <p className="text-xs text-slate-400">
        Estimation à titre indicatif (hors malus écologique éventuel et hors exonérations véhicules propres, qui
        varient selon la région). Les tarifs régionaux changent chaque année : vérifiez le montant exact en vigueur
        avant de facturer.
      </p>
    </div>
  );
}
