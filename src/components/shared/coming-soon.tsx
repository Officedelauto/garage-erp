import { type LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  bullets,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-ink-900 mb-1">{title}</h1>
      <p className="text-sm text-slate-500 mb-6 max-w-xl">{description}</p>

      <div className="rounded-xl border border-dashed border-ink-900/15 bg-white p-8 max-w-xl">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={20} strokeWidth={2} />
        </span>
        <p className="text-sm font-semibold text-ink-900 mb-2">Bientôt disponible</p>
        {bullets && bullets.length > 0 && (
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
