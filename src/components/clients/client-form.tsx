"use client";

import { useActionState, useState } from "react";
import type { ClientFormState } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

type ClientDefaults = {
  type: "PARTICULIER" | "PROFESSIONNEL";
  firstName: string;
  lastName: string;
  companyName: string;
  siret: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  notes: string;
};

const emptyDefaults: ClientDefaults = {
  type: "PARTICULIER",
  firstName: "",
  lastName: "",
  companyName: "",
  siret: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  city: "",
  notes: "",
};

export function ClientForm({
  action,
  defaults = emptyDefaults,
  submitLabel = "Enregistrer",
}: {
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  defaults?: Partial<ClientDefaults>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<"PARTICULIER" | "PROFESSIONNEL">(defaults.type ?? "PARTICULIER");
  const d = { ...emptyDefaults, ...defaults };

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="type">Type de client</Label>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "PARTICULIER" | "PROFESSIONNEL")}
        >
          <option value="PARTICULIER">Particulier</option>
          <option value="PROFESSIONNEL">Professionnel</option>
        </Select>
      </div>

      {type === "PARTICULIER" ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" defaultValue={d.firstName} />
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" defaultValue={d.lastName} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Raison sociale</Label>
            <Input id="companyName" name="companyName" defaultValue={d.companyName} />
          </div>
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <Input id="siret" name="siret" defaultValue={d.siret} />
          </div>
          <div>
            <Label htmlFor="firstName">Contact - Prénom</Label>
            <Input id="firstName" name="firstName" defaultValue={d.firstName} />
          </div>
          <div>
            <Label htmlFor="lastName">Contact - Nom</Label>
            <Input id="lastName" name="lastName" defaultValue={d.lastName} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={d.email} />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" defaultValue={d.phone} />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" name="address" defaultValue={d.address} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Code postal</Label>
          <Input id="postalCode" name="postalCode" defaultValue={d.postalCode} />
        </div>
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" defaultValue={d.city} />
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
