import { MAPS_BASE_URL } from "@/config/maps";

// ===== Sections du site =====
// Source unique des liens de navigation : la barre du haut (components/layout/Navbar.jsx : liens visibles sur grand
// écran, menu burger) et la barre des sections des pages de liste (components/layout/DynamicNavbar.jsx).

export const DECOUVRIR = [
  { id: "codex", href: "/codex", icon: "fa-solid fa-scroll", text: "Codex" },
  { id: "bibliotheque", href: "/bibliotheque", icon: "fa-solid fa-book", text: "Bibliothèque" },
];

export const MONDE = [
  { id: "civilisations", href: "/civilisations", icon: "fa-solid fa-flag", text: "Civilisations" },
  { id: "religions", href: "/religions", icon: "fa-solid fa-cross", text: "Religions" },
  { id: "commerces", href: "/commerces", icon: "fa-solid fa-shop", text: "Commerces" },
  { id: "alliances", href: "/alliances", icon: "fa-solid fa-handshake", text: "Alliances" },
  { id: "guerres", href: "/guerres", icon: "fa-solid fa-shield-halved", text: "Guerres" },
  { id: "personnages", href: "/personnages", icon: "fa-solid fa-masks-theater", text: "Personnages" },
  { id: "actions", href: "/actions-secretes", icon: "fa-solid fa-user-secret", text: "Actions secrètes" },
  { id: "fermes", href: "/fermes", icon: "fa-solid fa-wheat-awn", text: "Fermes" },
];

export const CARTE = { id: "carte", href: `${MAPS_BASE_URL}/tetrago-civilisations`, icon: "fa-solid fa-map", text: "Carte" };

// Groupes de la barre des sections
export const SECTIONS = [
  { id: "decouvrir", titre: "Découvrir", liens: [...DECOUVRIR, CARTE] },
  { id: "monde", titre: "Le monde", liens: MONDE },
];
