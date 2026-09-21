import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquant dans les variables d'environnement.");
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}
