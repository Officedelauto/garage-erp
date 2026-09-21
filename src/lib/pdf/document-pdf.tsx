import { Document as PdfDocument, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#64748b" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2, textAlign: "right" },
  section: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  box: { padding: 8, border: "1px solid #e2e8f0", borderRadius: 4, width: "48%" },
  boxLabel: { color: "#64748b", marginBottom: 2, fontSize: 8, textTransform: "uppercase" },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", paddingVertical: 6, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", paddingVertical: 6, paddingHorizontal: 4 },
  colDesc: { width: "40%" },
  colType: { width: "14%" },
  colQty: { width: "10%", textAlign: "right" },
  colPrice: { width: "12%", textAlign: "right" },
  colVat: { width: "10%", textAlign: "right" },
  colTotal: { width: "14%", textAlign: "right" },
  totals: { alignSelf: "flex-end", width: "40%", marginTop: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalTTC: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTop: "1px solid #1e293b", fontWeight: 700 },
  footer: { marginTop: 32, fontSize: 8, color: "#64748b" },
});

const LINE_TYPE_LABELS: Record<string, string> = {
  PART: "Pièce",
  LABOR: "Main d'œuvre",
  OTHER: "Autre",
};

function eur(n: number | string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(n));
}

function frDate(d: Date | string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

type CompanySnapshot = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  siret: string;
  vatNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  iban?: string | null;
};

export type DocumentPdfProps = {
  kind: "QUOTE" | "INVOICE";
  number: string | null;
  issueDate: Date | string | null;
  dueDate: Date | string | null;
  company: CompanySnapshot;
  client: {
    type: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    siret?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
  };
  vehicle: { plate: string; brand: string; model: string; vin?: string | null } | null;
  lines: {
    id: string;
    type: string;
    description: string;
    quantity: number | string;
    unitPriceHT: number | string;
    vatRate: number | string;
  }[];
  totalHT: number | string;
  totalTVA: number | string;
  totalTTC: number | string;
};

export function DocumentPdf({ kind, number, issueDate, dueDate, company, client, vehicle, lines, totalHT, totalTVA, totalTTC }: DocumentPdfProps) {
  const title = kind === "QUOTE" ? "DEVIS" : "FACTURE";
  const clientName =
    client.type === "PROFESSIONNEL" ? client.companyName : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim();

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text>{company.address}</Text>
            <Text>{company.postalCode} {company.city}</Text>
            <Text style={styles.muted}>SIRET : {company.siret}</Text>
            {company.vatNumber && <Text style={styles.muted}>TVA : {company.vatNumber}</Text>}
            {company.phone && <Text style={styles.muted}>{company.phone}</Text>}
            {company.email && <Text style={styles.muted}>{company.email}</Text>}
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={{ textAlign: "right" }}>{number}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Client</Text>
            <Text>{clientName}</Text>
            {client.type === "PROFESSIONNEL" && client.siret && <Text style={styles.muted}>SIRET : {client.siret}</Text>}
            {client.address && <Text>{client.address}</Text>}
            {(client.postalCode || client.city) && <Text>{client.postalCode} {client.city}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Date d&apos;émission</Text>
            <Text>{frDate(issueDate)}</Text>
            {dueDate && (
              <>
                <Text style={[styles.boxLabel, { marginTop: 6 }]}>Échéance</Text>
                <Text>{frDate(dueDate)}</Text>
              </>
            )}
            {vehicle && (
              <>
                <Text style={[styles.boxLabel, { marginTop: 6 }]}>Véhicule</Text>
                <Text>{vehicle.plate} — {vehicle.brand} {vehicle.model}</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colType}>Type</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix HT</Text>
            <Text style={styles.colVat}>TVA</Text>
            <Text style={styles.colTotal}>Total HT</Text>
          </View>
          {lines.map((line) => (
            <View style={styles.tableRow} key={line.id}>
              <Text style={styles.colType}>{LINE_TYPE_LABELS[line.type] ?? line.type}</Text>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colPrice}>{eur(line.unitPriceHT)}</Text>
              <Text style={styles.colVat}>{line.vatRate}%</Text>
              <Text style={styles.colTotal}>{eur(Number(line.quantity) * Number(line.unitPriceHT))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Total HT</Text>
            <Text>{eur(totalHT)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total TVA</Text>
            <Text>{eur(totalTVA)}</Text>
          </View>
          <View style={styles.totalTTC}>
            <Text>Total TTC</Text>
            <Text>{eur(totalTTC)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {!company.vatNumber && <Text>TVA non applicable, art. 293 B du CGI.</Text>}
          {kind === "INVOICE" && (
            <>
              <Text>
                Pénalités de retard : taux d&apos;intérêt légal majoré de 10 points. Indemnité forfaitaire pour frais de
                recouvrement : 40 €.
              </Text>
              {company.iban && <Text>IBAN : {company.iban}</Text>}
            </>
          )}
        </View>
      </Page>
    </PdfDocument>
  );
}
