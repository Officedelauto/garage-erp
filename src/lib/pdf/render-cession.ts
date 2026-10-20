import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { CessionPdf } from "@/lib/pdf/cession-pdf";

export async function renderCessionPdf(vehicleId: string) {
  const [company, vehicle] = await Promise.all([
    prisma.company.findFirst(),
    prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { client: true, reservedByClient: true },
    }),
  ]);

  if (!company || !vehicle) return null;

  const buyer = vehicle.reservedByClient ?? vehicle.client;

  const buffer = await renderToBuffer(
    CessionPdf({
      company,
      vehicle,
      buyer,
      salePrice: vehicle.salePrice?.toString() ?? null,
      depositAmount: vehicle.depositAmount?.toString() ?? null,
      depositDate: vehicle.depositDate,
      issuedAt: new Date(),
    })
  );

  return { buffer, vehicle };
}
