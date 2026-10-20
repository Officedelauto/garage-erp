import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";

// Formulaire officiel Cerfa n°15776*01 — certificat de cession d'un véhicule d'occasion,
// fourni par l'utilisateur (PDF remplissable). On y écrit directement les champs du
// formulaire plutôt que de reconstituer un document qui imiterait l'original.
const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/pdf/templates/cerfa-15776-cession.pdf");

function frDateDigits(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}${mm}${yyyy}`;
}

// Découpe une adresse libre ("12 avenue de la République") en numéro de voie + reste,
// pour correspondre aux champs séparés du Cerfa. Le type de voie n'est pas isolé
// séparément : il reste dans le "reste" pour éviter une analyse hasardeuse sur un
// document administratif.
function splitAddress(address: string | null | undefined): { num: string; rest: string } {
  if (!address) return { num: "", rest: "" };
  const match = address.trim().match(/^(\d+)[\s,]*(.*)$/);
  if (match) return { num: match[1], rest: match[2] };
  return { num: "", rest: address.trim() };
}

function digitsOnly(value: string | null | undefined, maxLen: number): string {
  if (!value) return "";
  return value.replace(/\D/g, "").slice(0, maxLen);
}

function truncate(value: string, maxLen: number): string {
  return value.slice(0, maxLen);
}

export async function renderCessionCerfaPdf(vehicleId: string) {
  const [company, vehicle] = await Promise.all([
    prisma.company.findFirst(),
    prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { client: true, reservedByClient: true },
    }),
  ]);
  if (!company || !vehicle) return null;

  const buyer = vehicle.reservedByClient ?? vehicle.client;

  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  const text = (name: string, value: string, maxLen?: number) => {
    try {
      form.getTextField(name).setText(maxLen ? truncate(value, maxLen) : value);
    } catch {
      // Certains champs n'existent que sur l'une des deux pages (exemplaires) du formulaire.
    }
  };
  const radio = (name: string, value: string | null) => {
    try {
      const field = form.getRadioGroup(name);
      if (value) field.select(value);
      else field.clear();
    } catch {
      // idem
    }
  };
  const checkbox = (name: string, checked: boolean) => {
    try {
      const field = form.getCheckBox(name);
      if (checked) field.check();
      else field.uncheck();
    } catch {
      // idem
    }
  };

  const sellerAddress = splitAddress(company.address);
  const buyerAddress = buyer ? splitAddress(buyer.address) : { num: "", rest: "" };
  const buyerIdentity = buyer
    ? buyer.type === "PROFESSIONNEL"
      ? (buyer.companyName ?? "")
      : `${buyer.lastName ?? ""} ${buyer.firstName ?? ""}`.trim()
    : "";

  for (const page of ["Page1", "Page2"] as const) {
    const p = (field: string) => `topmostSubform[0].${page}[0].${field}[0]`;

    // Véhicule
    text(p("num_Immatriculation"), vehicle.plate, 9);
    text(p("num_Identification"), vehicle.vin ?? "", 17);
    text(p("txt_MarqueVéhicule"), vehicle.brand);
    text(p("txt_DénominationCommerciale"), vehicle.model);
    text(p("num_KilométrageCompteur"), vehicle.mileage != null ? String(vehicle.mileage) : "");

    // Vendeur (l'ancien propriétaire est toujours le garage, qui revend un véhicule
    // qu'il a lui-même acquis en stock).
    radio(p("Groupe_de_boutons_radio3"), "1"); // Personne morale
    text(p("txt_IdentitéVendeur"), company.name);
    text(p("Num_Siret"), digitsOnly(company.siret, 14), 14);
    text(p("num_VoieAdresse"), sellerAddress.num);
    text(p("txt_NomVoie"), sellerAddress.rest);
    text(p("num_CodePostalAdresse"), digitsOnly(company.postalCode, 5), 5);
    text(p("txt_CommuneAdresse"), company.city);

    radio(p("Groupe_de_boutons_radio4"), "1"); // Céder (et non céder pour destruction)

    // Acheteur (client identifié sur le véhicule, s'il y en a un)
    radio(p("Groupe_de_boutons_radio5"), buyer ? (buyer.type === "PROFESSIONNEL" ? "1" : "2") : null);
    radio(p("Groupe_de_boutons_radio6"), null); // Sexe : non connu dans la fiche client
    text(p("txt_IdentitéAcheteur"), buyerIdentity);
    text(p("num_SiretAcheteur"), buyer ? digitsOnly(buyer.siret, 14) : "", 14);
    text(p("num_VoieAdresseAcheteur"), buyerAddress.num);
    text(p("txt_NomVoieAdresseAcheteur"), buyerAddress.rest);
    text(p("num_CodePostalAdresseAcheteur"), buyer ? digitsOnly(buyer.postalCode, 5) : "", 5);
    text(p("txt_CommuneAdresseAcheteur"), buyer?.city ?? "");

    // Les attestations sur l'honneur doivent être cochées par les parties elles-mêmes,
    // pas pré-remplies automatiquement.
    checkbox(p("ckb_ValidationDéclarationA1"), false);
    checkbox(p("ckb_ValidationDéclarationA2"), false);
  }

  // Champ présent uniquement sur la page 1 (1ère immatriculation).
  text("topmostSubform[0].Page1[0].txt_Date1erImmatriculation[0]", frDateDigits(vehicle.firstRegistrationDate), 8);

  // "Fait à" du vendeur : nom de champ différent entre les deux pages.
  text("topmostSubform[0].Page1[0].txt_LieuDéclaration[0]", company.city);
  text("topmostSubform[0].Page2[0].txt_LieuDéclaration1[0]", company.city);

  form.updateFieldAppearances();
  const outBytes = await pdfDoc.save();
  return { buffer: Buffer.from(outBytes), vehicle };
}
