import { updatePosterTemplate } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    value: "CLASSIQUE",
    label: "Classique",
    description: "Présentation professionnelle classique : photo, prix en évidence, encadré mentions légales.",
  },
  {
    value: "MODERNE",
    label: "Moderne",
    description: "Photo pleine largeur avec le prix en incrustation, bandeau sombre, mise en page plus commerciale.",
  },
  {
    value: "MINIMALISTE",
    label: "Minimaliste",
    description: "Beaucoup d'espace blanc, typographie épurée, style sobre et élégant.",
  },
  {
    value: "ETIQUETTE",
    label: "Étiquette",
    description: "Bandeau marque/modèle bleu, grille d'informations et bloc options, façon étiquette de pare-brise.",
  },
  {
    value: "TABLEAU",
    label: "Tableau",
    description: "Tableau de caractéristiques en grille grise/blanche, liste d'équipements, gros encadré prix.",
  },
] as const;

export function PosterTemplateForm({ current }: { current: string }) {
  return (
    <form action={updatePosterTemplate} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <label
            key={t.value}
            className={cn(
              "flex flex-col gap-1 rounded-lg border p-3 text-sm cursor-pointer transition-colors",
              current === t.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"
            )}
          >
            <span className="flex items-center gap-2">
              <input type="radio" name="posterTemplate" value={t.value} defaultChecked={current === t.value} />
              <span className="font-semibold text-ink-900">{t.label}</span>
            </span>
            <span className="text-xs text-slate-500">{t.description}</span>
          </label>
        ))}
      </div>
      <Button type="submit" size="sm">
        Enregistrer le modèle
      </Button>
    </form>
  );
}
