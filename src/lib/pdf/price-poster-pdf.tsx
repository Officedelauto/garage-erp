import { Document as PdfDocument, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { pdfEur0, pdfNumber } from "@/lib/pdf/pdf-format";

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", color: "#1e293b" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  logo: { height: 40, maxWidth: 160, objectFit: "contain" },
  companyBlock: { textAlign: "right" },
  companyName: { fontSize: 12, fontWeight: 700 },
  companyMuted: { fontSize: 8, color: "#64748b" },

  photo: { width: "100%", height: 250, objectFit: "cover", borderRadius: 6, marginBottom: 16 },
  photoPlaceholder: {
    width: "100%",
    height: 250,
    marginBottom: 16,
    border: "1px dashed #cbd5e1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 24, fontWeight: 700, textAlign: "center", marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#64748b", textAlign: "center", marginBottom: 16 },

  price: { fontSize: 40, fontWeight: 700, textAlign: "center", color: "#EA580C" },
  priceLabel: { fontSize: 9, color: "#64748b", textAlign: "center", marginBottom: 18, textTransform: "uppercase" },

  // Bloc mentions obligatoires (arrêté du 18 juin 1991) : caractères apparents,
  // de dimensions similaires entre eux.
  legalBox: { border: "1px solid #1e293b", borderRadius: 4, padding: 12, marginBottom: 16 },
  legalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  legalLabel: { fontSize: 10, color: "#475569" },
  legalValue: { fontSize: 10, fontWeight: 700 },

  specsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 },
  specBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 3,
    alignItems: "center",
  },
  specLabel: { fontSize: 7, color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 },
  specValue: { fontSize: 11, fontWeight: 700 },

  footer: { marginTop: 24, fontSize: 7, color: "#94a3b8", textAlign: "center" },
});

function frMonthYear(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Intl.DateTimeFormat("fr-FR", { month: "2-digit", year: "numeric" }).format(new Date(d));
}

export type PricePosterProps = {
  companyName: string;
  companySiret: string;
  companyAddress: string;
  companyCity: string;
  logoPath?: string | null;
  brand: string;
  model: string;
  trim?: string | null;
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
  companySiret,
  companyAddress,
  companyCity,
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
  color,
  photoPath,
}: PricePosterProps) {
  const saleDenomination = [brand, model, trim].filter(Boolean).join(" ");
  const firstRegLabel = frMonthYear(firstRegistrationDate);

  const specs = [
    fuelType ? { label: "Carburant", value: FUEL_LABELS[fuelType] ?? fuelType } : null,
    fiscalHorsepower ? { label: "CV fiscaux", value: `${fiscalHorsepower} CV` } : null,
    color ? { label: "Couleur", value: color } : null,
    { label: "Immatriculation", value: plate },
  ].filter(Boolean) as { label: string; value: string }[];

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
            <Text style={styles.companyMuted}>{companyAddress} — {companyCity}</Text>
            <Text style={styles.companyMuted}>SIRET {companySiret}</Text>
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

        <Text style={styles.title}>{saleDenomination}</Text>
        <Text style={styles.subtitle}>Immatriculé {plate}</Text>

        <Text style={styles.price}>{pdfEur0(price)}</Text>
        <Text style={styles.priceLabel}>Prix TTC</Text>

        <View style={styles.legalBox}>
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
            <Text style={styles.legalLabel}>Prix de vente TTC</Text>
            <Text style={styles.legalValue}>{pdfEur0(price)}</Text>
          </View>
        </View>

        <View style={styles.specsGrid}>
          {specs.map((spec) => (
            <View key={spec.label} style={styles.specBox}>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Prix toutes taxes comprises, hors coût du certificat d&apos;immatriculation. Kilométrage non garanti.{"\n"}
          {companyName} — {companyAddress}, {companyCity} — SIRET {companySiret} — document généré par Garage ERP
        </Text>
      </Page>
    </PdfDocument>
  );
}
