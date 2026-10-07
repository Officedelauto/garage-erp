"use server";

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const MAX_SIZE = 4 * 1024 * 1024; // 4 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export type UploadLogoState = { error?: string } | undefined;

export async function uploadCompanyLogo(_prevState: UploadLogoState, formData: FormData): Promise<UploadLogoState> {
  await verifySession();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Merci de sélectionner une image de logo." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Format non supporté (JPEG, PNG, WebP ou SVG uniquement)." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Le logo est trop volumineux (4 Mo max)." };
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/svg+xml" ? "svg" : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "company");
  await mkdir(dir, { recursive: true });

  const filename = `logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const existing = await prisma.company.findFirst();
  const url = `/uploads/company/${filename}`;

  if (existing) {
    if (existing.logoUrl && existing.logoUrl !== url) {
      try {
        await unlink(path.join(process.cwd(), "public", existing.logoUrl));
      } catch {
        // ancien logo déjà absent, pas bloquant
      }
    }
    await prisma.company.update({ where: { id: existing.id }, data: { logoUrl: url } });
  } else {
    await prisma.company.create({
      data: { name: "", address: "", postalCode: "", city: "", siret: "", logoUrl: url },
    });
  }

  revalidatePath("/parametres");
}

export async function deleteCompanyLogo() {
  await verifySession();
  const existing = await prisma.company.findFirst();
  if (!existing?.logoUrl) return;

  try {
    await unlink(path.join(process.cwd(), "public", existing.logoUrl));
  } catch {
    // fichier déjà absent, pas bloquant
  }

  await prisma.company.update({ where: { id: existing.id }, data: { logoUrl: null } });
  revalidatePath("/parametres");
}
