import { Document as PdfDocument, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { pdfEur0, pdfNumber } from "@/lib/pdf/pdf-format";
import { frMonthYear, FUEL_LABELS, type PricePosterProps } from "@/lib/pdf/price-poster-shared";

const BLUE = "#1d3a8a";
const ORANGE = "#EA580C";

const styles = StyleSheet.create({
  page: { padding: 28, fontFamily: "Helvetica", color: "#1e293b" },

  companyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  logo: { height: 28, maxWidth: 140, objectFit: "contain" },
  companyName: { fontSize: 11, fontWeight: 700 },
  companyMuted: { fontSize: 7.5, color: "#64748b", textAlign: "right" },

  headerBar: { backgroundColor: BLUE, borderRadius: 6, padding: 12, marginBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingVertical: 2 },
  headerLabel: { fontSize: 9, color: "#bfdbfe", textTransform: "uppercase", letterSpacing: 1 },
  headerValue: { fontSize: 18, fontWeight: 700, color: "#ffffff" },

  photo: { width: "100%", height: 200, objectFit: "cover", borderRadius: 6, marginBottom: 12 },
  photoPlaceholder: {
    width: "100%",
    height: 200,
    marginBottom: 12,
    border: "1px dashed #cbd5e1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  grid: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, marginBottom: 12 },
  cell: {
    width: "50%",
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  cellLabel: { fontSize: 7.5, color: "#64748b", textTransform: "uppercase", marginBottom: 2 },
  cellValue: { fontSize: 11, fontWeight: 700 },

  optionsBox: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, padding: 10, marginBottom: 14 },
  optionsLabel: { fontSize: 8, fontWeight: 700, color: BLUE, textTransform: "uppercase", marginBottom: 4 },
  optionsValue: { fontSize: 9, color: "#334155", lineHeight: 1.5 },

  priceBlock: { alignItems: "center", marginBottom: 6 },
  price: { fontSize: 42, fontWeight: 700, color: ORANGE },
  priceCaption: { fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
  priceNote: { fontSize: 7, color: "#94a3b8", marginTop: 2 },

  footer: { marginTop: 14, fontSize: 7, color: "#94a3b8", textAlign: "center" },
});

export function PricePosterTagPdf({
  companyName,
  companySiret,
  companyAddress,
  companyCity,
  companyPhone,
  logoPath,
  brand,
  model,
  trim,
  plate,
  price,
  mileage,
  firstRegistrationDate,
  fuelType,
  fiscalHorsepower,
  co2Emissions,
  color,
  options,
  photoPath,
}: PricePosterProps) {
  const firstRegLabel = frMonthYear(firstRegistrationDate);

  const fields = [
    { label: "1ère mise en circulation", value: firstRegLabel ?? "Non renseignée" },
    { label: "Finition", value: trim ?? "—" },
    { label: "Kilométrage", value: mileage != null ? `${pdfNumber(mileage)} km (non garanti)` : "Non renseigné" },
    { label: "Immatriculation", value: plate },
    { label: "Carburant", value: fuelType ? (FUEL_LABELS[fuelType] ?? fuelType) : "—" },
    { label: "Puissance fiscale", value: fiscalHorsepower ? `${fiscalHorsepower} CV` : "—" },
    { label: "Émissions de CO2", value: co2Emissions != null ? `${pdfNumber(co2Emissions)} g/km` : "Non communiquées" },
    { label: "Couleur", value: color ?? "—" },
  ];

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.companyRow}>
          {logoPath ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
            <Image src={logoPath} style={styles.logo} />
          ) : (
            <Text style={styles.companyName}>{companyName}</Text>
          )}
          <Text style={styles.companyMuted}>
            {companyAddress}, {companyCity}
            {companyPhone ? ` — ${companyPhone}` : ""} — SIRET {companySiret}
          </Text>
        </View>

        <View style={styles.headerBar}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Marque</Text>
            <Text style={styles.headerValue}>{brand}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Modèle</Text>
            <Text style={styles.headerValue}>{model}</Text>
          </View>
        </View>

        {photoPath ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
          <Image src={photoPath} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={{ color: "#94a3b8" }}>Photo non disponible</Text>
          </View>
        )}

        <View style={styles.grid}>
          {fields.map((f) => (
            <View key={f.label} style={styles.cell}>
              <Text style={styles.cellLabel}>{f.label}</Text>
              <Text style={styles.cellValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {options && options.length > 0 && (
          <View style={styles.optionsBox}>
            <Text style={styles.optionsLabel}>Options</Text>
            <Text style={styles.optionsValue}>{options.join(" - ")}</Text>
          </View>
        )}

        <View style={styles.priceBlock}>
          <Text style={styles.price}>{pdfEur0(price)}</Text>
          <Text style={styles.priceCaption}>T.T.C.</Text>
          <Text style={styles.priceNote}>Hors coût du certificat d&apos;immatriculation</Text>
        </View>

        <Text style={styles.footer}>
          Prix toutes taxes comprises, hors coût du certificat d&apos;immatriculation. Kilométrage non garanti.{"\n"}
          {companyName} — {companyAddress}, {companyCity} — SIRET {companySiret} — document généré par Octane Connect
        </Text>
      </Page>
    </PdfDocument>
  );
}
