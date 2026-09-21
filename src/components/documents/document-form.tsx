"use client";

import { useActionState, useMemo, useState } from "react";
import type { DocumentFormState } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { formatEur } from "@/lib/utils";

type LineType = "PART" | "LABOR" | "OTHER";

type Line = {
  key: string;
  type: LineType;
  description: string;
  stockItemId: string;
  quantity: string;
  unitPriceHT: string;
  vatRate: string;
};

type StockOption = { id: string; label: string; salePriceHT: string; vatRate: string };

const LINE_TYPE_LABELS: Record<LineType, string> = {
  PART: "Pièce",
  LABOR: "Main d'œuvre",
  OTHER: "Autre",
};

function emptyLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    type: "LABOR",
    description: "",
    stockItemId: "",
    quantity: "1",
    unitPriceHT: "0",
    vatRate: "20",
  };
}

export function DocumentForm({
  action,
  clients,
  vehicles,
  stockItems,
  defaults,
  submitLabel = "Enregistrer",
}: {
  action: (state: DocumentFormState, formData: FormData) => Promise<DocumentFormState>;
  clients: { id: string; label: string }[];
  vehicles: { id: string; clientId: string; label: string }[];
  stockItems: StockOption[];
  defaults?: {
    clientId?: string;
    vehicleId?: string;
    notes?: string;
    lines?: Line[];
  };
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [clientId, setClientId] = useState(defaults?.clientId ?? "");
  const [vehicleId, setVehicleId] = useState(defaults?.vehicleId ?? "");
  const [lines, setLines] = useState<Line[]>(defaults?.lines?.length ? defaults.lines : [emptyLine()]);

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => !clientId || v.clientId === clientId),
    [vehicles, clientId]
  );

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function applyStockItem(key: string, stockItemId: string) {
    const stock = stockItems.find((s) => s.id === stockItemId);
    if (!stock) {
      updateLine(key, { stockItemId: "" });
      return;
    }
    updateLine(key, {
      stockItemId,
      type: "PART",
      description: stock.label,
      unitPriceHT: stock.salePriceHT,
      vatRate: stock.vatRate,
    });
  }

  const totals = useMemo(() => {
    let totalHT = 0;
    let totalTVA = 0;
    for (const line of lines) {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unitPriceHT) || 0;
      const vat = Number(line.vatRate) || 0;
      const lineHT = qty * price;
      totalHT += lineHT;
      totalTVA += lineHT * (vat / 100);
    }
    return { totalHT, totalTVA, totalTTC: totalHT + totalTVA };
  }, [lines]);

  const linesJson = JSON.stringify(
    lines.map((l) => ({
      type: l.type,
      description: l.description,
      stockItemId: l.stockItemId || null,
      quantity: l.quantity,
      unitPriceHT: l.unitPriceHT,
      vatRate: l.vatRate,
    }))
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="linesJson" value={linesJson} />

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div>
          <Label htmlFor="clientId">Client</Label>
          <Select
            id="clientId"
            name="clientId"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setVehicleId("");
            }}
            required
          >
            <option value="" disabled>
              Sélectionner un client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="vehicleId">Véhicule (optionnel)</Label>
          <Select id="vehicleId" name="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
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
        <div className="flex items-center justify-between mb-2">
          <Label className="mb-0">Lignes</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
            Ajouter une ligne
          </Button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-2 py-2 font-medium w-28">Type</th>
                <th className="px-2 py-2 font-medium w-48">Depuis le stock</th>
                <th className="px-2 py-2 font-medium">Description</th>
                <th className="px-2 py-2 font-medium w-20">Qté</th>
                <th className="px-2 py-2 font-medium w-28">Prix HT</th>
                <th className="px-2 py-2 font-medium w-20">TVA %</th>
                <th className="px-2 py-2 font-medium w-24">Total HT</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => {
                const lineTotal = (Number(line.quantity) || 0) * (Number(line.unitPriceHT) || 0);
                return (
                  <tr key={line.key}>
                    <td className="px-2 py-1">
                      <Select
                        value={line.type}
                        onChange={(e) => updateLine(line.key, { type: e.target.value as LineType })}
                      >
                        {Object.entries(LINE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-1">
                      <Select value={line.stockItemId} onChange={(e) => applyStockItem(line.key, e.target.value)}>
                        <option value="">—</option>
                        {stockItems.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(line.key, { description: e.target.value })}
                        required
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unitPriceHT}
                        onChange={(e) => updateLine(line.key, { unitPriceHT: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={line.vatRate}
                        onChange={(e) => updateLine(line.key, { vatRate: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1 text-right text-slate-600">{formatEur(lineTotal)}</td>
                    <td className="px-2 py-1 text-center">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Supprimer la ligne"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total HT</span>
              <span>{formatEur(totals.totalHT)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TVA</span>
              <span>{formatEur(totals.totalTVA)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Total TTC</span>
              <span>{formatEur(totals.totalTTC)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <Label htmlFor="notes">Notes internes</Label>
        <Textarea id="notes" name="notes" defaultValue={defaults?.notes} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : submitLabel}
      </Button>
    </form>
  );
}
