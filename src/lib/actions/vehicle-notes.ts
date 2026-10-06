"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const NoteSchema = z.object({
  content: z.string().trim().min(1, "Description requise"),
  mileage: z.coerce.number().int().optional(),
  performedAt: z.coerce.date().optional(),
});

export type AddVehicleNoteState = { error?: string } | undefined;

export async function addVehicleNote(
  vehicleId: string,
  _prevState: AddVehicleNoteState,
  formData: FormData
): Promise<AddVehicleNoteState> {
  await verifySession();

  const parsed = NoteSchema.safeParse({
    content: formData.get("content"),
    mileage: formData.get("mileage") || undefined,
    performedAt: formData.get("performedAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  await prisma.vehicleNote.create({
    data: {
      vehicleId,
      content: parsed.data.content,
      mileage: parsed.data.mileage,
      performedAt: parsed.data.performedAt,
      source: "manual",
    },
  });

  revalidatePath(`/vehicules/${vehicleId}`);
}

export async function deleteVehicleNote(noteId: string) {
  await verifySession();
  const note = await prisma.vehicleNote.delete({ where: { id: noteId } });
  revalidatePath(`/vehicules/${note.vehicleId}`);
}
