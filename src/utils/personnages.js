import { toOptions } from "@/utils/conflits";
import { apiRequest, envoyerPortraitPersonnage, envoyerSkinPersonnage, fichierPersonnageUrl, retirerPortraitPersonnage, getCivilisations, getPersonnageReferentiel, getQuartiers, getVilles } from "@/services/api";

// Libellés et formulaire partagés par les pages personnages, le profil et le journal

export const PERSONNAGE_STATUTS = {
    vivant: { label: "Vivant", badge: "badge-success", icon: "fa-solid fa-user" },
    mort: { label: "Mort", badge: "badge-neutral", icon: "fa-solid fa-skull" },
    disparu: { label: "Disparu", badge: "badge-warning", icon: "fa-solid fa-user-secret" },
};

export const SKIN_SOURCES = {
    aucun: "Aucun",
    minecraft: "Compte Minecraft",
    lien: "Lien",
    fichier: "Fichier envoyé",
};

// Portrait affiché : l'image envoyée, sinon le lien
export const portraitUrl = (personnage) => (personnage?.image_fichier ? fichierPersonnageUrl(personnage.image_fichier) : personnage?.image_url || null);

// Fichier de skin affiché : le fichier envoyé, sinon le lien
export const skinFichierUrl = (personnage) => (personnage?.skin_fichier ? fichierPersonnageUrl(personnage.skin_fichier) : personnage?.skin_url || null);

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

