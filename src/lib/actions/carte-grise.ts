"use server";

import * as z from "zod";
import { verifySession } from "@/lib/dal";
import { getOpenAIClient } from "@/lib/ai/openai";

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const FUEL_TYPES = ["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL", "AUTRE"] as const;

const ExtractedSchema = z.object({
  plate: z.string().trim().nullable().optional(),
  brand: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  vin: z.string().trim().nullable().optional(),
  color: z.string().trim().nullable().optional(),
  firstRegistrationDate: z.string().trim().nullable().optional(),
  fiscalHorsepower: z.coerce.number().int().nullable().optional(),
  fuelType: z.enum(FUEL_TYPES).nullable().optional(),
});

export type CarteGriseData = z.infer<typeof ExtractedSchema>;
export type CarteGriseState = { error?: string; data?: CarteGriseData } | undefined;

const SYSTEM_PROMPT = `Tu analyses la photo d'une carte grise française (certificat d'immatriculation). Les champs officiels sont codés par des lettres :
- A : numéro d'immatriculation
- B : date de première immatriculation (souvent au format JJ.MM.AAAA)
- D.1 : marque
- D.3 : dénomination commerciale (modèle)
- E : numéro d'identification du véhicule (VIN, 17 caractères alphanumériques)
- P.3 : énergie / carburant
- P.6 : puissance fiscale (en CV)
La couleur du véhicule est parfois indiquée près du bloc d'identification, sans code de champ fixe.

Réponds UNIQUEMENT avec un objet JSON strictement conforme à ce schéma, sans aucun texte autour :
{
  "plate": string ou null,
  "brand": string ou null,
  "model": string ou null,
  "vin": string ou null,
  "color": string ou null,
  "firstRegistrationDate": string au format AAAA-MM-JJ ou null,
  "fiscalHorsepower": nombre entier ou null,
  "fuelType": une valeur parmi "ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL", "AUTRE", ou null
}

Si un champ est illisible, absent ou si l'image ne ressemble pas à une carte grise, mets sa valeur à null. N'invente jamais une valeur que tu ne peux pas lire. N'extrais jamais le nom ou l'adresse du titulaire.`;

export async function extractCarteGrise(_prevState: CarteGriseState, formData: FormData): Promise<CarteGriseState> {
  await verifySession();

  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Merci de sélectionner une photo de la carte grise." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Format non supporté (JPEG, PNG ou WebP uniquement)." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "L'image est trop volumineuse (8 Mo max)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Voici la photo d'une carte grise. Extrait les champs demandés." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return { error: "L'analyse n'a renvoyé aucun résultat. Réessayez avec une photo plus nette." };
    }

    const parsed = ExtractedSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { error: "La réponse de l'IA n'a pas pu être interprétée. Réessayez." };
    }

    if (Object.values(parsed.data).every((v) => v == null)) {
      return { error: "Aucune information lisible sur cette image. Essayez une photo plus nette, bien cadrée sur la carte grise." };
    }

    return { data: parsed.data };
  } catch (err) {
    console.error("Erreur OpenAI (carte grise):", err);
    return { error: "Erreur lors de l'analyse de l'image. Vérifiez la clé API OpenAI et réessayez." };
  }
}
