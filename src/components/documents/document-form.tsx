"use client";

import { useActionState, useMemo, useState } from "react";
import type { DocumentFormState } from "@/lib/actions/documents";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { ClientQuickCreate } from "@/components/clients/client-quick-create";
import { formatEur } from "@/lib/utils";

type LineType = "PART" | "LABOR" | "VEHICLE" | "OTHER";

type Line = {
  key: string;
  type: LineType;
  description: string;
  stockItemId: string;
  vehicleId: string;
  quantity: string;
  unitPriceHT: string;
  vatRate: string;
};

type StockOption = { id: string; label: string; salePriceHT: string; vatRate: string };
type ServiceOption = { id: string; label: string; priceHT: string; vatRate: string };
type VehicleOption = { id: string; clientId: string | null; label: string; salePriceHT: string | null; sold: boolean };

const LINE_TYPE_LABELS: Record<LineType, string> = {
  PART: "Pièce",
  LABOR: "Main d'œuvre",
  VEHICLE: "Véhicule",
  OTHER: "Autre",
};

function emptyLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    type: "LABOR",
    description: "",
    stockItemId: "",
    vehicleId: "",
    quantity: "1",
    unitPriceHT: "0",
    vatRate: "20",
  };
}

const NEW_CLIENT_VALUE = "__new__";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  CARTE: "Carte bancaire",
  CHEQUE: "Chèque",
  VIREMENT: "Virement",
  AUTRE: "Autre",
};

function vehicleLine(veh: VehicleOption): Line {
  return {
    key: Math.random().toString(36).slice(2),
    type: "VEHICLE",
    description: veh.label,
    stockItemId: "",
    vehicleId: veh.id,
    quantity: "1",
    unitPriceHT: veh.salePriceHT ?? "0",
    vatRate: "0",
  };
}

export function DocumentForm({
  action,
  clients,
  vehicles,
  stockItems,
  serviceItems,
  defaults,
  prefillVehicleId,
  submitLabel = "Enregistrer",
}: {
  action: (state: DocumentFormState, formData: FormData) => Promise<DocumentFormState>;
  clients: { id: string; label: string }[];
  vehicles: VehicleOption[];
  stockItems: StockOption[];
  serviceItems: ServiceOption[];
  defaults?: {
    clientId?: string;
    vehicleId?: string;
    notes?: string;
    lines?: Line[];
    depositAmount?: string;
    depositPaymentMethod?: string;
  };
  prefillVehicleId?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [clientOptions, setClientOptions] = useState(clients);
  const [clientId, setClientId] = useState(defaults?.clientId ?? "");
  const [showClientCreate, setShowClientCreate] = useState(false);
  const [vehicleId, setVehicleId] = useState(defaults?.vehicleId ?? prefillVehicleId ?? "");
  const [lines, setLines] = useState<Line[]>(() => {
    if (defaults?.lines?.length) return defaults.lines;
    const prefillVeh = prefillVehicleId ? vehicles.find((v) => v.id === prefillVehicleId) : null;
    return prefillVeh ? [vehicleLine(prefillVeh)] : [emptyLine()];
  });

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => !clientId || v.clientId === clientId),
    [vehicles, clientId]
  );

  // Véhicules proposables comme ligne de vente : en stock (non vendus) avec un prix de vente défini.
  const saleableVehicles = useMemo(() => vehicles.filter((v) => !v.sold && v.salePriceHT != null), [vehicles]);

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
      vehicleId: "",
      type: "PART",
      description: stock.label,
      unitPriceHT: stock.salePriceHT,
      vatRate: stock.vatRate,
    });
  }

  function applyServiceItem(key: string, serviceItemId: string) {
    const service = serviceItems.find((s) => s.id === serviceItemId);
    if (!service) return;
    updateLine(key, {
      stockItemId: "",
      vehicleId: "",
      type: "LABOR",
      description: service.label,
      unitPriceHT: service.priceHT,
      vatRate: service.vatRate,
    });
  }

  function applyVehicleItem(key: string, vehId: string) {
    const veh = saleableVehicles.find((v) => v.id === vehId);
    if (!veh) {
      updateLine(key, { vehicleId: "" });
      return;
    }
    updateLine(key, {
      vehicleId: vehId,
      stockItemId: "",
      type: "VEHICLE",
      description: veh.label,
      unitPriceHT: veh.salePriceHT ?? "0",
      vatRate: "0",
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
      vehicleId: l.vehicleId || null,
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
            value={showClientCreate ? NEW_CLIENT_VALUE : clientId}
            onChange={(e) => {
              if (e.target.value === NEW_CLIENT_VALUE) {
                setShowClientCreate(true);
                return;
              }
              setClientId(e.target.value);
              setVehicleId("");
            }}
            required
          >
            <option value="" disabled>
              Sélectionner un client
            </option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            <option value={NEW_CLIENT_VALUE}>+ Nouveau client…</option>
          </Select>
          {showClientCreate && (
            <div className="mt-2">
              <ClientQuickCreate
                onCreated={(client) => {
                  setClientOptions((prev) => [...prev, client]);
                  setClientId(client.id);
                  setShowClientCreate(false);
                }}
                onCancel={() => setShowClientCreate(false)}
              />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="vehicleId">Véhicule concerné (optionnel)</Label>
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

        <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-2 py-2 font-medium w-28">Type</th>
                <th className="px-2 py-2 font-medium w-40">Pièce (stock)</th>
                <th className="px-2 py-2 font-medium w-40">Article/prestation</th>
                <th className="px-2 py-2 font-medium w-40">Véhicule à vendre</th>
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
                      <Select value="" onChange={(e) => applyServiceItem(line.key, e.target.value)}>
                        <option value="">—</option>
                        {serviceItems.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-2 py-1">
                      <Select value={line.vehicleId} onChange={(e) => applyVehicleItem(line.key, e.target.value)}>
                        <option value="">—</option>
                        {saleableVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
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
        <p className="mt-1 text-xs text-slate-400">
          Vente de véhicule : la TVA des véhicules d&apos;occasion suit souvent le régime de la marge — vérifiez le
          taux avant de finaliser.
        </p>

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

      <div className="grid grid-cols-2 gap-4 max-w-2xl rounded-md bg-slate-50 p-3">
        <div>
          <Label htmlFor="depositAmount">Acompte reçu (€, optionnel)</Label>
          <Input
            id="depositAmount"
            name="depositAmount"
            type="number"
            step="0.01"
            defaultValue={defaults?.depositAmount}
            placeholder="Ex : 500"
          />
        </div>
        <div>
          <Label htmlFor="depositPaymentMethod">Mode de paiement de l&apos;acompte</Label>
          <Select id="depositPaymentMethod" name="depositPaymentMethod" defaultValue={defaults?.depositPaymentMethod ?? ""}>
            <option value="">—</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {lines.some((l) => l.type === "VEHICLE") && (
          <p className="col-span-2 text-xs text-slate-500">
            Sur un bon de commande, un acompte renseigné ici réserve automatiquement le(s) véhicule(s) de la liste
            une fois le document finalisé.
          </p>
        )}
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
