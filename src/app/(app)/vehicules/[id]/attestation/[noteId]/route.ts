import { verifySession } from "@/lib/dal";
import { renderAttestationPdf } from "@/lib/pdf/render-attestation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  await verifySession();
  const { id, noteId } = await params;

  const result = await renderAttestationPdf(id, noteId);
  if (!result) {
    return new Response("Intervention introuvable.", { status: 404 });
  }

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="attestation-${result.vehicle.plate}.pdf"`,
    },
  });
}
