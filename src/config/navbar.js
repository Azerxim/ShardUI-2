import { MAPS_BASE_URL } from "@/config/maps";

// ===== Sections du site =====
// Source unique des liens de navigation : la barre du haut (components/layout/Navbar.jsx : liens et menus déroulants
// visibles sur grand écran, mêmes groupes dans le menu latéral) et la barre des sections des pages de liste
// (components/layout/DynamicNavbar.jsx).

export const LAUNCH = [
  { id: "codex", href: "/codex", icon: "fa-solid fa-scroll", text: "Codex" },
];

export const DECOUVRIR = [
  { id: "codex", href: "/codex", icon: "fa-solid fa-scroll", text: "Codex" },
];

// Bibliothèque : une seule page, dont l'ancre choisit ce qu'elle affiche (pages/bibliotheque/BibliothequePage.jsx)
export const BIBLIOTHEQUE = [
  { id: "journaux", href: "/bibliotheque#journaux", icon: "fa-solid fa-newspaper", text: "Journaux" },
  { id: "livres", href: "/bibliotheque#livres", icon: "fa-solid fa-book-open", text: "Livres" },
];

// Outils du quotidien (pages/outils/OutilsPage.jsx) ; avant le lancement aussi, pour préparer sa candidature
export const OUTILS = { id: "outils", href: "/outils", icon: "fa-solid fa-toolbox", text: "Outils" };

// Aides et utilitaires : bouton « ? » à droite de la barre du haut, à côté de la recherche
export const AIDES = { id: "aides", href: "/aides", icon: "fa-solid fa-life-ring", text: "Aides" };

export const MONDE = [
  { id: "civilisations", href: "/civilisations", icon: "fa-solid fa-flag", text: "Civilisations" },
  { id: "commerces", href: "/commerces", icon: "fa-solid fa-shop", text: "Commerces" },
  { id: "religions", href: "/religions", icon: "fa-solid fa-cross", text: "Religions" },
  { id: "personnages", href: "/personnages", icon: "fa-solid fa-masks-theater", text: "Personnages" },
  { id: "maisons", href: "/maisons", icon: "fa-solid fa-chess-king", text: "Maisons" },
  { id: "alliances", href: "/alliances", icon: "fa-solid fa-handshake", text: "Alliances" },
  { id: "guerres", href: "/guerres", icon: "fa-solid fa-shield-halved", text: "Guerres" },
  { id: "elections", href: "/elections", icon: "fa-solid fa-check-to-slot", text: "Élections" },
  { id: "actions", href: "/actions-secretes", icon: "fa-solid fa-user-secret", text: "Actions secrètes" },
  { id: "fermes", href: "/fermes", icon: "fa-solid fa-wheat-awn", text: "Fermes" },
];

// Infos : se repérer sur le serveur et dans son histoire
export const INFOS = [
  AIDES,
  OUTILS,
  { id: "calendrier", href: "/calendrier", icon: "fa-solid fa-calendar-days", text: "Calendrier" },
  { id: "chroniques", href: "/chroniques", icon: "fa-solid fa-timeline", text: "Chroniques" },
  { id: "roadmap", href: "/roadmap", icon: "fa-solid fa-route", text: "Feuille de route" },
];

// Menus déroulants de la barre du haut, repris en groupes dans le menu latéral ; `page` : identifiant de page (Navbar
// active) qui marque aussi le groupe, quand la page n'est pas un de ses liens
export const GROUPES = [
  { id: "bibliotheque", titre: "Bibliothèque", icon: "fa-solid fa-book", page: "bibliotheque", liens: BIBLIOTHEQUE },
  { id: "monde", titre: "Monde", titreMenu: "Le monde", icon: "fa-solid fa-earth-europe", liens: MONDE },
  { id: "infos", titre: "Infos", icon: "fa-solid fa-circle-info", liens: INFOS },
];

// Vue unifiée de la carte : civilisations, commerces et guerres ensemble, avec légende (Shard-Maps layers/unifier.js)
export const CARTE = { id: "carte", href: `${MAPS_BASE_URL}/tetrago-unifier`, icon: "fa-solid fa-map", text: "Carte" };

// Groupes de la barre des sections
export const SECTIONS = [
  { id: "decouvrir", titre: "Découvrir", liens: [...DECOUVRIR, CARTE] },
  ...GROUPES.map(({ id, titre, titreMenu, liens }) => ({ id, titre: titreMenu ?? titre, liens })),
];
