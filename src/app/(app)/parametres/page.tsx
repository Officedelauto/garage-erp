import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { CompanyForm } from "./company-form";
import { CompanyLogoForm } from "@/components/settings/company-logo-form";
import { CalendarFeedSettings } from "@/components/settings/calendar-feed-settings";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  await verifySession();
  const company = await prisma.company.findFirst();

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const feedUrl = company?.calendarFeedToken && host
    ? `${protocol}://${host}/api/calendar/${company.calendarFeedToken}`
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-heading text-xl font-semibold text-ink-900">Réglages de l&apos;entreprise</h1>
        <Link href="/parametres/articles">
          <Button variant="outline" size="sm">
            Catalogue articles &amp; prestations →
          </Button>
        </Link>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Ces informations apparaissent sur les devis et factures. Le numéro de TVA n&apos;est requis que si vous êtes
        assujetti (sinon la mention &quot;TVA non applicable, art. 293 B du CGI&quot; sera ajoutée automatiquement).
      </p>
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Logo</h2>
        <CompanyLogoForm logoUrl={company?.logoUrl ?? null} />
      </div>

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
          orderPrefix: company?.orderPrefix ?? "BC",
          invoicePrefix: company?.invoicePrefix ?? "FA",
          creditNotePrefix: company?.creditNotePrefix ?? "AV",
        }}
      />

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Flux Google Agenda (planning atelier)</h2>
        <CalendarFeedSettings feedUrl={feedUrl} />
      </div>
    </div>
  );
}
