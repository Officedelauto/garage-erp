import { StockForm } from "@/components/stock/stock-form";
import { createStockItem } from "@/lib/actions/stock";

export default function NewStockItemPage() {
  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-ink-900 mb-4">Nouvelle pièce</h1>
      <StockForm action={createStockItem} submitLabel="Créer la pièce" />
    </div>
  );
}
