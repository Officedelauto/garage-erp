"use client";

import { useActionState } from "react";
import { updateCompany } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type Defaults = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  siret: string;
  vatNumber: string;
  phone: string;
  email: string;
  iban: string;
  quotePrefix: string;
  invoicePrefix: string;
};

export function CompanyForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, pending] = useActionState(updateCompany, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="name">Nom de l&apos;entreprise</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required />
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" defaultValue={defaults.address} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Code postal</Label>
          <Input id="postalCode" name="postalCode" defaultValue={defaults.postalCode} required />
        </div>
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" defaultValue={defaults.city} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="siret">SIRET</Label>
          <Input id="siret" name="siret" defaultValue={defaults.siret} required />
        </div>
        <div>
          <Label htmlFor="vatNumber">N° TVA intracommunautaire</Label>
          <Input id="vatNumber" name="vatNumber" defaultValue={defaults.vatNumber} placeholder="Laisser vide si franchise en base" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" defaultValue={defaults.phone} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaults.email} />
        </div>
      </div>

      <div>
        <Label htmlFor="iban">IBAN</Label>
        <Input id="iban" name="iban" defaultValue={defaults.iban} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quotePrefix">Préfixe numérotation devis</Label>
          <Input id="quotePrefix" name="quotePrefix" defaultValue={defaults.quotePrefix} required />
        </div>
        <div>
          <Label htmlFor="invoicePrefix">Préfixe numérotation factures</Label>
          <Input id="invoicePrefix" name="invoicePrefix" defaultValue={defaults.invoicePrefix} required />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Réglages enregistrés.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
