import { Document as PdfDocument, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", color: "#1e293b" },
  companyName: { fontSize: 12, fontWeight: 700, marginBottom: 24, textAlign: "center", color: "#64748b" },
  photo: { width: "100%", height: 260, objectFit: "cover", borderRadius: 6, marginBottom: 20 },
  photoPlaceholder: {
    width: "100%",
    height: 260,
    marginBottom: 20,
    border: "1px dashed #cbd5e1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 20 },
  price: { fontSize: 48, fontWeight: 700, textAlign: "center", color: "#EA580C", marginBottom: 24 },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 },
  specBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    margin: 4,
    alignItems: "center",
  },
  specLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 },
  specValue: { fontSize: 13, fontWeight: 700 },
  footer: { marginTop: 32, fontSize: 9, color: "#94a3b8", textAlign: "center" },
});

function frDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("fr-FR", { month: "2-digit", year: "numeric" }).format(new Date(d));
}

export type PricePosterProps = {
  companyName: string;
  brand: string;
  model: string;
  plate: string;
  price: string | number;
  mileage?: number | null;
  firstRegistrationDate?: Date | string | null;
  fuelType?: string;
  fiscalHorsepower?: number | null;
  color?: string | null;
  photoPath?: string | null;
};

const FUEL_LABELS: Record<string, string> = {
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
  ELECTRIQUE: "Électrique",
  GPL: "GPL",
  AUTRE: "Autre",
};

export function PricePosterPdf({
  companyName,
  brand,
  model,
  plate,
  price,
  mileage,
  firstRegistrationDate,
  fuelType,
  fiscalHorsepower,
  color,
  photoPath,
}: PricePosterProps) {
  const specs = [
    mileage != null ? { label: "Kilométrage", value: `${mileage.toLocaleString("fr-FR")} km` } : null,
    firstRegistrationDate ? { label: "1ère mise en circ.", value: frDate(firstRegistrationDate)! } : null,
    fuelType ? { label: "Carburant", value: FUEL_LABELS[fuelType] ?? fuelType } : null,
    fiscalHorsepower ? { label: "CV fiscaux", value: `${fiscalHorsepower} CV` } : null,
    color ? { label: "Couleur", value: color } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <Text style={styles.companyName}>{companyName}</Text>

        {photoPath ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
          <Image src={photoPath} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={{ color: "#94a3b8" }}>Photo non disponible</Text>
          </View>
        )}

        <Text style={styles.title}>{brand} {model}</Text>
        <Text style={styles.subtitle}>Immatriculé {plate}</Text>

        <Text style={styles.price}>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(price))}</Text>

        <View style={styles.specsGrid}>
          {specs.map((spec) => (
            <View key={spec.label} style={styles.specBox}>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>{companyName} — document généré par Garage ERP</Text>
      </Page>
    </PdfDocument>
  );
}
