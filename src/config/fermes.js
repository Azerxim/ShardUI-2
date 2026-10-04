// Déclaration des fermes (Shard-API crud_fermes) : types (mêmes clés que crud_fermes.TYPES) et statuts
export const TYPES_FERMES = [
    { value: "cultures", label: "Cultures", icon: "fa-solid fa-wheat-awn" },
    { value: "elevage", label: "Élevage", icon: "fa-solid fa-cow" },
    { value: "mobs", label: "Mobs", icon: "fa-solid fa-skull" },
    { value: "ressources", label: "Minerais & ressources", icon: "fa-solid fa-gem" },
    { value: "automatique", label: "Machine automatique", icon: "fa-solid fa-gears" },
    { value: "autre", label: "Autre", icon: "fa-solid fa-seedling" },
];

export const typeFerme = (value) => TYPES_FERMES.find((type) => type.value === value) ?? TYPES_FERMES.at(-1);

export const STATUTS_FERMES = {
    en_attente: { label: "En attente", badge: "badge-warning", icon: "fa-solid fa-hourglass-half" },
    validee: { label: "Validée", badge: "badge-success", icon: "fa-solid fa-circle-check" },
    a_corriger: { label: "À mettre en conformité", badge: "badge-error", icon: "fa-solid fa-triangle-exclamation" },
};
