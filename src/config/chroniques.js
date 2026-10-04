import { MOIS } from "@/config/calendrier";

// Chroniques de Tetrago (Shard-API crud_chroniques) : catégories de la frise
export const CATEGORIES_CHRONIQUES = {
    fondations: { label: "Fondations", icon: "fa-solid fa-landmark-flag", puce: "bg-primary/15 text-primary" },
    diplomatie: { label: "Diplomatie", icon: "fa-solid fa-handshake", puce: "bg-info/15 text-info" },
    guerres: { label: "Guerres", icon: "fa-solid fa-shield-halved", puce: "bg-error/15 text-error" },
    lignees: { label: "Lignées", icon: "fa-solid fa-sitemap", puce: "bg-secondary/15 text-secondary" },
    faits: { label: "Faits marquants", icon: "fa-solid fa-feather", puce: "bg-warning/20 text-warning-content" },
};

export const categorieChronique = (categorie) => CATEGORIES_CHRONIQUES[categorie] ?? CATEGORIES_CHRONIQUES.faits;

// Année RP : « 0412-12-28 » → 412 (null sans date)
export function anneeRp(iso) {
    const annee = Number(String(iso || "").split("-")[0]);
    return annee || null;
}

// Date RP « 0412-12-28 » → « 28 décembre de l'an 412 » (lue telle quelle : les années RP ne sont pas des années réelles)
export function dateRp(iso) {
    const [annee, mois, jour] = String(iso || "").split("-").map(Number);
    if (!annee || !mois || !jour) return null;
    return `${jour}${jour === 1 ? "er" : ""} ${MOIS[mois - 1]} de l'an ${annee}`;
}
