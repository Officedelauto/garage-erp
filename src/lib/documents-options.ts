import { prisma } from "@/lib/prisma";
import { clientDisplayName } from "@/lib/utils";

export async function getDocumentFormOptions() {
  const [clients, vehicles, stockItems, serviceItems] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.stockItem.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceItem.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    clients: clients.map((c) => ({ id: c.id, label: clientDisplayName(c) })),
    vehicles: vehicles.map((v) => ({
      id: v.id,
      clientId: v.clientId,
      label: `${v.plate} — ${v.brand} ${v.model}`,
      salePriceHT: v.salePrice ? v.salePrice.toString() : null,
      sold: v.clientId != null,
    })),
    stockItems: stockItems.map((s) => ({
      id: s.id,
      label: `${s.reference} — ${s.name}`,
      salePriceHT: s.salePriceHT.toString(),
      vatRate: s.vatRate.toString(),
    })),
    serviceItems: serviceItems.map((s) => ({
      id: s.id,
      label: s.name,
      priceHT: s.priceHT.toString(),
      vatRate: s.vatRate.toString(),
    })),
  };
}
