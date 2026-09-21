import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { DocumentPdf, type DocumentPdfProps } from "@/lib/pdf/document-pdf";
import type { DocumentKind } from "@/generated/prisma/enums";

export async function renderDocumentPdf(id: string, expectedKind: DocumentKind) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: { client: true, vehicle: true, lines: { orderBy: { position: "asc" } } },
  });

  if (!document || document.kind !== expectedKind) return null;
  if (!document.number || !document.companySnapshot) return null;

  const company = document.companySnapshot as DocumentPdfProps["company"];

  const props: DocumentPdfProps = {
    kind: document.kind,
    number: document.number,
    issueDate: document.issueDate,
    dueDate: document.dueDate,
    company,
    client: document.client,
    vehicle: document.vehicle,
    lines: document.lines.map((l) => ({
      id: l.id,
      type: l.type,
      description: l.description,
      quantity: l.quantity.toString(),
      unitPriceHT: l.unitPriceHT.toString(),
      vatRate: l.vatRate.toString(),
    })),
    totalHT: document.totalHT.toString(),
    totalTVA: document.totalTVA.toString(),
    totalTTC: document.totalTTC.toString(),
  };

  const buffer = await renderToBuffer(DocumentPdf(props));
  return { buffer, number: document.number };
}
