import { Document as PdfDocument, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1e293b" },
  header: { marginBottom: 24 },
  companyName: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#64748b" },
  title: { fontSize: 18, fontWeight: 700, textAlign: "center", marginVertical: 28 },
  section: { marginBottom: 16 },
  label: { color: "#64748b", fontSize: 9, textTransform: "uppercase", marginBottom: 2 },
  value: { marginBottom: 10 },
  box: { border: "1px solid #e2e8f0", borderRadius: 4, padding: 12, marginBottom: 20 },
  paragraph: { lineHeight: 1.6, marginBottom: 20 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 48 },
  signatureBlock: { width: "45%" },
  footer: { marginTop: 40, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

function frDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

export type AttestationPdfProps = {
  company: { name: string; address: string; postalCode: string; city: string; siret: string; phone?: string | null; email?: string | null };
  client: { type: string; firstName?: string | null; lastName?: string | null; companyName?: string | null; address?: string | null; postalCode?: string | null; city?: string | null } | null;
  vehicle: { plate: string; brand: string; model: string; vin?: string | null };
  intervention: { content: string; mileage?: number | null; performedAt?: Date | string | null };
  issuedAt: Date;
};

export function AttestationPdf({ company, client, vehicle, intervention, issuedAt }: AttestationPdfProps) {
  const clientName = client
    ? client.type === "PROFESSIONNEL"
      ? client.companyName
      : `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim()
    : "Véhicule en stock (sans client)";

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text>{company.address}</Text>
          <Text>{company.postalCode} {company.city}</Text>
          <Text style={styles.muted}>SIRET : {company.siret}</Text>
          {company.phone && <Text style={styles.muted}>{company.phone}</Text>}
          {company.email && <Text style={styles.muted}>{company.email}</Text>}
        </View>

        <Text style={styles.title}>ATTESTATION DE TRAVAUX</Text>

        <View style={styles.box}>
          <Text style={styles.label}>Client</Text>
          <Text style={styles.value}>{clientName}</Text>
          <Text style={styles.label}>Véhicule</Text>
          <Text style={styles.value}>
            {vehicle.brand} {vehicle.model} — immatriculé {vehicle.plate}
            {vehicle.vin ? ` — VIN ${vehicle.vin}` : ""}
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Nous soussignés, {company.name}, attestons avoir réalisé l&apos;intervention suivante sur le véhicule
          désigné ci-dessus{intervention.performedAt ? `, le ${frDate(intervention.performedAt)}` : ""}
          {intervention.mileage ? `, au kilométrage de ${intervention.mileage} km` : ""} :
        </Text>

        <View style={styles.box}>
          <Text>{intervention.content}</Text>
        </View>

        <Text>Fait pour servir et valoir ce que de droit.</Text>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.label}>Fait à {company.city}, le {frDate(issuedAt)}</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.label}>Cachet et signature</Text>
          </View>
        </View>

        <Text style={styles.footer}>Document généré par Garage ERP</Text>
      </Page>
    </PdfDocument>
  );
}
