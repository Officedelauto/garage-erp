"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const ClientSchema = z.object({
  type: z.enum(["PARTICULIER", "PROFESSIONNEL"]),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
  siret: z.string().trim().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  city: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ClientFormState = { error?: string } | undefined;

function parseClientForm(formData: FormData) {
  return ClientSchema.safeParse({
    type: formData.get("type"),
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    companyName: formData.get("companyName") || undefined,
    siret: formData.get("siret") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    city: formData.get("city") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createClient(_prevState: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await verifySession();
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: "Champs invalides, vérifiez le formulaire." };
  }
  const data = parsed.data;
  if (data.type === "PARTICULIER" && !data.firstName && !data.lastName) {
    return { error: "Merci de renseigner au moins un nom pour un client particulier." };
  }
  if (data.type === "PROFESSIONNEL" && !data.companyName) {
    return { error: "Merci de renseigner la raison sociale pour un client professionnel." };
  }

  const client = await prisma.client.create({
    data: {
      ...data,
      email: data.email || null,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, _prevState: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await verifySession();
  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: "Champs invalides, vérifiez le formulaire." };
  }
  const data = parsed.data;

  await prisma.client.update({
    where: { id },
    data: {
      ...data,
      email: data.email || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  await verifySession();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}
