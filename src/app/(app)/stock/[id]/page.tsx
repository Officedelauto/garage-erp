import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { StockForm } from "@/components/stock/stock-form";
import { updateStockItem, deleteStockItem } from "@/lib/actions/stock";
import { DeleteButton } from "@/components/shared/delete-button";

export default async function StockItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) notFound();

  const boundUpdate = updateStockItem.bind(null, item.id);
  const boundDelete = deleteStockItem.bind(null, item.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{item.name}</h1>
        <DeleteButton action={boundDelete} confirmMessage="Supprimer cette pièce du stock ?" />
      </div>

      <StockForm
        action={boundUpdate}
        defaults={{
          reference: item.reference,
          name: item.name,
          description: item.description ?? "",
          purchasePriceHT: item.purchasePriceHT.toString(),
          salePriceHT: item.salePriceHT.toString(),
          vatRate: item.vatRate.toString(),
          quantity: item.quantity.toString(),
          alertThreshold: item.alertThreshold.toString(),
          unit: item.unit,
        }}
      />
    </div>
  );
}
