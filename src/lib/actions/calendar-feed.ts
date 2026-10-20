"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function regenerateCalendarFeedToken() {
  await verifySession();
  const token = randomUUID();
  const existing = await prisma.company.findFirst();

  if (existing) {
    await prisma.company.update({ where: { id: existing.id }, data: { calendarFeedToken: token } });
  } else {
    await prisma.company.create({
      data: { name: "", address: "", postalCode: "", city: "", siret: "", calendarFeedToken: token },
    });
  }

  revalidatePath("/parametres");
}

export async function disableCalendarFeed() {
  await verifySession();
  const existing = await prisma.company.findFirst();
  if (existing) {
    await prisma.company.update({ where: { id: existing.id }, data: { calendarFeedToken: null } });
  }
  revalidatePath("/parametres");
}
