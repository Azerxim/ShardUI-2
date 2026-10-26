// Élections RP (Shard-API crud_elections) : libellés partagés par la section des fiches, /elections et /election/:id

// Étape d'un scrutin, calculée par l'API à chaque lecture
export const PHASES = {
    candidatures: { label: "Candidatures", badge: "badge-info", icon: "fa-solid fa-user-plus" },
    vote: { label: "Vote en cours", badge: "badge-warning", icon: "fa-solid fa-check-to-slot" },
    second_tour: { label: "Second tour", badge: "badge-warning", icon: "fa-solid fa-check-to-slot" },
    clos: { label: "Clos", badge: "badge-success", icon: "fa-solid fa-box-archive" },
    annule: { label: "Annulé", badge: "badge-ghost", icon: "fa-solid fa-ban" },
};

export const phaseScrutin = (phase) => PHASES[phase] ?? PHASES.clos;

// Qui vote
export const CORPS = {
    personnages: "Chaque personnage lié",
    villes: "Une voix par ville où la religion est majoritaire",
    civilisations: "Une voix par civilisation membre",
};

// Corps électoral imposé par le type d'entité (religion : au choix de l'organisateur)
export const CORPS_PAR_ENTITE = {
    civilisation: { corps: "personnages", texte: "Les personnages qui résident dans la civilisation votent, chacun une fois." },
    alliance: { corps: "civilisations", texte: "Chaque civilisation membre (hors observateurs) a une voix, donnée par le personnage qui la représente dans son gouvernement." },
};

export const MODES = {
    secret: { label: "Secret", icon: "fa-solid fa-user-secret", texte: "On sait qui a voté, jamais pour qui." },
    public: { label: "Public", icon: "fa-solid fa-hand", texte: "Chaque bulletin est publié avec le nom du votant au dépouillement." },
};

export const RESULTATS = {
    egalite: "Égalité : personne n'est élu.",
    sans_candidat: "Aucun candidat ne s'est présenté.",
    sans_suffrage: "Personne n'a voté.",
};

export const ENTITES_ELECTIONS = {
    civilisation: { label: "Civilisation", icon: "fa-solid fa-flag" },
    religion: { label: "Religion", icon: "fa-solid fa-cross" },
    alliance: { label: "Alliance", icon: "fa-solid fa-handshake" },
};

// « 14 nov. à 14:00 » (heures réelles du serveur)
export const heureScrutin = (date) => date
    ? new Date(date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

// Fin du vote en cours : celle du second tour s'il a lieu
export const finDuVote = (scrutin) => (scrutin.tour === 2 && scrutin.tour2_fin ? scrutin.tour2_fin : scrutin.vote_fin);
