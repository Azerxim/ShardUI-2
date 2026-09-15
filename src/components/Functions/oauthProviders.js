// Fournisseurs de comptes externes affichés sur le site (voir Shard-API/api/oauth.py)
// soon: true affiche « Bientôt disponible » à la place du bouton de liaison
export const OAUTH_PROVIDERS = {
    discord: {
        label: "Discord",
        icon: "fa-brands fa-discord",
        color: "#5865F2",
        help: "Connexion au site, et signature de vos messages de journaux avec vos personnages.",
    },
    microsoft: {
        label: "Minecraft",
        icon: "fa-brands fa-microsoft",
        color: "#107C10",
        help: "Compte Microsoft possédant Minecraft Java : pseudo, skin et connexion au site.",
    },
};
