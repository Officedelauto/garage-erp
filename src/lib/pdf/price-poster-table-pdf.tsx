import { Document as PdfDocument, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { pdfEur0, pdfNumber } from "@/lib/pdf/pdf-format";
import { frMonthYear, FUEL_LABELS, type PricePosterProps } from "@/lib/pdf/price-poster-shared";

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", color: "#111827" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  logo: { height: 36, maxWidth: 170, objectFit: "contain" },
  companyBlock: { textAlign: "right" },
  companyName: { fontSize: 11, fontWeight: 700 },
  companyMuted: { fontSize: 7.5, color: "#6b7280" },

  table: { borderWidth: 1, borderColor: "#111827", marginBottom: 18 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#111827" },
  rowLast: { flexDirection: "row" },
  labelCell: { width: "42%", backgroundColor: "#9ca3af", paddingVertical: 6, paddingHorizontal: 10 },
  labelText: { fontSize: 10, fontWeight: 700, color: "#ffffff", textTransform: "uppercase" },
  valueCell: { width: "58%", paddingVertical: 6, paddingHorizontal: 10, justifyContent: "center" },
  valueText: { fontSize: 10, fontWeight: 700, textTransform: "uppercase" },

  optionsTitle: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 },
  optionsValue: { fontSize: 9.5, lineHeight: 1.6, textTransform: "uppercase", marginBottom: 18 },

  priceBox: {
    borderWidth: 2,
    borderColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  priceLabel: { fontSize: 20, fontWeight: 700, textTransform: "uppercase" },
  priceValue: { fontSize: 36, fontWeight: 700, color: "#EA580C" },
  priceNote: { fontSize: 7, color: "#6b7280", marginTop: 6 },

  footer: { marginTop: 18, fontSize: 7, color: "#9ca3af", textAlign: "center" },
});

export function PricePosterTablePdf({
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
  transmission,
  warranty,
  stockNumber,
  options,
}: PricePosterProps) {
  const modelDenomination = [model, trim].filter(Boolean).join(" ");

  const rows = [
    { label: "Marque", value: brand },
    { label: "Modèle", value: modelDenomination },
    { label: "Énergie", value: fuelType ? (FUEL_LABELS[fuelType] ?? fuelType) : "—" },
    { label: "Kilométrage", value: mileage != null ? `${pdfNumber(mileage)} km` : "Non renseigné" },
    { label: "Puissance fiscale", value: fiscalHorsepower ? `${fiscalHorsepower} CV` : "—" },
    { label: "1ère MEC", value: frMonthYear(firstRegistrationDate) ?? "Non renseignée" },
    { label: "Boîte de vitesses", value: transmission || "—" },
    { label: "Émissions de CO2", value: co2Emissions != null ? `${pdfNumber(co2Emissions)} g/km` : "Non communiquées" },
    { label: "Garantie", value: warranty || "—" },
    { label: "Immatriculation", value: plate },
    ...(stockNumber ? [{ label: "N° VO", value: stockNumber }] : []),
  ];

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoPath ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, not an HTML <img>
            <Image src={logoPath} style={styles.logo} />
          ) : (
            <Text style={styles.companyName}>{companyName}</Text>
          )}
          <View style={styles.companyBlock}>
            {logoPath && <Text style={styles.companyName}>{companyName}</Text>}
            <Text style={styles.companyMuted}>
              {companyAddress}, {companyCity}
              {companyPhone ? ` — ${companyPhone}` : ""}
            </Text>
            <Text style={styles.companyMuted}>SIRET {companySiret}</Text>
          </View>
        </View>

        <View style={styles.table}>
          {rows.map((r, i) => (
            <View key={r.label} style={i === rows.length - 1 ? styles.rowLast : styles.row}>
              <View style={styles.labelCell}>
                <Text style={styles.labelText}>{r.label} :</Text>
              </View>
              <View style={styles.valueCell}>
                <Text style={styles.valueText}>{r.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {options && options.length > 0 && (
          <View>
            <Text style={styles.optionsTitle}>Équipements :</Text>
            <Text style={styles.optionsValue}>{options.join(" / ")}</Text>
          </View>
        )}

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Prix TTC* :</Text>
          <Text style={styles.priceValue}>{pdfEur0(price)}</Text>
        </View>
        <Text style={styles.priceNote}>*Hors frais d&apos;immatriculation. Kilométrage non garanti.</Text>

        <Text style={styles.footer}>
          {companyName} — {companyAddress}, {companyCity} — SIRET {companySiret} — document généré par Octane Connect
        </Text>
      </Page>
    </PdfDocument>
  );
}
