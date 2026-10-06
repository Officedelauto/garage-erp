import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatEur(amount: number | string) {
  return eurFormatter.format(Number(amount));
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return dateFormatter.format(new Date(date));
}

export function formatDateInput(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function monthsSince(date: Date | string | null | undefined) {
  if (!date) return null;
  const diffMs = Date.now() - new Date(date).getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 30.44);
}

export function yearsSince(date: Date | string | null | undefined) {
  if (!date) return null;
  const diffMs = Date.now() - new Date(date).getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

export function clientDisplayName(client: {
  type: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
}) {
  if (client.type === "PROFESSIONNEL") return client.companyName || "—";
  return `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || "—";
}
