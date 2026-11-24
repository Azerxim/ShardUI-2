// ===== Catégories des journaux =====
// Mêmes clés que l'API (Shard-API services/salons_journaux.CATEGORIES). Sur Discord, le salon d'un journal va dans la
// catégorie platforms.discord.categories.journaux_<clé>, sinon dans celle des journaux.
// « monde » (adminOnly) : récits officiels du monde, choisie par les administrateurs seulement ; toujours en tête des
// listes et des filtres (premier de l'objet)
export const CATEGORIES_JOURNAUX = {
  monde: { label: "Monde", icon: "fa-solid fa-earth-europe", adminOnly: true },
  gazette: { label: "Gazette", icon: "fa-solid fa-newspaper" },
  chronique: { label: "Chronique", icon: "fa-solid fa-scroll" },
  correspondance: { label: "Correspondance", icon: "fa-solid fa-envelope" },
  carnet: { label: "Carnet", icon: "fa-solid fa-book-open" },
  proclamation: { label: "Proclamation", icon: "fa-solid fa-bullhorn" },
  divers: { label: "Divers", icon: "fa-solid fa-feather" },
};

export const CATEGORIE_JOURNAL_DEFAUT = "divers";

export const categorieJournal = (cle) => CATEGORIES_JOURNAUX[cle] ?? CATEGORIES_JOURNAUX[CATEGORIE_JOURNAL_DEFAUT];

// Couleur par défaut d'un journal (couverture, tampon, en-tête de sa page)
export const COULEUR_JOURNAL_DEFAUT = "#5865F2";
