// Actions secrètes (Shard-API crud_actions.py) : libellés, dates et vérification de l'empreinte

export const ENTITE_TYPES = {
    personnage: { label: "Personnage", icon: "fa-solid fa-masks-theater", href: (id) => `/personnage/${id}` },
    civilisation: { label: "Civilisation", icon: "fa-solid fa-flag", href: (id) => `/civilisation/${id}` },
    religion: { label: "Religion", icon: "fa-solid fa-cross", href: (id) => `/religion/${id}` },
    alliance: { label: "Alliance", icon: "fa-solid fa-handshake", href: (id) => `/alliance/${id}` },
    commerce: { label: "Commerce", icon: "fa-solid fa-store", href: (id) => `/commerce/${id}` },
};

// Pactes secrets : proposés par une partie, signés (ou refusés) par l'autre ; seuls les pactes signés entrent au registre
export const PACTE_STATUTS = {
    en_attente: { label: "En attente de signature", badge: "badge-info", icon: "fa-solid fa-hourglass-half" },
    signe: { label: "Signé", badge: "badge-success", icon: "fa-solid fa-signature" },
    refuse: { label: "Refusé", badge: "badge-error", icon: "fa-solid fa-ban" },
    annule: { label: "Retiré", badge: "badge-ghost", icon: "fa-solid fa-rotate-left" },
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
