import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { DocumentForm } from "@/components/documents/document-form";
import { DocumentView } from "@/components/documents/document-view";
import { StatusBadge } from "@/components/documents/status-badge";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { updateDraftDocument, finalizeDocument, deleteDraftDocument, cancelDocument } from "@/lib/actions/documents";
import { getDocumentFormOptions } from "@/lib/documents-options";
import { Button } from "@/components/ui/button";

export default async function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: { client: true, vehicle: true, lines: true },
  });
  if (!document || document.kind !== "CREDIT_NOTE") notFound();

  const boundFinalize = finalizeDocument.bind(null, document.id);
  const boundDelete = deleteDraftDocument.bind(null, document.id);
  const boundCancel = cancelDocument.bind(null, document.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold text-ink-900">
          Avoir {document.number ?? "(brouillon)"}
        </h1>
        <div className="flex items-center gap-2">
          <StatusBadge status={document.status} />
          {document.status === "DRAFT" && (
            <>
              <ConfirmSubmitButton
                action={boundFinalize}
                confirmMessage="Finaliser cet avoir ? Un numéro définitif sera attribué et il ne sera plus modifiable. Les pièces liées seront réintégrées au stock."
                label="Finaliser"
              />
              <ConfirmSubmitButton
                action={boundDelete}
                confirmMessage="Supprimer ce brouillon d'avoir ?"
                label="Supprimer"
                variant="destructive"
              />
            </>
          )}
          {document.status !== "DRAFT" && document.status !== "CANCELLED" && (
            <>
              <Link href={`/documents/avoirs/${document.id}/pdf`} target="_blank">
                <Button variant="outline" size="sm">
                  PDF
                </Button>
              </Link>
              <ConfirmSubmitButton
                action={boundCancel}
                confirmMessage="Annuler cet avoir ? Les pièces liées seront ressorties du stock."
                label="Annuler"
                variant="destructive"
              />
            </>
          )}
        </div>
      </div>

      {document.status === "DRAFT" ? (
        <DocumentFormEditor documentId={document.id} />
      ) : (
        <DocumentView document={document} />
      )}
    </div>
  );
}

async function DocumentFormEditor({ documentId }: { documentId: string }) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { lines: true },
  });
  if (!document) return null;

  const options = await getDocumentFormOptions();
  const boundUpdate = updateDraftDocument.bind(null, documentId);

  return (
    <DocumentForm
      action={boundUpdate}
      {...options}
      defaults={{
        clientId: document.clientId,
        vehicleId: document.vehicleId ?? undefined,
        notes: document.notes ?? undefined,
        lines: document.lines.map((l) => ({
          key: l.id,
          type: l.type,
          description: l.description,
          stockItemId: l.stockItemId ?? "",
          vehicleId: l.vehicleId ?? "",
          quantity: l.quantity.toString(),
          unitPriceHT: l.unitPriceHT.toString(),
          vatRate: l.vatRate.toString(),
        })),
      }}
      submitLabel="Enregistrer les modifications"
    />
  );
}
