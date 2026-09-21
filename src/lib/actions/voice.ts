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
  intent: z.enum(["ADD_VEHICLE_NOTE", "CREATE_CLIENT", "QUERY_VEHICLE", "UNKNOWN"]),
  vehiclePlate: z.string().nullable().optional(),
  vehicleHint: z.string().nullable().optional(),
  noteContent: z.string().nullable().optional(),
  clientFirstName: z.string().nullable().optional(),
  clientLastName: z.string().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  clientEmail: z.string().nullable().optional(),
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
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Tu es l'assistant vocal d'un garage automobile. Analyse la phrase de l'utilisateur (transcrite depuis de la voix, donc potentiellement imparfaite) et renvoie UNIQUEMENT un objet JSON avec ces champs :
{
  "intent": "ADD_VEHICLE_NOTE" | "CREATE_CLIENT" | "QUERY_VEHICLE" | "UNKNOWN",
  "vehiclePlate": string ou null (la plaque d'immatriculation mentionnée, telle qu'entendue),
  "vehicleHint": string ou null (marque/modèle mentionné si pas de plaque claire),
  "noteContent": string ou null (pour ADD_VEHICLE_NOTE : reformule proprement l'intervention/révision effectuée, à la 3e personne, prête à archiver),
  "clientFirstName": string ou null,
  "clientLastName": string ou null,
  "clientPhone": string ou null,
  "clientEmail": string ou null
}

Règles :
- "ADD_VEHICLE_NOTE" : l'utilisateur signale une intervention/révision/réparation faite sur un véhicule (ex: "indique que la révision est faite sur la Clio AB123CD").
- "CREATE_CLIENT" : l'utilisateur veut créer une fiche client (ex: "crée une fiche client pour Jean Dupont, 0612345678").
- "QUERY_VEHICLE" : l'utilisateur demande des informations sur un véhicule (prix, marge, kilométrage, propriétaire...).
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
        await prisma.vehicleNote.create({
          data: { vehicleId: vehicle.id, content, source: "voice" },
        });
        return {
          transcript,
          response: `Note ajoutée sur ${vehicle.brand} ${vehicle.model} (${vehicle.plate}) : ${content}`,
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

      default:
        return {
          transcript,
          response: "Je n'ai pas compris la demande. Vous pouvez ajouter une note véhicule, créer un client, ou demander des infos sur un véhicule.",
        };
    }
  } catch (err) {
    console.error("Erreur exécution commande vocale:", err);
    return { error: "Erreur lors de l'exécution de la commande.", transcript };
  }
}
