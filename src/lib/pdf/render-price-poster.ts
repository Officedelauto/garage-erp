import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { PricePosterPdf } from "@/lib/pdf/price-poster-pdf";

export async function renderPricePosterPdf(vehicleId: string) {
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

  const buffer = await renderToBuffer(
    PricePosterPdf({
      companyName: company.name,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      price: vehicle.salePrice.toString(),
      mileage: vehicle.mileage,
      firstRegistrationDate: vehicle.firstRegistrationDate,
      fuelType: vehicle.fuelType,
      fiscalHorsepower: vehicle.fiscalHorsepower,
      color: vehicle.color,
      photoPath,
    })
  );

  return { buffer, vehicle };
}
