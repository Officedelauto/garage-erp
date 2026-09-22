import { verifySession } from "@/lib/dal";
import { VoiceAssistant } from "@/components/voice/voice-assistant";

export default async function VoicePage() {
  await verifySession();

  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-ink-900 mb-1">Assistant vocal</h1>
      <p className="text-sm text-slate-500 mb-4">
        Appuyez sur le micro et parlez : ajoutez une note véhicule, créez une fiche client, ou demandez des
        informations sur un véhicule.
      </p>
      <VoiceAssistant />
    </div>
  );
}
