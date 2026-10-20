"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const APPOINTMENT_TYPES = ["REVISION", "REPARATION", "CONTROLE_TECHNIQUE", "LIVRAISON", "ESSAI", "AUTRE"] as const;

const AppointmentSchema = z.object({
  title: z.string().trim().min(1, "Titre requis"),
  type: z.enum(APPOINTMENT_TYPES),
  startAt: z.coerce.date({ message: "Date et heure de début requises" }),
  endAt: z.coerce.date().optional(),
  clientId: z.string().trim().optional(),
  vehicleId: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type AppointmentFormState = { error?: string; success?: boolean } | undefined;

function parseAppointmentForm(formData: FormData) {
  return AppointmentSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type") || "AUTRE",
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt") || undefined,
    clientId: formData.get("clientId") || undefined,
    vehicleId: formData.get("vehicleId") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createAppointment(_prevState: AppointmentFormState, formData: FormData): Promise<AppointmentFormState> {
  await verifySession();
  const parsed = parseAppointmentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  await prisma.appointment.create({ data: parsed.data });

  revalidatePath("/atelier");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateAppointment(
  id: string,
  _prevState: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  await verifySession();
  const parsed = parseAppointmentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  await prisma.appointment.update({ where: { id }, data: parsed.data });

  revalidatePath("/atelier");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAppointment(id: string) {
  await verifySession();
  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/atelier");
  revalidatePath("/dashboard");
}
