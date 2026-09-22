import { IdCard } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function SivPage() {
  await verifySession();

  return (
    <ComingSoon
      icon={IdCard}
      title="SIV"
      description="Démarches liées au Système d'Immatriculation des Véhicules (carte grise, déclaration de cession) via un partenaire habilité."
      bullets={[
        "Dépend du choix d'un partenaire habilité (ANTS ou prestataire agréé)",
        "Déclaration de cession d'achat",
        "Suivi des démarches carte grise",
      ]}
    />
  );
}
