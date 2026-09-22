import { CalendarClock } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function AtelierPage() {
  await verifySession();

  return (
    <ComingSoon
      icon={CalendarClock}
      title="Atelier"
      description="Planning de l'atelier : rendez-vous, attribution des tâches au personnel, et alimentation du planning à la voix."
      bullets={[
        "Prise et suivi des rendez-vous",
        "Planning du personnel par jour/semaine",
        "Attribution de tâches (ex. \"François à 9h fera la vidange de la voiture de M. Bernard\")",
        "Alimentation du planning par commande vocale",
      ]}
    />
  );
}
