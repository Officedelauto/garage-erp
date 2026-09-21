"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import type { DocumentKind } from "@/generated/prisma/enums";

const LineSchema = z.object({
  type: z.enum(["PART", "LABOR", "OTHER"]),
  description: z.string().trim().min(1, "Description requise"),
  stockItemId: z.string().optional().nullable(),
  quantity: z.coerce.number().positive("Quantité invalide"),
  unitPriceHT: z.coerce.number().min(0, "Prix invalide"),
  vatRate: z.coerce.number().min(0, "TVA invalide"),
});

const DocumentFormSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  vehicleId: z.string().optional().nullable(),
  notes: z.string().trim().optional(),
  linesJson: z.string(),
});

export type DocumentFormState = { error?: string } | undefined;

function computeTotals(lines: z.infer<typeof LineSchema>[]) {
  let totalHT = 0;
  let totalTVA = 0;
  for (const line of lines) {
    const lineHT = line.quantity * line.unitPriceHT;
    totalHT += lineHT;
    totalTVA += lineHT * (line.vatRate / 100);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { totalHT: round(totalHT), totalTVA: round(totalTVA), totalTTC: round(totalHT + totalTVA) };
}

function parseDocumentForm(formData: FormData) {
  const parsed = DocumentFormSchema.safeParse({
    clientId: formData.get("clientId"),
    vehicleId: formData.get("vehicleId") || null,
    notes: formData.get("notes") || undefined,
    linesJson: formData.get("linesJson"),
  });
  if (!parsed.success) return { error: "Champs invalides." } as const;

  let rawLines: unknown;
  try {
    rawLines = JSON.parse(parsed.data.linesJson);
  } catch {
    return { error: "Lignes invalides." } as const;
  }

  const linesResult = z.array(LineSchema).min(1, "Ajoutez au moins une ligne.").safeParse(rawLines);
  if (!linesResult.success) {
    return { error: linesResult.error.issues[0]?.message ?? "Lignes invalides." } as const;
  }

  return { data: parsed.data, lines: linesResult.data } as const;
}

export async function createDraftDocument(
  kind: DocumentKind,
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  await verifySession();
  const parsed = parseDocumentForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const totals = computeTotals(parsed.lines);

  const document = await prisma.document.create({
    data: {
      kind,
      clientId: parsed.data.clientId,
      vehicleId: parsed.data.vehicleId || null,
      notes: parsed.data.notes || null,
      ...totals,
      lines: {
        create: parsed.lines.map((line, position) => ({
          type: line.type,
          description: line.description,
          stockItemId: line.stockItemId || null,
          quantity: line.quantity,
          unitPriceHT: line.unitPriceHT,
          vatRate: line.vatRate,
          position,
        })),
      },
    },
  });

  revalidatePath(kind === "QUOTE" ? "/documents/devis" : "/documents/factures");
  redirect(`/documents/${kind === "QUOTE" ? "devis" : "factures"}/${document.id}`);
}

export async function updateDraftDocument(
  id: string,
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  await verifySession();
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) return { error: "Document introuvable." };
  if (existing.status !== "DRAFT") return { error: "Ce document est finalisé et ne peut plus être modifié." };

  const parsed = parseDocumentForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const totals = computeTotals(parsed.lines);
  const basePath = existing.kind === "QUOTE" ? "/documents/devis" : "/documents/factures";

  await prisma.$transaction([
    prisma.documentLine.deleteMany({ where: { documentId: id } }),
    prisma.document.update({
      where: { id },
      data: {
        clientId: parsed.data.clientId,
        vehicleId: parsed.data.vehicleId || null,
        notes: parsed.data.notes || null,
        ...totals,
        lines: {
          create: parsed.lines.map((line, position) => ({
            type: line.type,
            description: line.description,
            stockItemId: line.stockItemId || null,
            quantity: line.quantity,
            unitPriceHT: line.unitPriceHT,
            vatRate: line.vatRate,
            position,
          })),
        },
      },
    }),
  ]);

  revalidatePath(basePath);
  revalidatePath(`${basePath}/${id}`);
  redirect(`${basePath}/${id}`);
}

