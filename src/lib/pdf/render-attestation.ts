import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { AttestationPdf } from "@/lib/pdf/attestation-pdf";

export async function renderAttestationPdf(vehicleId: string, noteId: string) {
  const [company, vehicle, note] = await Promise.all([
    prisma.company.findFirst(),
    prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { client: true } }),
    prisma.vehicleNote.findUnique({ where: { id: noteId } }),
  ]);

  if (!company || !vehicle || !note || note.vehicleId !== vehicleId) return null;

  const buffer = await renderToBuffer(
    AttestationPdf({
      company,
      client: vehicle.client,
      vehicle,
      intervention: note,
      issuedAt: new Date(),
    })
  );

  return { buffer, vehicle };
}
