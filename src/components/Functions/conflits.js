import Swal from "sweetalert2";
import { checkMemberAuth } from "../../services/authorisation";
import { getSessionUser } from "../../services/session";

// Libellés et règles partagés par les pages alliances et guerres

export const ALLIANCE_TYPES = {
    Militaire: { label: "Alliance militaire", badge: "badge-error", icon: "fa-solid fa-shield-halved" },
    Diplomatique: { label: "Alliance diplomatique", badge: "badge-info", icon: "fa-solid fa-dove" },
};

export const ALLIANCE_ICONS = [
    "fa-solid fa-shield-halved", "fa-solid fa-handshake", "fa-solid fa-crown", "fa-solid fa-chess-rook",
    "fa-solid fa-dragon", "fa-solid fa-khanda", "fa-solid fa-dove", "fa-solid fa-scroll", "fa-solid fa-fire", "fa-solid fa-anchor",
];

export const ALLIANCE_ROLE_BADGES = { "Chef de file": "badge-primary", Membre: "badge-ghost", Observateur: "badge-outline" };

export const GUERRE_TYPES = {
    Militaire: { label: "Guerre militaire", icon: "fa-solid fa-shield-halved", entity: "civilisation" },
    Religion: { label: "Guerre de religion", icon: "fa-solid fa-hands-praying", entity: "religion" },
};

export const GUERRE_STATUTS = {
    en_attente: { label: "En attente de validation", badge: "badge-warning" },
    en_cours: { label: "En cours", badge: "badge-error" },
    terminee: { label: "Terminée", badge: "badge-neutral" },
    refusee: { label: "Refusée", badge: "badge-ghost" },
};

export const GUERRE_ISSUES = [
    "Victoire des attaquants", "Victoire des défenseurs", "Traité de paix", "Paix blanche", "Capitulation", "Abandon du conflit",
];

export const formatDate = (date) => date ? new Date(date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : null;

export const entityHref = (entite) => entite?.type === "religion" ? `/religion/${entite.id}` : `/civilisation/${entite?.id}`;

export const isModerateur = (user) => Boolean(user && (user.is_admin || user.is_moderateur));

// Civilisations / religions dont l'utilisateur connecté est Fondateur ou Admin (toutes pour un administrateur).
// items : réponse de getCivilisations / getReligions ; key : "civilisation" ou "religion"
export const managedEntities = (items, key) => {
    if (!getSessionUser()) return [];
    return (Array.isArray(items) ? items : []).filter((item) => checkMemberAuth(item.members || [])).map((item) => item[key]);
};

export const toOptions = (entities) => entities
    .map((entity) => ({ value: entity.id, label: entity.title }))
    .sort((a, b) => a.label.localeCompare(b.label));

// Action directe (bouton) : confirmation éventuelle, appel, puis alerte de succès ou d'erreur. Renvoie null si abandon ou échec.
export async function runAction(request, { confirm = null, success = null } = {}) {
    if (confirm) {
        const answer = await Swal.fire({
            icon: "warning",
            title: confirm.title,
            text: confirm.text,
            showCancelButton: true,
            confirmButtonText: confirm.button ?? "Confirmer",
            cancelButtonText: "Annuler",
        });
        if (!answer.isConfirmed) return null;
    }
    try {
        const data = await request();
        Swal.fire({ icon: "success", title: "Succès", text: success ?? data?.text ?? "C'est fait." });
        return data ?? {};
    } catch (error) {
        Swal.fire({ icon: "error", title: "Action impossible", text: error.message });
        return null;
    }
}

export const allianceFormFields = (civilisationOptions = null) => [
    { name: "title", label: "Nom", type: "text", required: true, placeholder: "Nom de l'alliance" },
    {
        name: "type", label: "Type", type: "radio", required: true,
        options: [{ value: "Militaire", label: "Militaire" }, { value: "Diplomatique", label: "Diplomatique" }],
        help: (values) => values.type === "Diplomatique" ? "Pactes, ambassades et soutien politique, sans obligation militaire." : "Défense mutuelle : les membres peuvent être appelés aux armes.",
    },
    ...(civilisationOptions ? [{
        name: "civilisation_id", label: "Civilisation fondatrice", type: "select", required: true, options: civilisationOptions,
        help: "Elle devient chef de file et gère l'alliance.",
        empty: "Vous ne dirigez aucune civilisation : seuls leur fondateur et leurs admins peuvent fonder une alliance.",
    }] : []),
    { name: "description", label: "Description", type: "textarea", placeholder: "Buts, serments, conditions d'entrée… (Markdown accepté)" },
    { name: "color", label: "Couleur", type: "color" },
    { name: "icon", label: "Emblème", type: "icons", options: ALLIANCE_ICONS },
    { name: "date_founded", label: "Date de fondation dans le RP", type: "date" },
    {
        name: "is_public", label: "Visibilité", type: "radio", required: true,
        options: [{ value: "true", label: "Publique" }, { value: "false", label: "Privée" }],
        help: "Une alliance privée n'est visible que de ses membres et recrute uniquement sur invitation.",
    },
];

// Corps d'une alliance pour l'API à partir des valeurs du formulaire
export const allianceBody = (values) => ({
    ...values,
    is_public: String(values.is_public) !== "false",
    ...(values.civilisation_id !== undefined ? { civilisation_id: Number(values.civilisation_id) } : {}),
});
