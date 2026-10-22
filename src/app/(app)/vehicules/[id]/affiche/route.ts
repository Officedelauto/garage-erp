import { verifySession } from "@/lib/dal";
import { renderPricePosterPdf, isPosterTemplateChoice } from "@/lib/pdf/render-price-poster";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;
  const templateParam = new URL(req.url).searchParams.get("template");
  const template = isPosterTemplateChoice(templateParam) ? templateParam : undefined;

  const result = await renderPricePosterPdf(id, template);
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
