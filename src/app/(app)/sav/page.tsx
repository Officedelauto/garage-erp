import { verifySession } from "@/lib/dal";
import { getDocumentFormOptions } from "@/lib/documents-options";
import { SavForm } from "@/components/sav/sav-form";

export default async function SavPage() {
  await verifySession();
  const { clients, vehicles } = await getDocumentFormOptions();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">SAV intelligent</h1>
      <p className="text-sm text-slate-500 mb-4">
        Décris le problème signalé (ou colle le message du client) pour générer un message type prêt à envoyer.
      </p>
      <SavForm clients={clients} vehicles={vehicles} />
    </div>
  );
}
