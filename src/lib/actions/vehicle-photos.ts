"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadPhotoState = { error?: string } | undefined;

export async function uploadVehiclePhoto(
  vehicleId: string,
  _prevState: UploadPhotoState,
  formData: FormData
): Promise<UploadPhotoState> {
  await verifySession();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Merci de sélectionner une photo." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Format non supporté (JPEG, PNG ou WebP uniquement)." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "La photo est trop volumineuse (8 Mo max)." };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "vehicles", vehicleId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/vehicles/${vehicleId}/${filename}`;
  const existingCount = await prisma.vehiclePhoto.count({ where: { vehicleId } });

  await prisma.vehiclePhoto.create({
    data: { vehicleId, url, isPrimary: existingCount === 0 },
  });

  revalidatePath(`/vehicules/${vehicleId}`);
}

export async function setPrimaryPhoto(vehicleId: string, photoId: string) {
  await verifySession();
  await prisma.$transaction([
    prisma.vehiclePhoto.updateMany({ where: { vehicleId }, data: { isPrimary: false } }),
    prisma.vehiclePhoto.update({ where: { id: photoId }, data: { isPrimary: true } }),
  ]);
  revalidatePath(`/vehicules/${vehicleId}`);
}

export async function deleteVehiclePhoto(photoId: string) {
  await verifySession();
  const photo = await prisma.vehiclePhoto.delete({ where: { id: photoId } });

  try {
    await unlink(path.join(process.cwd(), "public", photo.url));
  } catch {
    // le fichier est peut-être déjà absent, pas bloquant
  }

  if (photo.isPrimary) {
    const next = await prisma.vehiclePhoto.findFirst({ where: { vehicleId: photo.vehicleId } });
    if (next) {
      await prisma.vehiclePhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }

  revalidatePath(`/vehicules/${photo.vehicleId}`);
}
