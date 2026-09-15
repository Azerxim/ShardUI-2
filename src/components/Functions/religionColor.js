import { parseIcon } from "./fontawesomeFull";

// Couleur d'une religion : son champ `color` s'il s'agit d'une couleur CSS valide,
// sinon une couleur de la palette dérivée de son identifiant.
// Même règle que la carte (ShardUI-2-Maps/assets/scripts/markers.js, ReligionColor) :
// une religion garde sa couleur sur le site et sur la carte.
const RELIGION_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#0891b2",
  "#db2777",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
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
