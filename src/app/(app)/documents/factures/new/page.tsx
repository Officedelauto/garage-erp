import { DocumentForm } from "@/components/documents/document-form";
import { createDraftDocument } from "@/lib/actions/documents";
import { getDocumentFormOptions } from "@/lib/documents-options";

export default async function NewInvoicePage() {
  const options = await getDocumentFormOptions();
  const action = createDraftDocument.bind(null, "INVOICE");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Nouvelle facture</h1>
      <DocumentForm action={action} {...options} submitLabel="Créer la facture" />
    </div>
  );
}
