"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const StockItemSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
  name: z.string().trim().min(1, "Nom requis"),
  description: z.string().trim().optional(),
  purchasePriceHT: z.coerce.number().min(0, "Prix d'achat invalide"),
  salePriceHT: z.coerce.number().min(0, "Prix de vente invalide"),
  vatRate: z.coerce.number().min(0).default(20),
  quantity: z.coerce.number().int().default(0),
  alertThreshold: z.coerce.number().int().default(1),
  unit: z.string().trim().min(1).default("unité"),
});

export type StockFormState = { error?: string } | undefined;

function parseStockForm(formData: FormData) {
  return StockItemSchema.safeParse({
    reference: formData.get("reference"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    purchasePriceHT: formData.get("purchasePriceHT"),
    salePriceHT: formData.get("salePriceHT"),
    vatRate: formData.get("vatRate") || 20,
    quantity: formData.get("quantity") || 0,
    alertThreshold: formData.get("alertThreshold") || 1,
    unit: formData.get("unit") || "unité",
  });
}

export async function createStockItem(_prevState: StockFormState, formData: FormData): Promise<StockFormState> {
  await verifySession();
  const parsed = parseStockForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const existing = await prisma.stockItem.findUnique({ where: { reference: parsed.data.reference } });
  if (existing) {
    return { error: "Une pièce avec cette référence existe déjà." };
  }

  const item = await prisma.stockItem.create({ data: parsed.data });

  revalidatePath("/stock");
  redirect(`/stock/${item.id}`);
}

export async function updateStockItem(id: string, _prevState: StockFormState, formData: FormData): Promise<StockFormState> {
  await verifySession();
  const parsed = parseStockForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const existing = await prisma.stockItem.findUnique({ where: { reference: parsed.data.reference } });
  if (existing && existing.id !== id) {
    return { error: "Une pièce avec cette référence existe déjà." };
  }

  await prisma.stockItem.update({ where: { id }, data: parsed.data });

  revalidatePath("/stock");
  revalidatePath(`/stock/${id}`);
  redirect(`/stock/${id}`);
}

export async function deleteStockItem(id: string) {
  await verifySession();
  await prisma.stockItem.delete({ where: { id } });
  revalidatePath("/stock");
  redirect("/stock");
}
