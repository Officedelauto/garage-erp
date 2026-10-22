export function frMonthYear(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("fr-FR", { month: "2-digit", year: "numeric" }).format(new Date(d));
}

export const FUEL_LABELS: Record<string, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
  AUTRE: "Autre",
};

export type PricePosterProps = {
  companyName: string;
  companySiret: string;
  companyAddress: string;
  companyCity: string;
  companyPhone?: string | null;
  logoPath?: string | null;
  brand: string;
  model: string;
  trim?: string | null;
  plate: string;
  price: string | number;
  mileage?: number | null;
  firstRegistrationDate?: Date | string | null;
  fuelType?: string;
  fiscalHorsepower?: number | null;
  co2Emissions?: number | null;
  color?: string | null;
  options?: string[];
  photoPath?: string | null;
};
