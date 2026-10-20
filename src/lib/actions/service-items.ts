"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const ServiceItemSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  description: z.string().trim().optional(),
  priceHT: z.coerce.number().min(0, "Prix invalide"),
  vatRate: z.coerce.number().min(0).default(20),
});

export type ServiceItemFormState = { error?: string; success?: boolean } | undefined;

function parseServiceItemForm(formData: FormData) {
  return ServiceItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceHT: formData.get("priceHT"),
    vatRate: formData.get("vatRate") || 20,
  });
}

export async function createServiceItem(_prevState: ServiceItemFormState, formData: FormData): Promise<ServiceItemFormState> {
  await verifySession();
  const parsed = parseServiceItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  await prisma.serviceItem.create({ data: parsed.data });

  revalidatePath("/parametres/articles");
  return { success: true };
}

export async function updateServiceItem(id: string, _prevState: ServiceItemFormState, formData: FormData): Promise<ServiceItemFormState> {
  await verifySession();
  const parsed = parseServiceItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  await prisma.serviceItem.update({ where: { id }, data: parsed.data });

  revalidatePath("/parametres/articles");
  return { success: true };
}

export async function deleteServiceItem(id: string) {
  await verifySession();
  await prisma.serviceItem.delete({ where: { id } });
  revalidatePath("/parametres/articles");
}
