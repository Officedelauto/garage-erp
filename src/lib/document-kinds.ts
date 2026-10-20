import type { DocumentKind } from "@/generated/prisma/enums";

export const DOCUMENT_BASE_PATH: Record<DocumentKind, string> = {
  QUOTE: "/documents/devis",
  ORDER: "/documents/commandes",
  INVOICE: "/documents/factures",
  CREDIT_NOTE: "/documents/avoirs",
};

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  QUOTE: "Devis",
  ORDER: "Bon de commande",
  INVOICE: "Facture",
  CREDIT_NOTE: "Avoir",
};

export const DOCUMENT_KIND_LABEL_PLURAL: Record<DocumentKind, string> = {
  QUOTE: "Devis",
  ORDER: "Bons de commande",
  INVOICE: "Factures",
  CREDIT_NOTE: "Avoirs",
};

export const DOCUMENT_NUMBERING: Record<DocumentKind, { prefixField: "quotePrefix" | "orderPrefix" | "invoicePrefix" | "creditNotePrefix"; counterField: "nextQuoteNumber" | "nextOrderNumber" | "nextInvoiceNumber" | "nextCreditNoteNumber" }> = {
  QUOTE: { prefixField: "quotePrefix", counterField: "nextQuoteNumber" },
  ORDER: { prefixField: "orderPrefix", counterField: "nextOrderNumber" },
  INVOICE: { prefixField: "invoicePrefix", counterField: "nextInvoiceNumber" },
  CREDIT_NOTE: { prefixField: "creditNotePrefix", counterField: "nextCreditNoteNumber" },
};
