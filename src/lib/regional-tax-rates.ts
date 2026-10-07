// Tarif régional du cheval fiscal (taxe Y.1 de la carte grise), fixé librement chaque année
// par chaque conseil régional, plafonné à 60 € au niveau national. Valeurs 2025 à titre
// indicatif pour les régions où une source récente et cohérente a été trouvée ; null quand
// aucune valeur fiable n'a pu être confirmée (l'utilisateur doit alors la renseigner lui-même).
// Ces tarifs évoluent chaque année : à vérifier sur le site officiel avant toute facturation.
export const REGIONAL_CV_RATES: Record<string, number | null> = {
  "Auvergne-Rhône-Alpes": null,
  "Bourgogne-Franche-Comté": null,
  "Bretagne": 60,
  "Centre-Val de Loire": 60,
  "Corse": 43,
  "Grand Est": 60,
  "Hauts-de-France": null,
  "Île-de-France": 54.95,
  "Normandie": 60,
  "Nouvelle-Aquitaine": 53,
  "Occitanie": null,
  "Pays de la Loire": null,
  "Provence-Alpes-Côte d'Azur": 59,
  "Guadeloupe": null,
  "Guyane": null,
  "Martinique": 30,
  "Mayotte": null,
  "La Réunion": 57,
};

// Frais fixes appliqués à toute carte grise : taxe de gestion (Y.4, 11 €) + redevance
// d'acheminement (Y.5, 2,76 €).
export const FIXED_REGISTRATION_FEES = 13.76;
