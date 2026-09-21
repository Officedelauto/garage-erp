import "server-only";
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY manquant dans les variables d'environnement.");
  }
  if (!client) {
    client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
  }
  return client;
}
