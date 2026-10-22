"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const CompanySchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  address: z.string().trim().min(1, "Adresse requise"),
  postalCode: z.string().trim().min(1, "Code postal requis"),
  city: z.string().trim().min(1, "Ville requise"),
  siret: z.string().trim().min(1, "SIRET requis"),
  vatNumber: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  iban: z.string().trim().optional(),
  quotePrefix: z.string().trim().min(1).default("DEV"),
  orderPrefix: z.string().trim().min(1).default("BC"),
  invoicePrefix: z.string().trim().min(1).default("FA"),
  creditNotePrefix: z.string().trim().min(1).default("AV"),
});

export type CompanyFormState = { error?: string; success?: boolean } | undefined;

export async function updateCompany(_prevState: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  await verifySession();

  const parsed = CompanySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    siret: formData.get("siret"),
    vatNumber: formData.get("vatNumber") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    iban: formData.get("iban") || undefined,
    quotePrefix: formData.get("quotePrefix") || "DEV",
    orderPrefix: formData.get("orderPrefix") || "BC",
    invoicePrefix: formData.get("invoicePrefix") || "FA",
    creditNotePrefix: formData.get("creditNotePrefix") || "AV",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const existing = await prisma.company.findFirst();
  const data = { ...parsed.data, email: parsed.data.email || null };

  if (existing) {
    await prisma.company.update({ where: { id: existing.id }, data });
  } else {
    await prisma.company.create({ data });
  }

  revalidatePath("/parametres");
  return { success: true };
}

const POSTER_TEMPLATES = ["CLASSIQUE", "MODERNE", "MINIMALISTE"] as const;

export async function updatePosterTemplate(formData: FormData) {
  await verifySession();
  const template = formData.get("posterTemplate");
  if (typeof template !== "string" || !(POSTER_TEMPLATES as readonly string[]).includes(template)) return;

  const existing = await prisma.company.findFirst();
  if (!existing) return;

  await prisma.company.update({
    where: { id: existing.id },
    data: { posterTemplate: template as (typeof POSTER_TEMPLATES)[number] },
  });

  revalidatePath("/parametres");
}
