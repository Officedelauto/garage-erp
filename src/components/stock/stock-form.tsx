"use client";

import { useActionState } from "react";
import type { StockFormState } from "@/lib/actions/stock";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type StockDefaults = {
  reference: string;
  name: string;
  description: string;
  purchasePriceHT: string;
  salePriceHT: string;
  vatRate: string;
  quantity: string;
  alertThreshold: string;
  unit: string;
};

const emptyDefaults: StockDefaults = {
  reference: "",
  name: "",
  description: "",
  purchasePriceHT: "",
  salePriceHT: "",
  vatRate: "20",
  quantity: "0",
  alertThreshold: "1",
  unit: "unité",
};

export function StockForm({
  action,
  defaults = emptyDefaults,
  submitLabel = "Enregistrer",
}: {
  action: (state: StockFormState, formData: FormData) => Promise<StockFormState>;
  defaults?: Partial<StockDefaults>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const d = { ...emptyDefaults, ...defaults };

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reference">Référence</Label>
          <Input id="reference" name="reference" defaultValue={d.reference} required />
        </div>
        <div>
          <Label htmlFor="name">Nom de la pièce</Label>
          <Input id="name" name="name" defaultValue={d.name} required />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={d.description} />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-md bg-slate-50 p-3">
        <div>
          <Label htmlFor="purchasePriceHT">Prix d&apos;achat HT (€)</Label>
          <Input id="purchasePriceHT" name="purchasePriceHT" type="number" step="0.01" defaultValue={d.purchasePriceHT} required />
        </div>
        <div>
          <Label htmlFor="salePriceHT">Prix de vente HT (€)</Label>
          <Input id="salePriceHT" name="salePriceHT" type="number" step="0.01" defaultValue={d.salePriceHT} required />
        </div>
        <div>
          <Label htmlFor="vatRate">TVA (%)</Label>
          <Input id="vatRate" name="vatRate" type="number" step="0.01" defaultValue={d.vatRate} />
        </div>
        <div>
          <Label htmlFor="unit">Unité</Label>
          <Input id="unit" name="unit" defaultValue={d.unit} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantité en stock</Label>
          <Input id="quantity" name="quantity" type="number" defaultValue={d.quantity} />
        </div>
        <div>
          <Label htmlFor="alertThreshold">Seuil d&apos;alerte</Label>
          <Input id="alertThreshold" name="alertThreshold" type="number" defaultValue={d.alertThreshold} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : submitLabel}
      </Button>
    </form>
  );
}
