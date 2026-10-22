"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import type { DocumentKind } from "@/generated/prisma/enums";
import { DOCUMENT_BASE_PATH, DOCUMENT_NUMBERING } from "@/lib/document-kinds";

const LineSchema = z.object({
  type: z.enum(["PART", "LABOR", "VEHICLE", "OTHER"]),
  description: z.string().trim().min(1, "Description requise"),
  stockItemId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  quantity: z.coerce.number().positive("Quantité invalide"),
  unitPriceHT: z.coerce.number().min(0, "Prix invalide"),
  vatRate: z.coerce.number().min(0, "TVA invalide"),
});

const PAYMENT_METHODS = ["ESPECES", "CARTE", "CHEQUE", "VIREMENT", "AUTRE"] as const;

const DocumentFormSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  vehicleId: z.string().optional().nullable(),
  notes: z.string().trim().optional(),
  linesJson: z.string(),
  depositAmount: z.coerce.number().min(0).optional(),
  depositPaymentMethod: z.enum(PAYMENT_METHODS).optional(),
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
    depositAmount: formData.get("depositAmount") || undefined,
    depositPaymentMethod: formData.get("depositPaymentMethod") || undefined,
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
  const basePath = DOCUMENT_BASE_PATH[kind];

  const document = await prisma.document.create({
    data: {
      kind,
      clientId: parsed.data.clientId,
      vehicleId: parsed.data.vehicleId || null,
      notes: parsed.data.notes || null,
      depositAmount: parsed.data.depositAmount ?? null,
      depositPaymentMethod: parsed.data.depositPaymentMethod ?? null,
      ...totals,
      lines: {
        create: parsed.lines.map((line, position) => ({
          type: line.type,
          description: line.description,
          stockItemId: line.stockItemId || null,
          vehicleId: line.vehicleId || null,
          quantity: line.quantity,
          unitPriceHT: line.unitPriceHT,
          vatRate: line.vatRate,
          position,
        })),
      },
    },
  });

  revalidatePath(basePath);
  redirect(`${basePath}/${document.id}`);
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
  const basePath = DOCUMENT_BASE_PATH[existing.kind];

  await prisma.$transaction([
    prisma.documentLine.deleteMany({ where: { documentId: id } }),
    prisma.document.update({
      where: { id },
      data: {
        clientId: parsed.data.clientId,
        vehicleId: parsed.data.vehicleId || null,
        notes: parsed.data.notes || null,
        depositAmount: parsed.data.depositAmount ?? null,
        depositPaymentMethod: parsed.data.depositPaymentMethod ?? null,
        ...totals,
        lines: {
          create: parsed.lines.map((line, position) => ({
            type: line.type,
            description: line.description,
            stockItemId: line.stockItemId || null,
            vehicleId: line.vehicleId || null,
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

    const { prefixField, counterField } = DOCUMENT_NUMBERING[document.kind];
    const counter = company[counterField];
    const number = formatNumber(company[prefixField], counter);

    await tx.company.update({
      where: { id: company.id },
      data: { [counterField]: counter + 1 },
    });

    const now = new Date();
    await tx.document.update({
      where: { id },
      data: {
        number,
        status: "FINALIZED",
        issueDate: now,
        dueDate: document.kind === "INVOICE" ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
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

    // Une facture sort les pièces du stock ; un avoir les y remet.
    if (document.kind === "INVOICE") {
      for (const line of document.lines) {
        if (line.stockItemId) {
          await tx.stockItem.update({
            where: { id: line.stockItemId },
            data: { quantity: { decrement: Math.trunc(Number(line.quantity)) } },
          });
        }
      }
    } else if (document.kind === "CREDIT_NOTE") {
      for (const line of document.lines) {
        if (line.stockItemId) {
          await tx.stockItem.update({
            where: { id: line.stockItemId },
            data: { quantity: { increment: Math.trunc(Number(line.quantity)) } },
          });
        }
      }
    }

    // Un bon de commande avec acompte réserve le(s) véhicule(s) qu'il contient.
    if (document.kind === "ORDER" && document.depositAmount != null && Number(document.depositAmount) > 0) {
      const vehicleIds = document.lines.map((l) => l.vehicleId).filter((v): v is string => v != null);
      for (const vehicleId of vehicleIds) {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: {
            reservedByClientId: document.clientId,
            depositAmount: document.depositAmount,
            depositPaymentMethod: document.depositPaymentMethod,
            depositDate: now,
            reservationOrderId: document.id,
          },
        });
      }
    }
  });

  const document = await prisma.document.findUniqueOrThrow({ where: { id } });
  const basePath = DOCUMENT_BASE_PATH[document.kind];
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

    if (document.status !== "DRAFT") {
      if (document.kind === "INVOICE") {
        for (const line of document.lines) {
          if (line.stockItemId) {
            await tx.stockItem.update({
              where: { id: line.stockItemId },
              data: { quantity: { increment: Math.trunc(Number(line.quantity)) } },
            });
          }
        }
      } else if (document.kind === "CREDIT_NOTE") {
        for (const line of document.lines) {
          if (line.stockItemId) {
            await tx.stockItem.update({
              where: { id: line.stockItemId },
              data: { quantity: { decrement: Math.trunc(Number(line.quantity)) } },
            });
          }
        }
      }
    }

    // Annuler un bon de commande libère les véhicules qu'il avait réservés.
    if (document.kind === "ORDER") {
      await tx.vehicle.updateMany({
        where: { reservationOrderId: document.id },
        data: {
          reservedByClientId: null,
          depositAmount: null,
          depositPaymentMethod: null,
          depositDate: null,
          reservationOrderId: null,
        },
      });
    }

    await tx.document.update({ where: { id }, data: { status: "CANCELLED" } });
  });

  const document = await prisma.document.findUniqueOrThrow({ where: { id } });
  const basePath = DOCUMENT_BASE_PATH[document.kind];
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${id}`);
  redirect(`${basePath}/${id}`);
}

export async function deleteDraftDocument(id: string) {
  await verifySession();
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return;
  if (document.status !== "DRAFT") throw new Error("Seuls les brouillons peuvent être supprimés.");

  const basePath = DOCUMENT_BASE_PATH[document.kind];
  await prisma.document.delete({ where: { id } });
  revalidatePath(basePath);
  redirect(basePath);
}

// Convertit un devis finalisé OU un bon de commande finalisé en facture.
export async function convertDocumentToInvoice(sourceId: string) {
  await verifySession();

  const invoice = await prisma.$transaction(async (tx) => {
    const source = await tx.document.findUnique({
      where: { id: sourceId },
      include: { lines: true, convertedInvoice: true },
    });
    if (!source) throw new Error("Document introuvable.");
    if (source.kind !== "QUOTE" && source.kind !== "ORDER") throw new Error("Ce document ne peut pas être converti en facture.");
    if (source.status !== "FINALIZED") throw new Error("Seul un document finalisé peut être converti.");
    if (source.convertedInvoice) throw new Error("Ce document a déjà été converti en facture.");

    const createdInvoice = await tx.document.create({
      data: {
        kind: "INVOICE",
        clientId: source.clientId,
        vehicleId: source.vehicleId,
        notes: source.notes,
        totalHT: source.totalHT,
        totalTVA: source.totalTVA,
        totalTTC: source.totalTTC,
        convertedFromQuoteId: source.id,
        lines: {
          create: source.lines.map((line) => ({
            type: line.type,
            description: line.description,
            stockItemId: line.stockItemId,
            vehicleId: line.vehicleId,
            quantity: line.quantity,
            unitPriceHT: line.unitPriceHT,
            vatRate: line.vatRate,
            position: line.position,
          })),
        },
      },
    });

    // La facturation finalise la vente : on lève la réservation et on attribue le
    // véhicule au client (statut "Vendu").
    const vehicleIds = source.lines.map((l) => l.vehicleId).filter((v): v is string => v != null);
    for (const vehicleId of vehicleIds) {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          clientId: source.clientId,
          saleDate: new Date(),
          reservedByClientId: null,
          depositAmount: null,
          depositPaymentMethod: null,
          depositDate: null,
          reservationOrderId: null,
        },
      });
    }

    return createdInvoice;
  });

  revalidatePath("/documents/factures");
  revalidatePath(`${DOCUMENT_BASE_PATH[invoice.kind]}`);
  redirect(`/documents/factures/${invoice.id}`);
}
