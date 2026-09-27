import { parseIcon } from "@/utils/fontawesomeFull";

// Couleur d'une religion : son champ `color` s'il s'agit d'une couleur CSS valide,
// sinon une couleur de la palette dérivée de son identifiant.
// Même règle que la carte (Shard-Maps/assets/scripts/core/markers.js, ReligionColor) :
// une religion garde sa couleur sur le site et sur la carte.
// Palette : teintures de bannière du jeu (charte Tetrago).
const RELIGION_COLORS = [
  "#3c44aa", // bleu
  "#b02e26", // rouge
  "#5e7c16", // vert
  "#f9801d", // orange
  "#8932b8", // violet
  "#169c9c", // cyan
  "#c74ebd", // magenta
  "#80c71f", // vert clair
  "#835432", // marron
  "#3ab3da", // bleu clair
];

export function religionColor(religion) {
  const color = typeof religion?.color === "string" ? religion.color.trim() : "";
  if (color && CSS.supports("color", color)) return color;
  return RELIGION_COLORS[Math.abs(parseInt(religion?.id) || 0) % RELIGION_COLORS.length];
}

// Icône FontAwesome d'une religion (champ `icon`, ex. "fa-solid fa-cross"), ou l'icône par défaut si le champ est vide.
// Choisie parmi toutes les icônes : à afficher avec DynamicIcon et DEFAULT_RELIGION_ICON en repli (icône introuvable).
export const DEFAULT_RELIGION_ICON = "fa-solid fa-place-of-worship";

export function religionIcon(religion) {
  const icon = parseIcon(religion?.icon);
  return icon ? `${icon.prefix} fa-${icon.iconName}` : DEFAULT_RELIGION_ICON;
}

export function formatInfluence(influence) {
  if (influence == null) return "?";
  return `${Number(influence).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}
