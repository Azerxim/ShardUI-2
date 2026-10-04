import { dateRp } from "@/config/chroniques";

// Lignées et maisons nobles (Shard-API crud_lignees)

// Meubles du blason d'une maison
export const MAISON_ICONS = [
    "fa-solid fa-crown", "fa-solid fa-chess-rook", "fa-solid fa-dragon", "fa-solid fa-horse", "fa-solid fa-feather-pointed",
    "fa-solid fa-sun", "fa-solid fa-moon", "fa-solid fa-star", "fa-solid fa-tree", "fa-solid fa-fish", "fa-solid fa-dove", "fa-solid fa-shield",
];
export const MAISON_ICON_DEFAUT = "fa-solid fa-shield";
export const MAISON_COULEUR_DEFAUT = "#6b4f9e";

// Liens qu'on ajoute depuis la fiche d'un personnage P : relation de l'autre personnage à P
export const RELATIONS = {
    parent: { label: "Parent de", aide: "L'autre personnage est le père ou la mère de celui-ci." },
    enfant: { label: "Enfant de", aide: "L'autre personnage est le fils ou la fille de celui-ci." },
    conjoint: { label: "Conjoint de", aide: "Mariage : la date RP s'inscrit dans les chroniques." },
    heritier: { label: "Héritier de", aide: "L'autre personnage héritera de celui-ci, au rang indiqué (1 d'abord)." },
};

// Relation vue depuis P → corps de la demande à l'API
export function corpsLien(relation, personnageId, autreId) {
    if (relation === "parent") return { type: "parent", source_id: autreId, cible_id: personnageId };
    if (relation === "enfant") return { type: "parent", source_id: personnageId, cible_id: autreId };
    return { type: relation, source_id: personnageId, cible_id: autreId };
}

// Libellé d'une demande en attente : « Aldric, parent de Berthe »
export function texteDemande(lien) {
    const source = lien.source?.name ?? "?";
    const cible = lien.cible?.name ?? "?";
    if (lien.type === "parent") return `${source}, parent de ${cible}`;
    if (lien.type === "conjoint") return `${source} et ${cible}, conjoints`;
    return `${cible}, héritier de ${source}${lien.rang ? ` (rang ${lien.rang})` : ""}`;
}

// « né le 1er janvier de l'an 400 », « 400 – 452 »
export const vieRp = (personnage) => {
    const naissance = personnage?.date_naissance?.split("-")[0];
    const deces = personnage?.status === "mort" ? personnage?.date_deces?.split("-")[0] : null;
    if (!naissance && !deces) return null;
    return `${naissance ? Number(naissance) : "?"}${deces ? ` – ${Number(deces)}` : ""}`;
};

export { dateRp };
