"use client";

import { useState } from "react";
import { regenerateCalendarFeedToken, disableCalendarFeed } from "@/lib/actions/calendar-feed";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";

export function CalendarFeedSettings({ feedUrl }: { feedUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // presse-papiers indisponible, pas bloquant
    }
  }

  return (
    <div className="space-y-2">
      {feedUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
              {feedUrl}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "Copié !" : "Copier"}
            </Button>
          </div>
          <div className="flex gap-2">
            <form action={regenerateCalendarFeedToken}>
              <Button type="submit" variant="outline" size="sm">
                Régénérer le lien
              </Button>
            </form>
            <ConfirmSubmitButton
              action={disableCalendarFeed}
              confirmMessage="Désactiver le flux ? Le lien actuel cessera de fonctionner."
              label="Désactiver"
              variant="destructive"
              size="sm"
            />
          </div>
        </div>
      ) : (
        <form action={regenerateCalendarFeedToken}>
          <Button type="submit" variant="outline" size="sm">
            Générer un lien d&apos;abonnement
          </Button>
        </form>
      )}
      <p className="text-xs text-slate-400">
        Collez cette adresse dans Google Agenda via &quot;Ajouter un agenda&quot; → &quot;À partir d&apos;une
        URL&quot;. Lecture seule, mise à jour toutes les quelques heures (délai imposé par Google). Cette adresse
        contient un code secret : ne la partagez pas. Elle ne fonctionne que si le logiciel est accessible depuis
        Internet (pas sur un simple <code>localhost</code> en local).
      </p>
    </div>
  );
}
