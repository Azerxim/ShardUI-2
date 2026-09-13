// Fournisseurs de comptes externes affichés sur le site (voir Shard-API/api/oauth.py)
export const OAUTH_PROVIDERS = {
    discord: {
        label: "Discord",
        icon: "fa-brands fa-discord",
        color: "#5865F2",
        help: "Connexion au site, et bientôt vos messages de journaux associés à vos personnages.",
    },
    microsoft: {
        label: "Minecraft (Microsoft)",
        icon: "fa-brands fa-microsoft",
        color: "#107C10",
        help: "Pseudo, skin et activité en jeu.",
        soon: true,
    },
};
