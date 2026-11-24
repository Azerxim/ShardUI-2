// ===== Catégories des livres =====
// Mêmes clés que l'API (Shard-API services/categories_livres.CATEGORIES), sur le modèle des journaux (config/journaux.js).
// « officiel » (adminOnly) : textes officiels du serveur (Codex, règlements), choisie par les administrateurs seulement ;
// toujours en tête des listes et des filtres (premier de l'objet)
export const CATEGORIES_LIVRES = {
  officiel: { label: "Textes officiels", icon: "fa-solid fa-landmark", adminOnly: true },
  lois: { label: "Lois", icon: "fa-solid fa-scale-balanced" },
  histoire: { label: "Histoire", icon: "fa-solid fa-hourglass-half" },
  legendes: { label: "Légendes", icon: "fa-solid fa-dragon" },
  religion: { label: "Religion", icon: "fa-solid fa-hands-praying" },
  traites: { label: "Traités", icon: "fa-solid fa-handshake" },
  recits: { label: "Récits", icon: "fa-solid fa-feather-pointed" },
  savoirs: { label: "Savoirs", icon: "fa-solid fa-flask" },
  divers: { label: "Divers", icon: "fa-solid fa-book" },
};

export const CATEGORIE_LIVRE_DEFAUT = "divers";

export const categorieLivre = (cle) => CATEGORIES_LIVRES[cle] ?? CATEGORIES_LIVRES[CATEGORIE_LIVRE_DEFAUT];
