import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  FINALIZED: "Finalisé",
  PAID: "Payée",
  CANCELLED: "Annulé",
};

const VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  DRAFT: "default",
  FINALIZED: "info",
  PAID: "success",
  CANCELLED: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? "default"}>{LABELS[status] ?? status}</Badge>;
}
