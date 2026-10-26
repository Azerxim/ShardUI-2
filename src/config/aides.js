import { DISCORD_INVITE } from "@/utils/parcours";

// ===== Aides et utilitaires =====
// Contenu de la page /aides (pages/aides/AidesPage.jsx) : guides pas à pas, rappel des commandes du serveur,
// et réglages des outils (components/aides/).

// Guides : chaque étape renvoie à la page du site où elle se fait
export const GUIDES = [
    {
        id: "rejoindre",
        titre: "Rejoindre le serveur",
        icon: "fa-brands fa-discord",
        etapes: [
            { texte: "Rejoignez le Discord et déposez votre candidature : elle seule ouvre la whitelist.", lien: DISCORD_INVITE, libelle: "Discord" },
            { texte: "Lisez le Codex : la loi du serveur et les règles du rôle-play.", lien: "/codex", libelle: "Codex" },
            { texte: "Une fois accepté, connectez-vous au site avec Discord et liez votre compte Minecraft depuis votre profil.", lien: "/profil", libelle: "Profil" },
        ],
    },
    {
        id: "personnage",
        titre: "Créer son personnage",
        icon: "fa-solid fa-masks-theater",
        etapes: [
            { texte: "Créez votre personnage : nom, espèce, classe, grade et histoire.", lien: "/personnages", libelle: "Personnages" },
            { texte: "Choisissez son skin (celui de votre compte Minecraft, un lien ou un fichier) et sa résidence." },
            { texte: "Présentez-le sur Discord avec la fiche à copier, plus bas sur cette page.", lien: "#fiche-discord", libelle: "Fiche Discord" },
        ],
    },
    {
        id: "civilisation",
        titre: "Fonder une civilisation",
        icon: "fa-solid fa-flag",
        etapes: [
            { texte: "Fondez la civilisation, puis rattachez-lui ses villes et leurs quartiers.", lien: "/civilisations", libelle: "Civilisations" },
            { texte: "Tracez les frontières de vos villes dans l'éditeur de la carte : sans elles, la population n'est mesurée qu'au rayon." },
            { texte: "Déclarez vos fermes, chacune justifiée dans le RP et habillée d'un bâtiment.", lien: "/fermes", libelle: "Fermes" },
        ],
    },
    {
        id: "commerce",
        titre: "Ouvrir un commerce",
        icon: "fa-solid fa-shop",
        etapes: [
            { texte: "Déclarez votre échoppe, son enseigne et sa ville.", lien: "/commerces", libelle: "Commerces" },
            { texte: "Remplissez son catalogue : article, lot et prix en tetras entiers.", lien: "/commerces#ou-acheter", libelle: "Où acheter ?" },
            { texte: "Annoncez vos jours de marché et vos foires aux joueurs de votre ville." },
        ],
    },
    {
        id: "guerre",
        titre: "Mener une guerre",
        icon: "fa-solid fa-shield-halved",
        etapes: [
            { texte: "Relisez les règles des guerres : troupes, déplacements et assassinats.", lien: "/codex#guerres", libelle: "Règles des guerres" },
            { texte: "Déclarez la guerre et ses cibles ; un modérateur RP la valide.", lien: "/guerres", libelle: "Guerres" },
            { texte: "Scellez à l'avance vos mouvements secrets et vos pièges.", lien: "/actions-secretes", libelle: "Actions secrètes" },
        ],
    },
];

// Rappel des commandes, groupées par mod du serveur : à tenir à jour avec les mods installés
export const COMMANDES = [
    {
        id: "deplacements",
        titre: "Déplacements",
        icon: "fa-solid fa-person-walking-arrow-right",
        source: "Essential Commands",
        commandes: [
            { commande: "/spawn", texte: "Retourner au point d'apparition." },
            { commande: "/sethome <nom>", texte: "Enregistrer l'endroit où vous êtes comme résidence." },
            { commande: "/home <nom>", texte: "Revenir à une résidence enregistrée." },
            { commande: "/delhome <nom>", texte: "Oublier une résidence." },
            { commande: "/tpa <joueur>", texte: "Demander à rejoindre un joueur." },
            { commande: "/tpaccept · /tpdeny", texte: "Accepter ou refuser la demande reçue." },
            { commande: "/back", texte: "Revenir à votre position précédente." },
        ],
    },
    {
        id: "echanges",
        titre: "Échanges",
        icon: "fa-solid fa-comments",
        source: "Minecraft",
        commandes: [
            { commande: "/msg <joueur> <message>", texte: "Message privé à un joueur, hors-jeu." },
            { commande: "F3", texte: "Afficher vos coordonnées, utiles pour les outils ci-dessous." },
        ],
    },
];

// Rapport des coordonnées entre la surface et le Nether
export const RAPPORT_NETHER = 8;

// Vitesses de déplacement en blocs par seconde, pour estimer un temps de trajet
export const VITESSES = [
    { id: "marche", label: "À pied", icon: "fa-solid fa-person-walking", vitesse: 4.3 },
    { id: "course", label: "En courant", icon: "fa-solid fa-person-running", vitesse: 5.6 },
    { id: "bateau", label: "En bateau", icon: "fa-solid fa-sailboat", vitesse: 8 },
    { id: "cheval", label: "À cheval", icon: "fa-solid fa-horse", vitesse: 9.5, note: "selon la monture" },
];

// Taille d'une pile d'objets dans l'inventaire
export const TAILLE_PILE = 64;

// Longueur maximale d'un message Discord
export const LIMITE_DISCORD = 2000;
