"use client";

import { useActionState, useState } from "react";
import { createServiceItem, updateServiceItem, deleteServiceItem } from "@/lib/actions/service-items";
import type { ServiceItemFormState } from "@/lib/actions/service-items";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { formatEur } from "@/lib/utils";

type ServiceItem = {
  id: string;
  name: string;
  description: string | null;
  priceHT: string;
  vatRate: string;
};

function AddForm() {
  const [state, formAction, pending] = useActionState<ServiceItemFormState, FormData>(createServiceItem, undefined);
  const [formVersion, setFormVersion] = useState(0);
  const [lastHandledState, setLastHandledState] = useState<ServiceItemFormState>(undefined);

  if (state?.success && state !== lastHandledState) {
    setLastHandledState(state);
    setFormVersion((v) => v + 1);
  }

  return (
    <form
      key={formVersion}
      action={formAction}
      className="grid grid-cols-5 gap-2 items-end rounded-md border border-slate-200 bg-slate-50 p-3"
    >
      <div className="col-span-2">
        <Label htmlFor="new-name">Nom</Label>
        <Input id="new-name" name="name" placeholder="Ex : Main d'œuvre (1h)" required />
      </div>
      <div>
        <Label htmlFor="new-priceHT">Prix HT (€)</Label>
        <Input id="new-priceHT" name="priceHT" type="number" step="0.01" required />
      </div>
      <div>
        <Label htmlFor="new-vatRate">TVA (%)</Label>
        <Input id="new-vatRate" name="vatRate" type="number" step="0.01" defaultValue="20" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Ajout..." : "Ajouter"}
      </Button>
      {state?.error && <p className="col-span-5 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

function EditRow({ item, onDone }: { item: ServiceItem; onDone: () => void }) {
  const boundUpdate = updateServiceItem.bind(null, item.id);
  const [state, formAction, pending] = useActionState<ServiceItemFormState, FormData>(boundUpdate, undefined);
  const [handled, setHandled] = useState(false);

  if (state?.success && !handled) {
    setHandled(true);
    onDone();
  }

  return (
    <tr className="bg-brand-50/40">
      <td colSpan={4} className="px-2 py-2">
        <form action={formAction} className="grid grid-cols-5 gap-2 items-end">
          <div className="col-span-2">
            <Input name="name" defaultValue={item.name} required />
          </div>
          <div>
            <Input name="priceHT" type="number" step="0.01" defaultValue={item.priceHT} required />
          </div>
          <div>
            <Input name="vatRate" type="number" step="0.01" defaultValue={item.vatRate} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "..." : "OK"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onDone}>
              Annuler
            </Button>
          </div>
          {state?.error && <p className="col-span-5 text-sm text-red-600">{state.error}</p>}
        </form>
      </td>
    </tr>
  );
}

export function ServiceItemsManager({ items }: { items: ServiceItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <AddForm />

      <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Nom</th>
              <th className="px-3 py-2 font-medium">Prix HT</th>
              <th className="px-3 py-2 font-medium">TVA</th>
              <th className="px-3 py-2 w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) =>
              editingId === item.id ? (
                <EditRow key={item.id} item={item} onDone={() => setEditingId(null)} />
              ) : (
                <tr key={item.id} className="hover:bg-brand-50/40">
                  <td className="px-3 py-2 font-medium text-slate-900">{item.name}</td>
                  <td className="px-3 py-2 text-slate-600">{formatEur(item.priceHT)}</td>
                  <td className="px-3 py-2 text-slate-600">{item.vatRate}%</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingId(item.id)} className="text-brand-600 hover:underline">
                        Modifier
                      </button>
                      <ConfirmSubmitButton
                        action={deleteServiceItem.bind(null, item.id)}
                        confirmMessage="Supprimer cet article ?"
                        label="Suppr."
                        variant="destructive"
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              )
            )}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                  Aucun article ou prestation pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
