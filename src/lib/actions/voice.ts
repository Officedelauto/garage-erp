"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getOpenAIClient } from "@/lib/ai/openai";
import { getDeepSeekClient } from "@/lib/ai/deepseek";
import { clientDisplayName, formatEur } from "@/lib/utils";

export type VoiceCommandState =
  | { error: string; transcript?: string }
  | { error?: undefined; transcript: string; response: string }
  | undefined;

const IntentSchema = z.object({
  intent: z.enum(["ADD_VEHICLE_NOTE", "CREATE_CLIENT", "QUERY_VEHICLE", "QUERY_STOCK", "UNKNOWN"]),
  vehiclePlate: z.string().nullable().optional(),
  vehicleHint: z.string().nullable().optional(),
  noteContent: z.string().nullable().optional(),
  noteMileage: z.coerce.number().int().nullable().optional(),
  noteDate: z.string().nullable().optional(),
  clientFirstName: z.string().nullable().optional(),
  clientLastName: z.string().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  clientEmail: z.string().nullable().optional(),
  stockQuery: z.string().nullable().optional(),
});

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function findVehicle(plateGuess?: string | null, hint?: string | null) {
  const vehicles = await prisma.vehicle.findMany({ include: { client: true } });

  if (plateGuess) {
    const normalized = normalizePlate(plateGuess);
    const exact = vehicles.find((v) => normalizePlate(v.plate) === normalized);
    if (exact) return exact;
  }

  const needle = (plateGuess || hint || "").toLowerCase();
  if (needle) {
    const partial = vehicles.filter(
      (v) =>
        v.brand.toLowerCase().includes(needle) ||
        v.model.toLowerCase().includes(needle) ||
        needle.includes(v.brand.toLowerCase()) ||
        needle.includes(v.model.toLowerCase())
    );
    if (partial.length === 1) return partial[0];
  }

  return null;
}

