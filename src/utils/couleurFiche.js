import { getContrastTextColor } from "@/utils/contrastColor";

// ===== Couleurs des en-têtes de fiche (charte « Chancellerie + Héraldique ») =====
// Une fiche prend la couleur de son élément (maison, religion, alliance, couverture, frontière d'une civilisation…) ;
// sans couleur, un des émaux du logo, dérivé de l'identifiant : une fiche garde toujours la même couleur.
const EMAUX = [
  "#2e4fb0", // azur
  "#b3263a", // gueules
  "#1f7a55", // sinople
  "#17131f", // encre
];

export const OR = "#e3a82b";
export const ENCRE = "#17131f";

// Couleur CSS valide, sinon null
export function couleurValide(couleur) {
  const valeur = typeof couleur === "string" ? couleur.trim() : "";
  return valeur && CSS.supports("color", valeur) ? valeur : null;
}

export function couleurFiche(couleur, id) {
  return couleurValide(couleur) ?? EMAUX[Math.abs(parseInt(id) || 0) % EMAUX.length];
}

// Texte posé sur la couleur : encre ou blanc (même règle YIQ que contrastColor.js)
export function encreSur(couleur) {
  return getContrastTextColor(couleur) === "#000000" ? ENCRE : "#ffffff";
}

// Métal du blason posé sur l'aplat : de l'or, sauf sur une couleur claire où l'or ne se verrait pas (alors l'encre)
export function metalSur(couleur) {
  return encreSur(couleur) === ENCRE ? ENCRE : OR;
}
