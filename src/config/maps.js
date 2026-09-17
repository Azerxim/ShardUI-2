// Adresse de ShardUI-2-Maps, partagée par les cartes intégrées, les liens du site et l'éditeur.
// VITE_MAPS_BASE_URL la fixe (http://localhost:3005 en développement, voir .env.development) ;
// sans elle, la carte en ligne sert de repli.
export const MAPS_BASE_URL = import.meta.env.VITE_MAPS_BASE_URL || "https://map.beta.tetrago.fr";

// Origine seule, pour vérifier la provenance des messages de l'éditeur
export const MAPS_ORIGIN = new URL(MAPS_BASE_URL).origin;
