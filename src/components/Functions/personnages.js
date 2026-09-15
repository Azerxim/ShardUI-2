import { toOptions } from "./conflits";
import { getCivilisations, getPersonnageReferentiel, getQuartiers, getVilles } from "../../services/api";

// Libellés et formulaire partagés par les pages personnages, le profil et le journal

export const PERSONNAGE_STATUTS = {
    vivant: { label: "Vivant", badge: "badge-success", icon: "fa-solid fa-user" },
    mort: { label: "Mort", badge: "badge-neutral", icon: "fa-solid fa-skull" },
    disparu: { label: "Disparu", badge: "badge-warning", icon: "fa-solid fa-user-secret" },
};

export const SKIN_SOURCES = {
    aucun: "Aucun",
    minecraft: "Skin de mon compte Minecraft",
    lien: "Lien vers un fichier de skin",
};

// Rendus du skin Minecraft (UUID du compte lié), servis par mc-heads.net
export const minecraftHead = (uuid, size = 64) => `https://mc-heads.net/avatar/${uuid}/${size}`;
export const minecraftBody = (uuid, size = 120) => `https://mc-heads.net/body/${uuid}/${size}`;

export const villeHref = (ville) => `/civilisation/${ville.civilisation_id}/ville/${ville.id}`;

// Lieu de résidence le plus précis : « Quartier, Ville (Civilisation) »
export const residenceText = ({ civilisation, ville, quartier }) => {
    const lieu = [quartier?.title, ville?.title].filter(Boolean).join(", ");
    if (lieu && civilisation) return `${lieu} (${civilisation.title})`;
    return lieu || civilisation?.title || null;
};

// « Grade · Espèce · Classe », ce qui est renseigné
export const identityText = ({ personnage, espece, classe }) => [personnage?.grade, espece?.title, classe?.title].filter(Boolean).join(" · ") || null;

const asList = (value) => (Array.isArray(value) ? value : []);

// Civilisations, villes et quartiers proposés dans le formulaire
export const loadLieux = () => Promise.all([
    getCivilisations().catch(() => []),
    getVilles().catch(() => []),
    getQuartiers().catch(() => []),
]).then(([civilisations, villes, quartiers]) => ({
    civilisations: asList(civilisations).map((item) => item.civilisation).filter(Boolean),
    villes: asList(villes),
    quartiers: asList(quartiers),
}));

export const EMPTY_LIEUX = { civilisations: [], villes: [], quartiers: [] };

// Espèces et classes proposées dans le formulaire
export const loadReferentiel = () => getPersonnageReferentiel()
    .catch(() => null)
    .then((data) => ({ especes: asList(data?.especes), classes: asList(data?.classes) }));

export const EMPTY_REFERENTIEL = { especes: [], classes: [] };

export const personnageFormFields = (lieux, referentiel = EMPTY_REFERENTIEL) => [
    { name: "name", label: "Nom", type: "text", required: true, placeholder: "Nom du personnage" },
    {
        name: "status", label: "Statut", type: "radio", required: true,
        options: Object.entries(PERSONNAGE_STATUTS).map(([value, statut]) => ({ value, label: statut.label })),
    },
    { name: "espece_id", label: "Espèce", type: "select", placeholder: "Non précisée", options: toOptions(referentiel.especes), empty: "Aucune espèce n'est encore définie." },
    { name: "classe_id", label: "Classe", type: "select", placeholder: "Non précisée", options: toOptions(referentiel.classes), empty: "Aucune classe n'est encore définie." },
    { name: "grade", label: "Grade ou titre", type: "text", placeholder: "Capitaine de la garde, apprenti forgeron…" },
    { name: "description", label: "Histoire", type: "textarea", placeholder: "Origines, caractère, faits marquants… (Markdown accepté)" },
    { name: "image_url", label: "Portrait (adresse d'une image)", type: "url", placeholder: "https://…" },
    {
        name: "skin_source", label: "Skin", type: "radio", required: true,
        options: Object.entries(SKIN_SOURCES).map(([value, label]) => ({ value, label })),
        help: "Le skin Minecraft est celui du compte lié à votre profil ; sans portrait, sa tête sert d'avatar.",
    },
    { name: "skin_url", label: "Adresse du fichier de skin", type: "url", placeholder: "https://…/skin.png", help: "Utilisée seulement avec « Lien vers un fichier de skin »." },
    { name: "date_naissance", label: "Date de naissance dans le RP", type: "date" },
    { name: "date_deces", label: "Date de décès dans le RP", type: "date", help: "Ignorée tant que le personnage est vivant." },
    {
        name: "civilisation_id", label: "Civilisation", type: "select", placeholder: "Aucune", resets: ["ville_id", "quartier_id"],
        options: toOptions(lieux.civilisations), empty: "Aucune civilisation n'existe encore.",
    },
    {
        name: "ville_id", label: "Ville de résidence", type: "select", placeholder: "Aucune", resets: ["quartier_id"],
        options: (values) => toOptions(lieux.villes.filter((ville) => !values.civilisation_id || String(ville.civilisation_id) === String(values.civilisation_id))),
        empty: (values) => values.civilisation_id ? "Cette civilisation n'a pas encore de ville." : "Aucune ville n'existe encore.",
    },
    {
        name: "quartier_id", label: "Quartier", type: "select", placeholder: "Aucun",
        options: (values) => values.ville_id ? toOptions(lieux.quartiers.filter((quartier) => String(quartier.ville_id) === String(values.ville_id))) : [],
        empty: (values) => values.ville_id ? "Cette ville n'a pas encore de quartier." : "Choisissez d'abord une ville.",
    },
];

export const PERSONNAGE_INITIAL = { status: "vivant", skin_source: "aucun" };

const idValue = (value) => (value ? String(value) : "");

// Valeurs du formulaire d'édition à partir d'une fiche { personnage }
export const personnageInitialValues = (personnage) => ({
    name: personnage.name ?? "",
    status: personnage.status ?? "vivant",
    espece_id: idValue(personnage.espece_id),
    classe_id: idValue(personnage.classe_id),
    grade: personnage.grade ?? "",
    description: personnage.description ?? "",
    image_url: personnage.image_url ?? "",
    skin_source: personnage.skin_source || "aucun",
    skin_url: personnage.skin_url ?? "",
    date_naissance: personnage.date_naissance ?? "",
    date_deces: personnage.date_deces ?? "",
    civilisation_id: idValue(personnage.civilisation_id),
    ville_id: idValue(personnage.ville_id),
    quartier_id: idValue(personnage.quartier_id),
});
