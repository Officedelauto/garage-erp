import { verifySession } from "@/lib/dal";
import { renderCessionCerfaPdf } from "@/lib/pdf/render-cession-cerfa";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const result = await renderCessionCerfaPdf(id);
  if (!result) {
    return new Response("Véhicule introuvable.", { status: 404 });
  }

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="declaration-cession-${result.vehicle.plate}.pdf"`,
    },
  });
}
