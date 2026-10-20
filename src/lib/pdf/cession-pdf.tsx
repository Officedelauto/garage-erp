import { Document as PdfDocument, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { pdfEur } from "@/lib/pdf/pdf-format";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1e293b" },
  header: { marginBottom: 16 },
  companyName: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#64748b" },
  title: { fontSize: 15, fontWeight: 700, textAlign: "center", marginVertical: 16 },
  subtitle: { fontSize: 10, textAlign: "center", color: "#64748b", marginBottom: 16 },
  disclaimer: {
    border: "1px solid #fbbf24",
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 18,
    fontSize: 9,
    lineHeight: 1.5,
    color: "#92400e",
  },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6, backgroundColor: "#f1f5f9", padding: 4 },
  row: { flexDirection: "row", marginBottom: 4 },
  cell: { flex: 1 },
  label: { color: "#64748b", fontSize: 8, textTransform: "uppercase" },
  value: { fontSize: 10 },
  toFillValue: { fontSize: 10, color: "#b91c1c" },
  footer: { marginTop: 24, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

function frDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

function field(label: string, value: string | null | undefined, toFill = false) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={toFill || !value ? styles.toFillValue : styles.value}>{value || "À compléter"}</Text>
    </View>
  );
}

export type CessionPdfProps = {
  company: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    siret: string;
    phone?: string | null;
    email?: string | null;
  };
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    trim?: string | null;
    vin?: string | null;
    firstRegistrationDate?: Date | string | null;
    mileage?: number | null;
    fuelType?: string | null;
    color?: string | null;
  };
  buyer: {
    type: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    siret?: string | null;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
  } | null;
  salePrice: number | string | null;
  depositAmount: number | string | null;
  depositDate: Date | string | null;
  issuedAt: Date;
};

export function CessionPdf({ company, vehicle, buyer, salePrice, depositAmount, depositDate, issuedAt }: CessionPdfProps) {
  const buyerName = buyer
    ? buyer.type === "PROFESSIONNEL"
      ? buyer.companyName
      : `${buyer.firstName ?? ""} ${buyer.lastName ?? ""}`.trim()
    : null;
  const buyerAddress = buyer && buyer.address ? `${buyer.address}, ${buyer.postalCode ?? ""} ${buyer.city ?? ""}`.trim() : null;

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text>{company.address}</Text>
          <Text>
            {company.postalCode} {company.city}
          </Text>
          <Text style={styles.muted}>SIRET : {company.siret}</Text>
        </View>

        <Text style={styles.title}>Aide au remplissage — Déclaration de cession</Text>
        <Text style={styles.subtitle}>Récapitulatif pour le Cerfa n°15776*02 (cession d&apos;un véhicule d&apos;occasion)</Text>

        <Text style={styles.disclaimer}>
          Ce document n&apos;est PAS le formulaire officiel Cerfa : il ne peut pas être signé ni déposé en l&apos;état. Il
          rassemble les informations connues par le garage pour vous aider à remplir rapidement le vrai formulaire (à
          obtenir sur service-public.fr ou via le site ANTS), à faire signer par le vendeur et l&apos;acheteur. Les champs
          marqués « À compléter » ne sont pas renseignés dans la fiche véhicule.
        </Text>

        <Text style={styles.sectionTitle}>Véhicule</Text>
        <View style={styles.row}>
          {field("Immatriculation", vehicle.plate)}
          {field("Marque", vehicle.brand)}
          {field("Modèle", vehicle.model)}
        </View>
        <View style={styles.row}>
          {field("Version / finition", vehicle.trim)}
          {field("N° de série (VIN)", vehicle.vin)}
          {field("1ère immatriculation", frDate(vehicle.firstRegistrationDate))}
        </View>
        <View style={styles.row}>
          {field("Kilométrage", vehicle.mileage != null ? `${vehicle.mileage} km` : null)}
          {field("Carburant", vehicle.fuelType)}
          {field("Couleur", vehicle.color)}
        </View>

        <Text style={styles.sectionTitle}>Vendeur (cédant)</Text>
        <View style={styles.row}>
          {field("Nom / Raison sociale", company.name)}
          {field("Adresse", `${company.address}, ${company.postalCode} ${company.city}`)}
          {field("SIRET", company.siret)}
        </View>
        <View style={styles.row}>
          {field("Téléphone", company.phone)}
          {field("Email", company.email)}
          {field("Date et lieu de naissance (si vendeur particulier)", null, true)}
        </View>

        <Text style={styles.sectionTitle}>Acheteur (cessionnaire)</Text>
        {buyer ? (
          <>
            <View style={styles.row}>
              {field("Nom / Raison sociale", buyerName)}
              {field("Adresse", buyerAddress)}
              {field("SIRET (si professionnel)", buyer.siret)}
            </View>
            <View style={styles.row}>
              {field("Date et lieu de naissance (si particulier)", null, true)}
              {field("N° de permis de conduire", null, true)}
              {field("Code de cession (fourni par l'acheteur)", null, true)}
            </View>
          </>
        ) : (
          <Text style={styles.toFillValue}>
            Aucun client identifié sur ce véhicule — à compléter manuellement (nom, adresse, date et lieu de naissance,
            code de cession).
          </Text>
        )}

        <Text style={styles.sectionTitle}>Transaction</Text>
        <View style={styles.row}>
          {field("Prix de cession", salePrice != null ? pdfEur(salePrice) : null)}
          {field("Acompte déjà versé", depositAmount != null ? pdfEur(depositAmount) : null)}
          {field("Date de l'acompte", depositDate ? frDate(depositDate) : null)}
        </View>
        <View style={styles.row}>
          {field("Date de cession prévue", null, true)}
          {field("Lieu de cession", company.city)}
          {field("Cession à titre onéreux / gratuit", "Onéreux")}
        </View>

        <Text style={styles.footer}>
          Fiche générée par Garage ERP le {frDate(issuedAt)} — ne remplace pas le formulaire Cerfa officiel.
        </Text>
      </Page>
    </PdfDocument>
  );
}
