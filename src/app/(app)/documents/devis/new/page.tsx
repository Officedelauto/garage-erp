import { DocumentForm } from "@/components/documents/document-form";
import { createDraftDocument } from "@/lib/actions/documents";
import { getDocumentFormOptions } from "@/lib/documents-options";

export default async function NewQuotePage() {
  const options = await getDocumentFormOptions();
  const action = createDraftDocument.bind(null, "QUOTE");

  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-ink-900 mb-4">Nouveau devis</h1>
      <DocumentForm action={action} {...options} submitLabel="Créer le devis" />
    </div>
  );
}
