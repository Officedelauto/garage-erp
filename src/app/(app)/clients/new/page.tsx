import { ClientForm } from "@/components/clients/client-form";
import { createClient } from "@/lib/actions/clients";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Nouveau client</h1>
      <ClientForm action={createClient} submitLabel="Créer le client" />
    </div>
  );
}