function formatNumber(prefix: string, counter: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${counter.toString().padStart(4, "0")}`;
}

export async function finalizeDocument(id: string) {
  await verifySession();

  await prisma.$transaction(async (tx) => {
    const document = await tx.document.findUnique({ where: { id }, include: { lines: true } });
    if (!document) throw new Error("Document introuvable.");
    if (document.status !== "DRAFT") throw new Error("Ce document est déjà finalisé.");

    const company = await tx.company.findFirst();
    if (!company) throw new Error("Réglages entreprise manquants.");

    const isQuote = document.kind === "QUOTE";
    const counter = isQuote ? company.nextQuoteNumber : company.nextInvoiceNumber;
    const number = formatNumber(isQuote ? company.quotePrefix : company.invoicePrefix, counter);

    await tx.company.update({
      where: { id: company.id },
      data: isQuote ? { nextQuoteNumber: counter + 1 } : { nextInvoiceNumber: counter + 1 },
    });

    const now = new Date();
    await tx.document.update({
      where: { id },
      data: {
        number,
        status: "FINALIZED",
        issueDate: now,
        dueDate: isQuote ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        companySnapshot: {
          name: company.name,
          address: company.address,
          postalCode: company.postalCode,
          city: company.city,
          siret: company.siret,
          vatNumber: company.vatNumber,
          phone: company.phone,
          email: company.email,
          iban: company.iban,
        },
      },
    });

    if (!isQuote) {
      for (const line of document.lines) {
        if (line.stockItemId) {
          await tx.stockItem.update({
            where: { id: line.stockItemId },
            data: { quantity: { decrement: Math.trunc(Number(line.quantity)) } },
          });
        }
      }
    }
  });

  const document = await prisma.document.findUniqueOrThrow({ where: { id } });
  const basePath = document.kind === "QUOTE" ? "/documents/devis" : "/documents/factures";
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${id}`);
  redirect(`${basePath}/${id}`);
}

export async function markInvoicePaid(id: string) {
  await verifySession();
  await prisma.document.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  revalidatePath("/documents/factures");
  revalidatePath(`/documents/factures/${id}`);
  redirect(`/documents/factures/${id}`);
}

export async function cancelDocument(id: string) {
  await verifySession();

  await prisma.$transaction(async (tx) => {
    const document = await tx.document.findUnique({ where: { id }, include: { lines: true } });
    if (!document) throw new Error("Document introuvable.");
    if (document.status === "CANCELLED") return;

    if (document.kind === "INVOICE" && document.status !== "DRAFT") {
      for (const line of document.lines) {
        if (line.stockItemId) {
          await tx.stockItem.update({
            where: { id: line.stockItemId },
            data: { quantity: { increment: Math.trunc(Number(line.quantity)) } },
          });
        }
      }
    }

    await tx.document.update({ where: { id }, data: { status: "CANCELLED" } });
  });

  const document = await prisma.document.findUniqueOrThrow({ where: { id } });
  const basePath = document.kind === "QUOTE" ? "/documents/devis" : "/documents/factures";
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${id}`);
  redirect(`${basePath}/${id}`);
}

export async function deleteDraftDocument(id: string) {
  await verifySession();
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return;
  if (document.status !== "DRAFT") throw new Error("Seuls les brouillons peuvent être supprimés.");

  const basePath = document.kind === "QUOTE" ? "/documents/devis" : "/documents/factures";
  await prisma.document.delete({ where: { id } });
  revalidatePath(basePath);
  redirect(basePath);
}

export async function convertQuoteToInvoice(quoteId: string) {
  await verifySession();

  const invoice = await prisma.$transaction(async (tx) => {
    const quote = await tx.document.findUnique({
      where: { id: quoteId },
      include: { lines: true, convertedInvoice: true },
    });
    if (!quote) throw new Error("Devis introuvable.");
    if (quote.kind !== "QUOTE") throw new Error("Ce document n'est pas un devis.");
    if (quote.status !== "FINALIZED") throw new Error("Seul un devis finalisé peut être converti.");
    if (quote.convertedInvoice) throw new Error("Ce devis a déjà été converti en facture.");

    return tx.document.create({
      data: {
        kind: "INVOICE",
        clientId: quote.clientId,
        vehicleId: quote.vehicleId,
        notes: quote.notes,
        totalHT: quote.totalHT,
        totalTVA: quote.totalTVA,
        totalTTC: quote.totalTTC,
        convertedFromQuoteId: quote.id,
        lines: {
          create: quote.lines.map((line) => ({
            type: line.type,
            description: line.description,
            stockItemId: line.stockItemId,
            quantity: line.quantity,
            unitPriceHT: line.unitPriceHT,
            vatRate: line.vatRate,
            position: line.position,
          })),
        },
      },
    });
  });

  revalidatePath("/documents/factures");
  revalidatePath(`/documents/devis/${quoteId}`);
  redirect(`/documents/factures/${invoice.id}`);
}
