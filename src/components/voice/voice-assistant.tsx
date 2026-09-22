"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { processVoiceCommand } from "@/lib/actions/voice";
import { Button } from "@/components/ui/button";

type Status = "idle" | "recording";

function pickExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  window.speechSynthesis.speak(utterance);
}

export function VoiceAssistant() {
  const [state, formAction] = useActionState(processVoiceCommand, undefined);
  const [status, setStatus] = useState<Status>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = pickExtension(mimeType);
        const file = new File([blob], `commande.${ext}`, { type: mimeType });

        const formData = new FormData();
        formData.set("audio", file);

        setStatus("idle");
        startTransition(() => {
          formAction(formData);
        });
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch {
      setMicError("Impossible d'accéder au microphone. Vérifiez les autorisations du navigateur.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  const processing = isPending;

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        {status !== "recording" ? (
          <Button type="button" onClick={startRecording} disabled={processing}>
            {processing ? "Traitement en cours..." : "🎙️ Parler"}
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={stopRecording}>
            ⏹ Arrêter l&apos;enregistrement
          </Button>
        )}
      </div>

      {micError && <p className="text-sm text-red-600">{micError}</p>}

      {state?.transcript && (
        <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <p className="text-slate-500 text-xs mb-1">Vous avez dit :</p>
          <p className="text-slate-800">{state.transcript}</p>
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      {state && state.error === undefined && <VoiceResponse text={state.response} />}

      <div className="text-xs text-slate-400 space-y-1">
        <p>Exemples de commandes :</p>
        <ul className="list-disc list-inside">
          <li>« Indique que la révision est terminée sur la Clio AB-123-CD »</li>
          <li>« Crée une fiche client pour Jean Dupont, téléphone 06 12 34 56 78 »</li>
          <li>« Quel est le prix de vente et la marge de la Clio AB-123-CD ? »</li>
        </ul>
      </div>
    </div>
  );
}

function VoiceResponse({ text }: { text: string }) {
  useEffect(() => {
    speak(text);
  }, [text]);

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <p className="text-slate-500 text-xs mb-1">Réponse :</p>
      <p className="text-slate-900">{text}</p>
    </div>
  );
}
