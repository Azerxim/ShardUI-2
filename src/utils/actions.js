// Actions secrètes (Shard-API crud_actions.py) : libellés, dates et vérification de l'empreinte

export const ENTITE_TYPES = {
    personnage: { label: "Personnage", icon: "fa-solid fa-masks-theater", href: (id) => `/personnage/${id}` },
    civilisation: { label: "Civilisation", icon: "fa-solid fa-flag", href: (id) => `/civilisation/${id}` },
    religion: { label: "Religion", icon: "fa-solid fa-cross", href: (id) => `/religion/${id}` },
};

export const REVELATION_MODES = {
    auteur: "par son auteur",
    moderateur: "par un modérateur RP",
    date: "automatiquement, à la date fixée",
};

// Date et heure réelles : l'horodatage est tout l'intérêt d'une action scellée
export const formatDateHeure = (date) => date
    ? new Date(date).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

// Même calcul que l'API : SHA-256 hexadécimal de « sel\ntitre\ncontenu ».
// Renvoie true / false, ou null quand le navigateur ne peut pas calculer (contexte non sécurisé) ou sans sel.
export async function verifierEmpreinte(action) {
    if (!action?.sel || !globalThis.crypto?.subtle) return null;
    const octets = new TextEncoder().encode(`${action.sel}\n${action.title}\n${action.content}`);
    const hash = await crypto.subtle.digest("SHA-256", octets);
    const hex = [...new Uint8Array(hash)].map((octet) => octet.toString(16).padStart(2, "0")).join("");
    return hex === action.empreinte;
}
