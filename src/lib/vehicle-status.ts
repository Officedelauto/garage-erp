export type VehicleStatus = "STOCK" | "VENDU" | "CLIENT";

export function vehicleStatus(v: { clientId: string | null; salePrice: unknown }): VehicleStatus {
  if (!v.clientId) return "STOCK";
  return v.salePrice != null ? "VENDU" : "CLIENT";
}

export const VEHICLE_STATUS_BADGES: Record<VehicleStatus, { label: string; variant: "info" | "success" | "default" }> = {
  STOCK: { label: "En stock", variant: "info" },
  VENDU: { label: "Vendu", variant: "success" },
  CLIENT: { label: "Client (atelier)", variant: "default" },
};
