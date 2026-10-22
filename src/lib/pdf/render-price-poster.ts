import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { PricePosterPdf } from "@/lib/pdf/price-poster-pdf";
import { PricePosterModernPdf } from "@/lib/pdf/price-poster-modern-pdf";
import { PricePosterMinimalPdf } from "@/lib/pdf/price-poster-minimal-pdf";
import { PricePosterTagPdf } from "@/lib/pdf/price-poster-tag-pdf";
import { PricePosterTablePdf } from "@/lib/pdf/price-poster-table-pdf";
import type { PricePosterProps } from "@/lib/pdf/price-poster-shared";

const TEMPLATES = {
  CLASSIQUE: PricePosterPdf,
  MODERNE: PricePosterModernPdf,
  MINIMALISTE: PricePosterMinimalPdf,
  ETIQUETTE: PricePosterTagPdf,
  TABLEAU: PricePosterTablePdf,
} as const;

export type PosterTemplateChoice = keyof typeof TEMPLATES;

export function isPosterTemplateChoice(value: string | null | undefined): value is PosterTemplateChoice {
  return !!value && value in TEMPLATES;
}

export async function renderPricePosterPdf(vehicleId: string, templateOverride?: PosterTemplateChoice) {
  const [company, vehicle] = await Promise.all([
    prisma.company.findFirst(),
    prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { photos: { where: { isPrimary: true }, take: 1 } },
    }),
  ]);

  if (!company || !vehicle || vehicle.salePrice == null) return null;

  const primaryPhoto = vehicle.photos[0];
  const photoPath = primaryPhoto ? path.join(process.cwd(), "public", primaryPhoto.url) : null;
  const logoPath = company.logoUrl ? path.join(process.cwd(), "public", company.logoUrl) : null;

  const props: PricePosterProps = {
    companyName: company.name,
    companySiret: company.siret,
    companyAddress: company.address,
    companyCity: `${company.postalCode} ${company.city}`.trim(),
    companyPhone: company.phone,
    logoPath,
    brand: vehicle.brand,
    model: vehicle.model,
    trim: vehicle.trim,
    plate: vehicle.plate,
    price: vehicle.salePrice.toString(),
    mileage: vehicle.mileage,
    firstRegistrationDate: vehicle.firstRegistrationDate,
    fuelType: vehicle.fuelType,
    fiscalHorsepower: vehicle.fiscalHorsepower,
    co2Emissions: vehicle.co2Emissions,
    color: vehicle.color,
    transmission: vehicle.transmission,
    warranty: vehicle.warranty,
    stockNumber: vehicle.stockNumber,
    options: vehicle.options,
    photoPath,
  };

  const template = templateOverride ?? company.posterTemplate;
  const PosterComponent = TEMPLATES[template] ?? PricePosterPdf;

  const buffer = await renderToBuffer(PosterComponent(props));

  return { buffer, vehicle };
}
