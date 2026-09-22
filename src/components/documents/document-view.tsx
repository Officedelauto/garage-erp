import { clientDisplayName, formatDate, formatEur } from "@/lib/utils";

const LINE_TYPE_LABELS: Record<string, string> = {
  PART: "Pièce",
  LABOR: "Main d'œuvre",
  OTHER: "Autre",
};

type DocumentWithRelations = {
  number: string | null;
  issueDate: Date | null;
  dueDate: Date | null;
  notes: string | null;
  totalHT: unknown;
  totalTVA: unknown;
  totalTTC: unknown;
  client: { type: string; firstName: string | null; lastName: string | null; companyName: string | null };
  vehicle: { plate: string; brand: string; model: string } | null;
  lines: {
    id: string;
    type: string;
    description: string;
    quantity: unknown;
    unitPriceHT: unknown;
    vatRate: unknown;
  }[];
};

export function DocumentView({ document }: { document: DocumentWithRelations }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Client</p>
          <p className="font-medium text-slate-900">{clientDisplayName(document.client)}</p>
        </div>
        <div>
          <p className="text-slate-500">Véhicule</p>
          <p className="font-medium text-slate-900">
            {document.vehicle ? `${document.vehicle.plate} — ${document.vehicle.brand} ${document.vehicle.model}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Date d&apos;émission</p>
          <p className="font-medium text-slate-900">{formatDate(document.issueDate)}</p>
        </div>
        {document.dueDate && (
          <div>
            <p className="text-slate-500">Échéance</p>
            <p className="font-medium text-slate-900">{formatDate(document.dueDate)}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-ink-900/10 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Qté</th>
              <th className="px-3 py-2 font-medium">Prix HT</th>
              <th className="px-3 py-2 font-medium">TVA</th>
              <th className="px-3 py-2 font-medium text-right">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {document.lines.map((line) => (
              <tr key={line.id}>
                <td className="px-3 py-2 text-slate-500">{LINE_TYPE_LABELS[line.type] ?? line.type}</td>
                <td className="px-3 py-2">{line.description}</td>
                <td className="px-3 py-2">{line.quantity?.toString()}</td>
                <td className="px-3 py-2">{formatEur(line.unitPriceHT as string)}</td>
                <td className="px-3 py-2">{line.vatRate?.toString()}%</td>
                <td className="px-3 py-2 text-right">
                  {formatEur(Number(line.quantity) * Number(line.unitPriceHT))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total HT</span>
            <span>{formatEur(document.totalHT as string)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">TVA</span>
            <span>{formatEur(document.totalTVA as string)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Total TTC</span>
            <span>{formatEur(document.totalTTC as string)}</span>
          </div>
        </div>
      </div>

      {document.notes && (
        <div>
          <p className="text-slate-500 text-sm mb-1">Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{document.notes}</p>
        </div>
      )}
    </div>
  );
}
