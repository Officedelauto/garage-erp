// @react-pdf/renderer (police Helvetica de base) ne sait pas afficher l'espace fine
// insécable (U+202F) que Intl.NumberFormat("fr-FR") utilise comme séparateur de
// milliers : le glyphe manquant s'affiche comme un "/" dans le PDF. On reformate
// donc avec un espace normal.
function toPlainSpace(value: string) {
  return value.replace(/[  ]/g, " ");
}

export function pdfEur(amount: number | string) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount));
  return toPlainSpace(formatted);
}

export function pdfEur0(amount: number | string) {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
  return toPlainSpace(formatted);
}

export function pdfNumber(value: number | string) {
  return toPlainSpace(new Intl.NumberFormat("fr-FR").format(Number(value)));
}
