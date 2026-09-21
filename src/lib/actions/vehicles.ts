"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const FUEL_TYPES = ["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL", "AUTRE"] as const;

const VehicleSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  plate: z.string().trim().min(1, "Immatriculation requise").toUpperCase(),
  brand: z.string().trim().min(1, "Marque requise"),
  model: z.string().trim().min(1, "Modèle requis"),
  vin: z.string().trim().optional(),
  year: z.coerce.number().int().optional(),
  mileage: z.coerce.number().int().optional(),
  fuelType: z.enum(FUEL_TYPES),
  purchasePrice: z.coerce.number().optional(),
  salePrice: z.coerce.number().optional(),
  notes: z.string().trim().optional(),
});

export type VehicleFormState = { error?: string } | undefined;

function parseVehicleForm(formData: FormData) {
  return VehicleSchema.safeParse({
    clientId: formData.get("clientId"),
    plate: formData.get("plate"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    vin: formData.get("vin") || undefined,
    year: formData.get("year") || undefined,
    mileage: formData.get("mileage") || undefined,
    fuelType: formData.get("fuelType") || "AUTRE",
    purchasePrice: formData.get("purchasePrice") || undefined,
    salePrice: formData.get("salePrice") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createVehicle(_prevState: VehicleFormState, formData: FormData): Promise<VehicleFormState> {
  await verifySession();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const existing = await prisma.vehicle.findUnique({ where: { plate: parsed.data.plate } });
  if (existing) {
    return { error: "Un véhicule avec cette immatriculation existe déjà." };
  }

  const vehicle = await prisma.vehicle.create({ data: parsed.data });

  revalidatePath("/vehicules");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  redirect(`/vehicules/${vehicle.id}`);
}

export async function updateVehicle(id: string, _prevState: VehicleFormState, formData: FormData): Promise<VehicleFormState> {
  await verifySession();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const existing = await prisma.vehicle.findUnique({ where: { plate: parsed.data.plate } });
  if (existing && existing.id !== id) {
    return { error: "Un véhicule avec cette immatriculation existe déjà." };
  }

  await prisma.vehicle.update({ where: { id }, data: parsed.data });

  revalidatePath("/vehicules");
  revalidatePath(`/vehicules/${id}`);
  revalidatePath(`/clients/${parsed.data.clientId}`);
  redirect(`/vehicules/${id}`);
}

export async function deleteVehicle(id: string) {
  await verifySession();
  const vehicle = await prisma.vehicle.delete({ where: { id } });
  revalidatePath("/vehicules");
  revalidatePath(`/clients/${vehicle.clientId}`);
  redirect("/vehicules");
}
