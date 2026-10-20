"use client";

import { useActionState, useState } from "react";
import { createClientQuick } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

// Pas de <form> ici : ce composant est utilisé à l'intérieur du <form> global du
// devis/facture, et des <form> imbriqués ne sont pas valides en HTML (le navigateur
// aplatit la structure, ce qui casse la soumission). On déclenche donc l'action serveur
// à la main via le dispatcher de useActionState plutôt que via la soumission d'un formulaire.
export function ClientQuickCreate({
  onCreated,
  onCancel,
}: {
  onCreated: (client: { id: string; label: string }) => void;
  onCancel: () => void;
}) {
  const [state, dispatch, pending] = useActionState(createClientQuick, undefined);
  const [type, setType] = useState("PARTICULIER");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [handled, setHandled] = useState(false);

  if (state?.client && !handled) {
    setHandled(true);
    onCreated(state.client);
  }

  function handleSubmit() {
    const formData = new FormData();
    formData.set("type", type);
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("companyName", companyName);
    formData.set("phone", phone);
    formData.set("email", email);
    dispatch(formData);
  }

  return (
    <div className="rounded-md border border-brand-200 bg-brand-50/40 p-3 space-y-2">
      <Select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="PARTICULIER">Particulier</option>
        <option value="PROFESSIONNEL">Professionnel</option>
      </Select>
      {type === "PARTICULIER" ? (
        <div className="grid grid-cols-2 gap-2">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" />
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" />
        </div>
      ) : (
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Raison sociale" />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={handleSubmit}>
          {pending ? "Création..." : "Créer et sélectionner"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
