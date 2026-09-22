import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { CompanyForm } from "./company-form";

export default async function SettingsPage() {
  await verifySession();
  const company = await prisma.company.findFirst();

  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-ink-900 mb-1">Réglages de l&apos;entreprise</h1>
      <p className="text-sm text-slate-500 mb-4">
        Ces informations apparaissent sur les devis et factures. Le numéro de TVA n&apos;est requis que si vous êtes
        assujetti (sinon la mention &quot;TVA non applicable, art. 293 B du CGI&quot; sera ajoutée automatiquement).
      </p>
      <CompanyForm
        defaults={{
          name: company?.name ?? "",
          address: company?.address ?? "",
          postalCode: company?.postalCode ?? "",
          city: company?.city ?? "",
          siret: company?.siret ?? "",
          vatNumber: company?.vatNumber ?? "",
          phone: company?.phone ?? "",
          email: company?.email ?? "",
          iban: company?.iban ?? "",
          quotePrefix: company?.quotePrefix ?? "DEV",
          invoicePrefix: company?.invoicePrefix ?? "FA",
        }}
      />
    </div>
  );
}
