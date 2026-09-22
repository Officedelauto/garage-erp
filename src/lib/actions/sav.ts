"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getDeepSeekClient } from "@/lib/ai/deepseek";
import { clientDisplayName } from "@/lib/utils";
import { MESSAGE_TYPES, type SavMessageType } from "@/lib/sav-message-types";

const SavSchema = z.object({
  problemDescription: z.string().trim().min(5, "Merci de décrire le problème (5 caractères minimum)."),
  messageType: z.enum(Object.keys(MESSAGE_TYPES) as [SavMessageType, ...SavMessageType[]]),
  clientId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
});

export type SavFormState = { error?: string; message?: string } | undefined;

export async function generateSavMessage(_prevState: SavFormState, formData: FormData): Promise<SavFormState> {
  await verifySession();

  const parsed = SavSchema.safeParse({
    problemDescription: formData.get("problemDescription"),
    messageType: formData.get("messageType"),
    clientId: formData.get("clientId") || null,
    vehicleId: formData.get("vehicleId") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champs invalides." };
  }

  const { problemDescription, messageType, clientId, vehicleId } = parsed.data;

  const [company, client, vehicle] = await Promise.all([
    prisma.company.findFirst(),
    clientId ? prisma.client.findUnique({ where: { id: clientId } }) : null,
    vehicleId ? prisma.vehicle.findUnique({ where: { id: vehicleId } }) : null,
  ]);

  const contextLines: string[] = [];
  if (client) contextLines.push(`Client : ${clientDisplayName(client)}`);
  if (vehicle) contextLines.push(`Véhicule : ${vehicle.plate} — ${vehicle.brand} ${vehicle.model}`);

  const garageName = company?.name ?? "notre garage";
  const typeConfig = MESSAGE_TYPES[messageType];

  const systemPrompt = `Tu es l'assistant SAV (service après-vente) du garage automobile "${garageName}", en France. Tu rédiges des messages professionnels, courtois et clairs en français, destinés à être envoyés à un client par email ou SMS. N'utilise jamais de crochets ou de placeholders comme [Nom] : rédige un texte prêt à être envoyé, avec une formule de politesse générique si le prénom du client n'est pas fourni. Signe le message "L'équipe ${garageName}". Ne fournis que le message final, sans commentaire ni explication autour.`;

  const userPrompt = [
    typeConfig.instruction,
    contextLines.length > 0 ? `Contexte :\n${contextLines.join("\n")}` : null,
    `Problème signalé par l'atelier :\n${problemDescription}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const openai = getDeepSeekClient();
    const completion = await openai.chat.completions.create({
      model: "deepseek-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    const message = completion.choices[0]?.message?.content?.trim();
    if (!message) {
      return { error: "La génération n'a renvoyé aucun contenu. Réessayez." };
    }

    return { message };
  } catch (err) {
    console.error("Erreur DeepSeek:", err);
    return { error: "Erreur lors de la génération du message. Vérifiez la clé API DeepSeek et réessayez." };
  }
}
