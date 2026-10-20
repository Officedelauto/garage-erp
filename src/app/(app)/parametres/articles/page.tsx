import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { ServiceItemsManager } from "@/components/settings/service-items-manager";

export default async function ServiceItemsPage() {
  await verifySession();
  const items = await prisma.serviceItem.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-ink-900 mb-1">Articles &amp; prestations</h1>
      <p className="text-sm text-slate-500 mb-4">
        Catalogue de prestations facturables sans suivi de quantité (main d&apos;œuvre, livraison, frais de carte
        grise...). Ces articles sont proposés en sélection rapide lors de la création d&apos;un devis, bon de
        commande, facture ou avoir — pour les pièces physiques avec stock, utilisez la section &quot;Stock
        garage&quot;.
      </p>
      <ServiceItemsManager
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          priceHT: i.priceHT.toString(),
          vatRate: i.vatRate.toString(),
        }))}
      />
    </div>
  );
}
