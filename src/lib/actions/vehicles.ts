"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const FUEL_TYPES = ["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL", "AUTRE"] as const;
const SELLER_TYPES = ["PARTICULIER", "PROFESSIONNEL"] as const;

// Champs confidentiels (prix d'achat, fournisseur) réservés aux comptes ADMIN : on les
// retire même si un utilisateur STAFF parvenait à les inclure dans le formulaire soumis.
const PURCHASE_FIELDS = ["purchaseDate", "purchasePrice", "sellerType", "sellerName"] as const;

const VehicleSchema = z.object({
  clientId: z.string().trim().optional(),
  plate: z.string().trim().min(1, "Immatriculation requise").toUpperCase(),
  stockNumber: z.string().trim().optional(),
  brand: z.string().trim().min(1, "Marque requise"),
  model: z.string().trim().min(1, "Modèle requis"),
  color: z.string().trim().optional(),
  vin: z.string().trim().optional(),
  firstRegistrationDate: z.coerce.date().optional(),
  technicalInspectionDate: z.coerce.date().optional(),
  fiscalHorsepower: z.coerce.number().int().optional(),
  co2Emissions: z.coerce.number().int().optional(),
  mileage: z.coerce.number().int().optional(),
  fuelType: z.enum(FUEL_TYPES),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().optional(),
  sellerType: z.enum(SELLER_TYPES).optional(),
  sellerName: z.string().trim().optional(),
  salePrice: z.coerce.number().optional(),
  options: z.array(z.string()).optional(),
  notes: z.string().trim().optional(),
});

export type VehicleFormState = { error?: string } | undefined;

function parseVehicleForm(formData: FormData) {
  return VehicleSchema.safeParse({
    clientId: formData.get("clientId") || undefined,
    plate: formData.get("plate"),
    stockNumber: formData.get("stockNumber") || undefined,
    brand: formData.get("brand"),
    model: formData.get("model"),
    color: formData.get("color") || undefined,
    vin: formData.get("vin") || undefined,
    firstRegistrationDate: formData.get("firstRegistrationDate") || undefined,
    technicalInspectionDate: formData.get("technicalInspectionDate") || undefined,
    fiscalHorsepower: formData.get("fiscalHorsepower") || undefined,
    co2Emissions: formData.get("co2Emissions") || undefined,
    mileage: formData.get("mileage") || undefined,
    fuelType: formData.get("fuelType") || "AUTRE",
    purchaseDate: formData.get("purchaseDate") || undefined,
    purchasePrice: formData.get("purchasePrice") || undefined,
    sellerType: formData.get("sellerType") || undefined,
    sellerName: formData.get("sellerName") || undefined,
    salePrice: formData.get("salePrice") || undefined,
    options: formData.getAll("options") as string[],
    notes: formData.get("notes") || undefined,
  });
}

function stripPurchaseFieldsIfNotAdmin<T extends Record<string, unknown>>(data: T, role: string): T {
  if (role === "ADMIN") return data;
  const copy = { ...data };
  for (const field of PURCHASE_FIELDS) delete copy[field];
  return copy;
}

export async function createVehicle(_prevState: VehicleFormState, formData: FormData): Promise<VehicleFormState> {
  const { role } = await verifySession();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const existing = await prisma.vehicle.findUnique({ where: { plate: parsed.data.plate } });
  if (existing) {
    return { error: "Un véhicule avec cette immatriculation existe déjà." };
  }

  const { clientId, ...rest } = stripPurchaseFieldsIfNotAdmin(parsed.data, role);
  const vehicle = await prisma.vehicle.create({
    data: clientId ? { ...rest, client: { connect: { id: clientId } } } : rest,
  });

  revalidatePath("/vehicules");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  redirect(`/vehicules/${vehicle.id}`);
}

export async function updateVehicle(id: string, _prevState: VehicleFormState, formData: FormData): Promise<VehicleFormState> {
  const { role } = await verifySession();
  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const existing = await prisma.vehicle.findUnique({ where: { plate: parsed.data.plate } });
  if (existing && existing.id !== id) {
    return { error: "Un véhicule avec cette immatriculation existe déjà." };
  }

  const { clientId, ...rest } = stripPurchaseFieldsIfNotAdmin(parsed.data, role);
  await prisma.vehicle.update({
    where: { id },
    data: { ...rest, client: clientId ? { connect: { id: clientId } } : { disconnect: true } },
  });

  revalidatePath("/vehicules");
  revalidatePath(`/vehicules/${id}`);
  if (clientId) revalidatePath(`/clients/${clientId}`);
  redirect(`/vehicules/${id}`);
}

export async function deleteVehicle(id: string) {
  await verifySession();
  const vehicle = await prisma.vehicle.delete({ where: { id } });
  revalidatePath("/vehicules");
  if (vehicle.clientId) revalidatePath(`/clients/${vehicle.clientId}`);
  redirect("/vehicules");
}
