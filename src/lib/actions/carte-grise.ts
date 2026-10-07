"use server";

import * as z from "zod";
import path from "node:path";
import { verifySession } from "@/lib/dal";
import { getOpenAIClient } from "@/lib/ai/openai";

const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_TYPES = [...IMAGE_TYPES, "application/pdf"];

async function pdfFirstPageToPng(buffer: Buffer): Promise<Buffer> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");

  // Bundlers can't statically resolve pdfjs-dist's worker import, so we point it at the
  // real file on disk and let Node load it directly at runtime.
  pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );

  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");

  // @ts-expect-error -- pdfjs-dist's canvas typings target the DOM Canvas API; @napi-rs/canvas is a compatible server-side implementation.
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return Buffer.from(canvas.toBuffer("image/png"));
}

const FUEL_TYPES = ["ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL", "AUTRE"] as const;

const ExtractedSchema = z.object({
  plate: z.string().trim().nullable().optional(),
  brand: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  vin: z.string().trim().nullable().optional(),
  color: z.string().trim().nullable().optional(),
  firstRegistrationDate: z.string().trim().nullable().optional(),
  fiscalHorsepower: z.coerce.number().int().nullable().optional(),
  co2Emissions: z.coerce.number().int().nullable().optional(),
  fuelType: z.enum(FUEL_TYPES).nullable().optional(),
});

export type CarteGriseData = z.infer<typeof ExtractedSchema>;
export type CarteGriseState = { error?: string; data?: CarteGriseData } | undefined;

const SYSTEM_PROMPT = `Tu analyses la photo (ou le scan) d'un certificat d'immatriculation de véhicule (carte grise). Le format des champs par lettres/chiffres est harmonisé au niveau de l'Union européenne (directive 1999/37/CE) : le document peut donc être français ou provenir d'un autre pays de l'UE (allemand, espagnol, etc.), avec des libellés traduits mais les mêmes codes :
- A : numéro d'immatriculation
- B : date de première immatriculation (souvent au format JJ.MM.AAAA)
- D.1 : marque
- D.3 : dénomination commerciale (modèle)
- E : numéro d'identification du véhicule (VIN, exactement 17 caractères alphanumériques, jamais les lettres I, O, Q)
- P.3 : énergie / carburant
- P.6 : puissance fiscale administrative française (en CV). Ce champ est une spécificité française : il N'EXISTE PAS sur les certificats d'immatriculation des autres pays de l'UE. Si le document n'est pas français, laisse ce champ à null, même si un autre champ de puissance (ex. P.2, en kW) est présent — ne le convertis jamais en CV fiscaux, car ce n'est pas un calcul fiable.
- V.7 : émissions de CO2 en g/km. Relis chaque chiffre un par un avant de répondre, c'est un champ fréquemment mal lu.
La couleur du véhicule est parfois indiquée près du bloc d'identification, sans code de champ fixe (ex. "Farbe" en allemand).

RÈGLE DE PRUDENCE IMPORTANTE : pour le numéro d'immatriculation (A) et le VIN (E), ne renvoie une valeur QUE si tu es certain de lire CHAQUE caractère sans ambiguïté. S'il y a le moindre doute sur un seul caractère (flou, reflet, angle, résolution insuffisante), renvoie null pour ce champ entier plutôt qu'une valeur partiellement devinée — une information fausse est pire qu'une information manquante, l'utilisateur préfère resaisir le champ lui-même.

Réponds UNIQUEMENT avec un objet JSON strictement conforme à ce schéma, sans aucun texte autour :
{
  "plate": string ou null,
  "brand": string ou null,
  "model": string ou null,
  "vin": string ou null,
  "color": string ou null,
  "firstRegistrationDate": string au format AAAA-MM-JJ ou null,
  "fiscalHorsepower": nombre entier ou null,
  "co2Emissions": nombre entier (g/km) ou null,
  "fuelType": une valeur parmi "ESSENCE", "DIESEL", "HYBRIDE", "ELECTRIQUE", "GPL", "AUTRE", ou null
}

Si un champ est illisible, absent ou si l'image ne ressemble pas à un certificat d'immatriculation, mets sa valeur à null. N'invente jamais une valeur que tu ne peux pas lire avec certitude. N'extrais jamais le nom ou l'adresse du titulaire.`;

export async function extractCarteGrise(_prevState: CarteGriseState, formData: FormData): Promise<CarteGriseState> {
  await verifySession();

  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Merci de sélectionner une photo de la carte grise." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Format non supporté (JPEG, PNG, WebP ou PDF uniquement)." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Le fichier est trop volumineux (8 Mo max)." };
  }

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let mimeType = file.type;

  if (file.type === "application/pdf") {
    try {
      buffer = await pdfFirstPageToPng(buffer);
      mimeType = "image/png";
    } catch (err) {
      console.error("Erreur conversion PDF (carte grise):", err);
      return { error: "Impossible de lire ce PDF. Essayez avec une photo de la carte grise à la place." };
    }
  }

  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

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
