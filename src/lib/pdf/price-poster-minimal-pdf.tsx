import { Document as PdfDocument, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { pdfEur0, pdfNumber } from "@/lib/pdf/pdf-format";
import { frMonthYear, FUEL_LABELS, type PricePosterProps } from "@/lib/pdf/price-poster-shared";

const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, fontFamily: "Helvetica", color: "#1e1e1e" },

  companyRow: { alignItems: "center", marginBottom: 28 },
  logo: { height: 32, maxWidth: 160, objectFit: "contain", marginBottom: 6 },
  companyName: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" },
  companyMuted: { fontSize: 7.5, color: "#9ca3af", marginTop: 2 },

  photo: { width: "100%", height: 220, objectFit: "cover", marginBottom: 28 },
  photoPlaceholder: {
    width: "100%",
    height: 220,
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },

  title: { fontFamily: "Times-Roman", fontSize: 26, textAlign: "center", marginBottom: 4 },
  subtitle: {
    fontSize: 9,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },

  rule: { borderTopWidth: 0.5, borderTopColor: "#d1d5db", marginVertical: 20 },

  price: { fontFamily: "Times-Roman", fontSize: 34, textAlign: "center" },
  priceLabel: { fontSize: 8, color: "#9ca3af", textAlign: "center", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 },

  specsLine: { fontSize: 9, color: "#4b5563", textAlign: "center", marginTop: 4 },

  optionsLine: { fontSize: 8.5, color: "#9ca3af", textAlign: "center", marginTop: 10, lineHeight: 1.6 },

  legalTitle: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  legalRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 4 },
  legalLabel: { fontSize: 8.5, color: "#9ca3af" },
  legalValue: { fontSize: 8.5, color: "#1e1e1e", fontWeight: 700 },

  footer: { marginTop: 24, fontSize: 7, color: "#b0b4ba", textAlign: "center" },
});

export function PricePosterMinimalPdf({
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
  const saleDenomination = [brand, model, trim].filter(Boolean).join(" ");
  const firstRegLabel = frMonthYear(firstRegistrationDate);

  const specLine = [
    fuelType ? (FUEL_LABELS[fuelType] ?? fuelType) : null,
    fiscalHorsepower ? `${fiscalHorsepower} CV` : null,
    co2Emissions != null ? `${pdfNumber(co2Emissions)} g/km CO2` : "CO2 non communiqué",
    color,
  ]
    .filter(Boolean)
    .join("   ·   ");

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.companyRow}>
          {logoPath && (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
            <Image src={logoPath} style={styles.logo} />
          )}
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.companyMuted}>
            {companyAddress}, {companyCity}
            {companyPhone ? ` — ${companyPhone}` : ""}
          </Text>
        </View>

        {photoPath ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
          <Image src={photoPath} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={{ color: "#cbd5e1", fontSize: 9 }}>Photo non disponible</Text>
          </View>
        )}

        <Text style={styles.title}>{saleDenomination}</Text>
        <Text style={styles.subtitle}>Immatriculé {plate}</Text>

        <Text style={styles.price}>{pdfEur0(price)}</Text>
        <Text style={styles.priceLabel}>Prix TTC</Text>
        <Text style={styles.specsLine}>{specLine}</Text>

        {options && options.length > 0 && <Text style={styles.optionsLine}>{options.join("   ·   ")}</Text>}

        <View style={styles.rule} />

        <Text style={styles.legalTitle}>Mentions obligatoires</Text>
        <View style={styles.legalRow}>
          <Text style={styles.legalLabel}>1ère mise en circulation</Text>
          <Text style={styles.legalValue}>{firstRegLabel ?? "Non renseignée"}</Text>
        </View>
        <View style={styles.legalRow}>
          <Text style={styles.legalLabel}>Kilométrage</Text>
          <Text style={styles.legalValue}>
            {mileage != null ? `${pdfNumber(mileage)} km (non garanti)` : "Non renseigné"}
          </Text>
        </View>
        <View style={styles.legalRow}>
          <Text style={styles.legalLabel}>Prix de vente TTC</Text>
          <Text style={styles.legalValue}>{pdfEur0(price)}</Text>
        </View>

        <Text style={styles.footer}>
          Prix toutes taxes comprises, hors coût du certificat d&apos;immatriculation. Kilométrage non garanti.{"\n"}
          {companyName} — {companyAddress}, {companyCity} — SIRET {companySiret}
        </Text>
      </Page>
    </PdfDocument>
  );
}
