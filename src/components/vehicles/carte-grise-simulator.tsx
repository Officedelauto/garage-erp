"use client";

import { useState } from "react";
import { DEPARTMENTS } from "@/lib/departments";
import { REGIONAL_CV_RATES, FIXED_REGISTRATION_FEES } from "@/lib/regional-tax-rates";
import { Input, Label, Select } from "@/components/ui/input";
import { formatEur, yearsSince } from "@/lib/utils";

function rateForDepartment(code: string) {
  const dept = DEPARTMENTS.find((d) => d.code === code);
  if (!dept) return null;
  return REGIONAL_CV_RATES[dept.region] ?? null;
}

export function CarteGriseSimulator({
  fiscalHorsepower,
  firstRegistrationDate,
}: {
  fiscalHorsepower: number | null;
  firstRegistrationDate: Date | string | null;
}) {
  const [departmentCode, setDepartmentCode] = useState(DEPARTMENTS[0].code);
  const [ratePerCv, setRatePerCv] = useState<string>(() => {
    const defaultRate = rateForDepartment(DEPARTMENTS[0].code);
    return defaultRate != null ? String(defaultRate) : "";
  });
  const [cv, setCv] = useState<string>(fiscalHorsepower != null ? String(fiscalHorsepower) : "");

  function handleDepartmentChange(code: string) {
    setDepartmentCode(code);
    const defaultRate = rateForDepartment(code);
    setRatePerCv(defaultRate != null ? String(defaultRate) : "");
  }

  const vehicleAgeYears = yearsSince(firstRegistrationDate);
  const isOverTenYears = vehicleAgeYears != null && vehicleAgeYears > 10;

  const rateNumber = Number(ratePerCv);
  const cvNumber = Number(cv);
  const hasInputs = ratePerCv !== "" && cv !== "" && !Number.isNaN(rateNumber) && !Number.isNaN(cvNumber);
  const fullRegionalTax = hasInputs ? rateNumber * cvNumber : null;
  const regionalTax = fullRegionalTax != null ? (isOverTenYears ? fullRegionalTax / 2 : fullRegionalTax) : null;
  const total = regionalTax != null ? regionalTax + FIXED_REGISTRATION_FEES : null;

  return (
    <div className="rounded-md border border-slate-200 p-3 space-y-3 max-w-2xl">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="cgDepartment">Département</Label>
          <Select id="cgDepartment" value={departmentCode} onChange={(e) => handleDepartmentChange(e.target.value)}>
            {DEPARTMENTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} - {d.name}
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

      {isOverTenYears && (
        <p className="text-xs text-brand-700 bg-brand-50 rounded px-2 py-1">
          Véhicule de plus de 10 ans : demi-tarif appliqué sur la taxe régionale.
        </p>
      )}

      {total != null ? (
        <div className="text-sm space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>
              Taxe régionale ({cvNumber} CV × {formatEur(rateNumber)}{isOverTenYears ? " ÷ 2" : ""})
            </span>
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
