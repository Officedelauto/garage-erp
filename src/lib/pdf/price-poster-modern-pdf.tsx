import { Document as PdfDocument, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { pdfEur0, pdfNumber } from "@/lib/pdf/pdf-format";
import { frMonthYear, FUEL_LABELS, type PricePosterProps } from "@/lib/pdf/price-poster-shared";

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", color: "#0f172a" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#0f172a",
  },
  logo: { height: 28, maxWidth: 140, objectFit: "contain" },
  topBarCompanyName: { fontSize: 12, fontWeight: 700, color: "#ffffff" },
  topBarMuted: { fontSize: 7, color: "#94a3b8", textAlign: "right" },

  photoWrap: { position: "relative", width: "100%", height: 260 },
  photo: { width: "100%", height: 260, objectFit: "cover" },
  photoPlaceholder: {
    width: "100%",
    height: 260,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  priceBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "#EA580C",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  priceBadgeValue: { fontSize: 26, fontWeight: 700, color: "#ffffff" },
  priceBadgeLabel: { fontSize: 7, color: "#ffedd5", textTransform: "uppercase", letterSpacing: 1 },

  body: { paddingHorizontal: 28, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 16 },

  specsStrip: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 10,
    marginBottom: 16,
  },
  specCell: { flex: 1, alignItems: "center" },
  specDivider: { width: 1, backgroundColor: "#e2e8f0" },
  specLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", marginBottom: 3 },
  specValue: { fontSize: 11, fontWeight: 700 },

  optionsTitle: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", marginBottom: 5 },
  optionsLine: { fontSize: 9, color: "#334155", lineHeight: 1.6, marginBottom: 16 },

  legalBox: { backgroundColor: "#f8fafc", borderRadius: 6, padding: 12, marginBottom: 14 },
  legalTitle: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6, letterSpacing: 0.5 },
  legalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  legalLabel: { fontSize: 9, color: "#64748b" },
  legalValue: { fontSize: 9, fontWeight: 700, color: "#0f172a" },

  footer: { fontSize: 7, color: "#94a3b8", textAlign: "center", paddingBottom: 20 },
});

export function PricePosterModernPdf({
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

  const specs = [
    { label: "Carburant", value: fuelType ? (FUEL_LABELS[fuelType] ?? fuelType) : "—" },
    { label: "CV fiscaux", value: fiscalHorsepower ? `${fiscalHorsepower} CV` : "—" },
    { label: "CO2", value: co2Emissions != null ? `${pdfNumber(co2Emissions)} g/km` : "Non communiqué" },
    { label: "Couleur", value: color ?? "—" },
  ];

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar}>
          {logoPath ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
            <Image src={logoPath} style={styles.logo} />
          ) : (
            <Text style={styles.topBarCompanyName}>{companyName}</Text>
          )}
          <Text style={styles.topBarMuted}>
            {companyAddress}, {companyCity}
            {companyPhone ? ` — ${companyPhone}` : ""}
          </Text>
        </View>

        <View style={styles.photoWrap}>
          {photoPath ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
            <Image src={photoPath} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={{ color: "#94a3b8" }}>Photo non disponible</Text>
            </View>
          )}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeValue}>{pdfEur0(price)}</Text>
            <Text style={styles.priceBadgeLabel}>Prix TTC</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{saleDenomination}</Text>
          <Text style={styles.subtitle}>Immatriculé {plate}</Text>

          <View style={styles.specsStrip}>
            {specs.flatMap((spec, i) => [
              i > 0 ? <View key={`${spec.label}-div`} style={styles.specDivider} /> : null,
              <View key={spec.label} style={styles.specCell}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>,
            ])}
          </View>

          {options && options.length > 0 && (
            <View>
              <Text style={styles.optionsTitle}>Équipements</Text>
              <Text style={styles.optionsLine}>{options.join("  •  ")}</Text>
            </View>
          )}

          <View style={styles.legalBox}>
            <Text style={styles.legalTitle}>Informations réglementaires</Text>
            <View style={styles.legalRow}>
              <Text style={styles.legalLabel}>Dénomination de vente</Text>
              <Text style={styles.legalValue}>{saleDenomination}</Text>
            </View>
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
              <Text style={styles.legalLabel}>Immatriculation</Text>
              <Text style={styles.legalValue}>{plate}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Prix toutes taxes comprises, hors coût du certificat d&apos;immatriculation. Kilométrage non garanti.{"\n"}
          {companyName} — SIRET {companySiret} — document généré par Garage ERP
        </Text>
      </Page>
    </PdfDocument>
  );
}
