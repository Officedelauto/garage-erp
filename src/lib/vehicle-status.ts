export type VehicleStatus = "STOCK" | "RESERVE" | "VENDU" | "CLIENT";

export function vehicleStatus(v: {
  clientId: string | null;
  salePrice: unknown;
  reservedByClientId?: string | null;
}): VehicleStatus {
  if (v.reservedByClientId) return "RESERVE";
  if (!v.clientId) return "STOCK";
  return v.salePrice != null ? "VENDU" : "CLIENT";
}

export const VEHICLE_STATUS_BADGES: Record<
  VehicleStatus,
  { label: string; variant: "info" | "success" | "default" | "warning" }
> = {
  STOCK: { label: "En stock", variant: "info" },
  RESERVE: { label: "Réservé", variant: "warning" },
  VENDU: { label: "Vendu", variant: "success" },
  CLIENT: { label: "Client (atelier)", variant: "default" },
};
