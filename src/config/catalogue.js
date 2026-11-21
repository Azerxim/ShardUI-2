import { montantTexte } from "@/config/monnaie";

// Catalogue des boutiques : catégories d'articles (mêmes clés que Shard-API crud_catalogue.CATEGORIES)
export const CATEGORIES_ARTICLES = [
    { value: "construction", label: "Blocs & construction", icon: "fa-solid fa-cubes" },
    { value: "ressources", label: "Minerais & ressources", icon: "fa-solid fa-gem" },
    { value: "outils", label: "Outils", icon: "fa-solid fa-hammer" },
    { value: "armes", label: "Armes & armures", icon: "fa-solid fa-shield-halved" },
    { value: "nourriture", label: "Nourriture", icon: "fa-solid fa-wheat-awn" },
    { value: "alchimie", label: "Potions & enchantements", icon: "fa-solid fa-flask" },
    { value: "services", label: "Services", icon: "fa-solid fa-handshake" },
    { value: "divers", label: "Divers", icon: "fa-solid fa-box-open" },
];

export const categorieArticle = (value) => CATEGORIES_ARTICLES.find((categorie) => categorie.value === value) ?? CATEGORIES_ARTICLES.at(-1);

// Prix en petits tetras (Shard-API crud_catalogue) : « 3 tetras », « 1 tetra et 4 petits tetras », « Offert »
export const prixTexte = (prixPetits) => (prixPetits === 0 ? "Offert" : montantTexte(prixPetits));

// « 1 tetra les 16 », « 5 petits tetras l'unité »
export const prixLot = (prixPetits, quantite = 1) => (prixPetits === 0 ? "Offert" : `${prixTexte(prixPetits)} ${quantite > 1 ? `les ${quantite.toLocaleString("fr-FR")}` : "l'unité"}`);
