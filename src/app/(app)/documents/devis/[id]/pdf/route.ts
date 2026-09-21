import { verifySession } from "@/lib/dal";
import { renderDocumentPdf } from "@/lib/pdf/render-document";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const result = await renderDocumentPdf(id, "QUOTE");
  if (!result) {
    return new Response("Devis introuvable ou non finalisé.", { status: 404 });
  }

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.number}.pdf"`,
    },
  });
}
