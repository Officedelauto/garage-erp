"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getDeepSeekClient } from "@/lib/ai/deepseek";

export type ListingState = { error?: string; adCopy?: string } | undefined;

const FUEL_LABELS: Record<string, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
  AUTRE: "Autre",
};

export async function generateVehicleListing(
  vehicleId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState
  _prevState: ListingState
): Promise<ListingState> {
  await verifySession();

  const [vehicle, company] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    prisma.company.findFirst(),
  ]);
  if (!vehicle) {
    return { error: "Véhicule introuvable." };
  }

  const firstRegLabel = vehicle.firstRegistrationDate
    ? new Intl.DateTimeFormat("fr-FR", { month: "2-digit", year: "numeric" }).format(vehicle.firstRegistrationDate)
    : null;

  const facts = [
    `Marque et modèle : ${vehicle.brand} ${vehicle.model}`,
    vehicle.trim ? `Finition / motorisation : ${vehicle.trim}` : null,
    firstRegLabel ? `1ère mise en circulation : ${firstRegLabel}` : null,
    vehicle.mileage != null ? `Kilométrage : ${vehicle.mileage} km` : null,
    `Carburant : ${FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType}`,
    vehicle.fiscalHorsepower ? `Puissance fiscale : ${vehicle.fiscalHorsepower} CV` : null,
    vehicle.co2Emissions != null ? `Émissions de CO2 : ${vehicle.co2Emissions} g/km` : null,
    vehicle.color ? `Couleur : ${vehicle.color}` : null,
    vehicle.salePrice != null ? `Prix de vente TTC : ${vehicle.salePrice.toString()} €` : null,
    vehicle.options.length > 0 ? `Options et équipements : ${vehicle.options.join(", ")}` : null,
    vehicle.notes ? `Notes internes (à ne pas recopier telles quelles) : ${vehicle.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const garageName = company?.name ?? "notre garage";
  const contactLines = [
    company?.name ?? null,
    company?.phone ? `Tél. ${company.phone}` : null,
    company?.email ?? null,
    company && (company.address || company.city) ? `${company.address} — ${company.postalCode} ${company.city}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `Tu rédiges, au nom du garage automobile professionnel "${garageName}", une annonce de vente pour un site comme La Centrale ou Leboncoin. C'est une annonce PROFESSIONNELLE de concessionnaire/garage, pas celle d'un particulier qui vend sa propre voiture : n'utilise jamais "je vends", "ma voiture", "mon véhicule" ni de ton familier. Adopte un ton commercial professionnel, rassurant (garantie, contrôle technique, reprise possible, financement possible si pertinent), à la 3e personne ou au nom de l'entreprise (ex. "${garageName} vous propose..."). Mets en avant les points forts du véhicule, reste factuel (n'invente aucune caractéristique non fournie). Si les émissions de CO2 sont fournies, mentionne-les explicitement : leur affichage est obligatoire dans les annonces de vente de véhicules. Termine OBLIGATOIREMENT l'annonce par un bloc séparé avec les coordonnées complètes de l'entreprise fournies ci-dessous (nom, téléphone, email, adresse), introduit par une formule du type "Contactez-nous :". Ne fournis que le texte de l'annonce, sans titre de section ni commentaire autour.`;

  const userPrompt = [
    `Rédige une annonce de vente pour ce véhicule :`,
    facts,
    contactLines ? `\nCoordonnées de l'entreprise à reprendre en bas de l'annonce :\n${contactLines}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const openai = getDeepSeekClient();
    const completion = await openai.chat.completions.create({
      model: "deepseek-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
    });

    const adCopy = completion.choices[0]?.message?.content?.trim();
    if (!adCopy) {
      return { error: "La génération n'a renvoyé aucun contenu. Réessayez." };
    }

    await prisma.vehicle.update({ where: { id: vehicleId }, data: { adCopy } });
    revalidatePath(`/vehicules/${vehicleId}`);

    return { adCopy };
  } catch (err) {
    console.error("Erreur DeepSeek:", err);
    return { error: "Erreur lors de la génération de l'annonce. Vérifiez la clé API DeepSeek et réessayez." };
  }
}

export async function saveVehicleListing(vehicleId: string, formData: FormData) {
  await verifySession();
  const adCopy = (formData.get("adCopy") as string | null)?.trim() || null;
  await prisma.vehicle.update({ where: { id: vehicleId }, data: { adCopy } });
  revalidatePath(`/vehicules/${vehicleId}`);
}
