import { verifySession } from "@/lib/dal";
import { renderPricePosterPdf } from "@/lib/pdf/render-price-poster";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const result = await renderPricePosterPdf(id);
  if (!result) {
    return new Response("Véhicule introuvable ou prix de vente non renseigné.", { status: 404 });
  }

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="affiche-${result.vehicle.plate}.pdf"`,
    },
  });
}