export async function processVoiceCommand(_prevState: VoiceCommandState, formData: FormData): Promise<VoiceCommandState> {
  await verifySession();

  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return { error: "Aucun enregistrement audio reçu." };
  }

  let transcript: string;
  try {
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "fr",
    });
    transcript = transcription.text.trim();
  } catch (err) {
    console.error("Erreur Whisper:", err);
    return { error: "Erreur lors de la transcription audio. Vérifiez la clé API OpenAI et réessayez." };
  }

  if (!transcript) {
    return { error: "Je n'ai rien entendu. Réessayez en parlant plus près du micro." };
  }

  let intentData: z.infer<typeof IntentSchema>;
  try {
    const deepseek = getDeepSeekClient();
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-flash",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant vocal d'un garage automobile. La date du jour est ${new Date().toISOString().slice(0, 10)}. Analyse la phrase de l'utilisateur (transcrite depuis de la voix, donc potentiellement imparfaite) et renvoie UNIQUEMENT un objet JSON avec ces champs :
{
  "intent": "ADD_VEHICLE_NOTE" | "CREATE_CLIENT" | "QUERY_VEHICLE" | "QUERY_STOCK" | "UNKNOWN",
  "vehiclePlate": string ou null (la plaque d'immatriculation mentionnée, telle qu'entendue),
  "vehicleHint": string ou null (marque/modèle mentionné si pas de plaque claire),
  "noteContent": string ou null (pour ADD_VEHICLE_NOTE : reformule proprement l'intervention/révision effectuée, à la 3e personne, prête à archiver),
  "noteMileage": number ou null (kilométrage mentionné pour l'intervention),
  "noteDate": string ou null (date de l'intervention au format AAAA-MM-JJ, déduite si besoin de "aujourd'hui"/"hier" par rapport à la date du jour),
  "clientFirstName": string ou null,
  "clientLastName": string ou null,
  "clientPhone": string ou null,
  "clientEmail": string ou null,
  "stockQuery": string ou null (pour QUERY_STOCK : la pièce ou la taille de pneu recherchée, ex: "pneu 205 55 16" ou "plaquettes de frein avant")
}

Règles :
- "ADD_VEHICLE_NOTE" : l'utilisateur signale une intervention/révision/réparation faite sur un véhicule (ex: "vidange faite à 45000 km le 3 octobre sur la Clio AB123CD").
- "CREATE_CLIENT" : l'utilisateur veut créer une fiche client (ex: "crée une fiche client pour Jean Dupont, 0612345678").
- "QUERY_VEHICLE" : l'utilisateur demande des informations sur un véhicule (prix, marge, kilométrage, propriétaire...).
- "QUERY_STOCK" : l'utilisateur demande si une pièce ou un pneu est disponible en stock.
- "UNKNOWN" si la demande ne correspond à aucun cas ou est incompréhensible.
Réponds uniquement avec le JSON, sans texte autour.`,
        },
        { role: "user", content: transcript },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    intentData = IntentSchema.parse(JSON.parse(raw));
  } catch (err) {
    console.error("Erreur DeepSeek (intention):", err);
    return { error: "Erreur lors de l'analyse de la commande. Réessayez.", transcript };
  }

  try {
    switch (intentData.intent) {
      case "ADD_VEHICLE_NOTE": {
        const vehicle = await findVehicle(intentData.vehiclePlate, intentData.vehicleHint);
        if (!vehicle) {
          return {
            transcript,
            response: "Je n'ai pas trouvé ce véhicule. Merci de préciser l'immatriculation.",
          };
        }
        const content = intentData.noteContent?.trim() || transcript;
        const performedAt = intentData.noteDate ? new Date(intentData.noteDate) : undefined;
        const mileage = intentData.noteMileage ?? undefined;
        await prisma.vehicleNote.create({
          data: { vehicleId: vehicle.id, content, mileage, performedAt, source: "voice" },
        });
        const extra = [
          mileage ? `${mileage} km` : null,
          performedAt && !Number.isNaN(performedAt.getTime())
            ? `le ${performedAt.toLocaleDateString("fr-FR")}`
            : null,
        ]
          .filter(Boolean)
          .join(" ");
        return {
          transcript,
          response: `Note ajoutée sur ${vehicle.brand} ${vehicle.model} (${vehicle.plate}) : ${content}${extra ? ` (${extra})` : ""}`,
        };
      }

      case "CREATE_CLIENT": {
        if (!intentData.clientFirstName && !intentData.clientLastName) {
          return { transcript, response: "Merci de préciser le nom du client à créer." };
        }
        const client = await prisma.client.create({
          data: {
            type: "PARTICULIER",
            firstName: intentData.clientFirstName || null,
            lastName: intentData.clientLastName || null,
            phone: intentData.clientPhone || null,
            email: intentData.clientEmail || null,
          },
        });
        return {
          transcript,
          response: `Fiche client créée pour ${clientDisplayName(client)}.`,
        };
      }

      case "QUERY_VEHICLE": {
        const vehicle = await findVehicle(intentData.vehiclePlate, intentData.vehicleHint);
        if (!vehicle) {
          return {
            transcript,
            response: "Je n'ai pas trouvé ce véhicule. Merci de préciser l'immatriculation.",
          };
        }
        const parts: string[] = [
          `${vehicle.brand} ${vehicle.model}, immatriculée ${vehicle.plate}.`,
          `Propriétaire : ${clientDisplayName(vehicle.client)}.`,
        ];
        if (vehicle.mileage) parts.push(`Kilométrage : ${vehicle.mileage} kilomètres.`);
        if (vehicle.purchasePrice != null) parts.push(`Prix d'achat : ${formatEur(vehicle.purchasePrice.toString())}.`);
        if (vehicle.salePrice != null) parts.push(`Prix de vente : ${formatEur(vehicle.salePrice.toString())}.`);
        if (vehicle.purchasePrice != null && vehicle.salePrice != null) {
          const margin = Number(vehicle.salePrice) - Number(vehicle.purchasePrice);
          parts.push(`Marge potentielle : ${formatEur(margin)}.`);
        }
        return { transcript, response: parts.join(" ") };
      }

      case "QUERY_STOCK": {
        const query = intentData.stockQuery?.trim();
        if (!query) {
          return { transcript, response: "Merci de préciser la pièce ou la taille de pneu recherchée." };
        }
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const items = await prisma.stockItem.findMany();
        const matches = items.filter((item) => {
          const haystack = `${item.reference} ${item.name} ${item.description ?? ""}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        });

        if (matches.length === 0) {
          return { transcript, response: `Aucune pièce trouvée pour "${query}" dans le stock.` };
        }

        const summary = matches
          .slice(0, 5)
          .map((item) => `${item.name} (${item.reference}) : ${item.quantity} en stock`)
          .join(". ");
        return { transcript, response: summary };
      }

      default:
        return {
          transcript,
          response: "Je n'ai pas compris la demande. Vous pouvez ajouter une note véhicule, créer un client, interroger un véhicule, ou vérifier une pièce en stock.",
        };
    }
  } catch (err) {
    console.error("Erreur exécution commande vocale:", err);
    return { error: "Erreur lors de l'exécution de la commande.", transcript };
  }
}