// personnage : fiche en cours de modification (fichiers déjà envoyés), absente à la création
export const personnageFormFields = (lieux, referentiel = EMPTY_REFERENTIEL, personnage = null) => [
    { name: "name", label: "Nom", type: "text", required: true, placeholder: "Nom du personnage" },
    {
        name: "status", label: "Statut", type: "radio", required: true,
        options: Object.entries(PERSONNAGE_STATUTS).map(([value, statut]) => ({ value, label: statut.label })),
    },
    { name: "espece_id", label: "Espèce", type: "select", placeholder: "Non précisée", options: toOptions(referentiel.especes), empty: "Aucune espèce n'est encore définie." },
    { name: "classe_id", label: "Classe", type: "select", placeholder: "Non précisée", options: toOptions(referentiel.classes), empty: "Aucune classe n'est encore définie." },
    { name: "grade", label: "Grade ou titre", type: "text", placeholder: "Capitaine de la garde, apprenti forgeron…" },
    { name: "description", label: "Histoire", type: "textarea", placeholder: "Origines, caractère, faits marquants… (Markdown accepté)" },
    // Portrait et skin : un onglet par source, seuls les champs de l'onglet choisi s'affichent
    {
        name: "portrait_source", label: "Portrait", type: "onglets",
        options: [
            { value: "aucun", label: "Aucun", aide: "Sans portrait, la tête du skin Minecraft ou l'initiale du personnage sert d'avatar." },
            {
                value: "fichier", label: "Image envoyée",
                aide: personnage?.image_fichier ? "Une image est déjà envoyée : choisissez-en une autre pour la remplacer." : null,
                fields: [{ name: "portrait", label: "Image", type: "file", accept: "image/png,image/jpeg,image/webp", help: "PNG, JPEG ou WebP, 5 Mo au plus." }],
            },
            { value: "lien", label: "Lien", fields: [{ name: "image_url", label: "Adresse de l'image", type: "url", placeholder: "https://…" }] },
        ],
    },
    {
        name: "skin_source", label: "Skin", type: "onglets",
        options: [
            { value: "aucun", label: SKIN_SOURCES.aucun },
            { value: "minecraft", label: SKIN_SOURCES.minecraft, aide: "Le skin du compte Minecraft lié à votre profil ; sans portrait, sa tête sert d'avatar." },
            { value: "lien", label: SKIN_SOURCES.lien, fields: [{ name: "skin_url", label: "Adresse du fichier de skin", type: "url", placeholder: "https://…/skin.png" }] },
            {
                value: "fichier", label: SKIN_SOURCES.fichier,
                aide: personnage?.skin_fichier ? "Un skin est déjà envoyé : choisissez-en un autre pour le remplacer." : null,
                fields: [{ name: "skin", label: "Fichier de skin", type: "file", accept: "image/png", help: "PNG de 64 × 64 pixels (ou 64 × 32, ancien format), comme dans le dossier du jeu." }],
            },
        ],
    },
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

export const PERSONNAGE_INITIAL = { status: "vivant", portrait_source: "aucun", skin_source: "aucun" };

// Espèce proposée par défaut à la création : « Humain », retrouvé par son nom dans le référentiel (géré par les
// administrateurs et modérateurs RP, donc sans identifiant fixe) ; aucune s'il n'existe plus
export const ESPECE_PAR_DEFAUT = "Humain";
const sansAccents = (texte) => String(texte ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export const personnageValeursCreation = (referentiel = EMPTY_REFERENTIEL) => {
    const espece = (referentiel.especes || []).find((item) => sansAccents(item.title) === sansAccents(ESPECE_PAR_DEFAUT));
    return { ...PERSONNAGE_INITIAL, espece_id: espece ? String(espece.id) : "" };
};

const idValue = (value) => (value ? String(value) : "");

// Valeurs du formulaire d'édition à partir d'une fiche { personnage }
export const personnageInitialValues = (personnage) => ({
    name: personnage.name ?? "",
    status: personnage.status ?? "vivant",
    espece_id: idValue(personnage.espece_id),
    classe_id: idValue(personnage.classe_id),
    grade: personnage.grade ?? "",
    description: personnage.description ?? "",
    portrait_source: personnage.image_fichier ? "fichier" : personnage.image_url ? "lien" : "aucun",
    image_url: personnage.image_url ?? "",
    portrait: null,
    skin: null,
    skin_source: personnage.skin_source || "aucun",
    skin_url: personnage.skin_url ?? "",
    date_naissance: personnage.date_naissance ?? "",
    date_deces: personnage.date_deces ?? "",
    civilisation_id: idValue(personnage.civilisation_id),
    ville_id: idValue(personnage.ville_id),
    quartier_id: idValue(personnage.quartier_id),
});

// Création (personnage absent) ou mise à jour, puis envoi du portrait et du skin choisis dans le formulaire.
// Seul l'onglet choisi compte : un fichier choisi dans un autre onglet est ignoré. Un skin « Fichier envoyé » n'existe
// qu'une fois le fichier reçu : la source est posée par l'envoi du skin.
// Renvoie { data, avertissement } : avertissement si un fichier a été refusé (la fiche, elle, est enregistrée).
export async function enregistrerPersonnage(values, personnage = null) {
    const { portrait, skin, portrait_source: portraitSource, ...corps } = values;
    let portraitAEnvoyer = null;
    let skinAEnvoyer = null;
    let retirerPortrait = false;

    if (portraitSource === "fichier") {
        if (portrait) portraitAEnvoyer = portrait;
        else if (!personnage?.image_fichier) throw new Error("Choisissez l'image du portrait, ou un autre onglet.");
        delete corps.image_url;
    } else if (portraitSource === "lien") {
        if (!corps.image_url?.trim()) throw new Error("Indiquez l'adresse du portrait, ou un autre onglet.");
    } else {
        corps.image_url = "";
        retirerPortrait = Boolean(personnage?.image_fichier);
    }

    if (corps.skin_source === "fichier") {
        if (skin) {
            // L'envoi du skin en fera la source : d'ici là, la fiche garde la sienne (« aucun » à la création)
            skinAEnvoyer = skin;
            if (personnage) delete corps.skin_source;
            else corps.skin_source = "aucun";
        } else if (!personnage?.skin_fichier) {
            throw new Error("Choisissez le fichier de skin à envoyer, ou un autre onglet.");
        }
    }

    let data = personnage ? await apiRequest("PUT", `/personnages/update/${personnage.id}`, corps) : await apiRequest("POST", "/personnages/create", corps);
    const id = data.personnage.id;
    if (retirerPortrait) data = { ...data, ...(await retirerPortraitPersonnage(id)) };
    const refus = [];
    for (const [fichier, envoyer, libelle] of [[portraitAEnvoyer, envoyerPortraitPersonnage, "portrait"], [skinAEnvoyer, envoyerSkinPersonnage, "skin"]]) {
        if (!fichier) continue;
        try {
            data = { ...data, ...(await envoyer(id, fichier)) };
        } catch (error) {
            refus.push(`${libelle} : ${error.message}`);
        }
    }
    return { data, avertissement: refus.length ? `La fiche est enregistrée, mais un fichier a été refusé (${refus.join(" ; ")}).` : null };
}
