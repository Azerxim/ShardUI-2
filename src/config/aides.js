import { DISCORD_INVITE } from "@/utils/parcours";
import { MONNAIE } from "@/config/monnaie";

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
            { texte: "Préparez votre candidature : les questions du formulaire, des conseils et vos réponses prêtes à copier.", lien: "/aides#candidature", libelle: "Aide à la candidature" },
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

// Temps de trajet RP : le trajet compté à l'échelle du récit (1 bloc = ECHELLE_RP mètres), au rythme du jeu,
// où un jour de Minecraft (20 minutes réelles) vaut un jour RP. Avec une échelle de 1 : les jours de Minecraft.
export const ECHELLE_RP = 10;
export const DUREE_JOUR_MINECRAFT = 1200; // secondes réelles

// Taille d'une pile d'objets dans l'inventaire
export const TAILLE_PILE = 64;

// Longueur maximale d'un message Discord
export const LIMITE_DISCORD = 2000;

// ===== Outils =====
// Accueil de l'onglet « Outils » (pages/aides/AidesPage.jsx) : les outils rangés par usage, chacun expliqué.
// L'id est l'ancre de l'outil (/aides#nether) et celle de sa section (components/aides/).
export const OUTILS = [
    {
        id: "candidature", onglet: "Candidature", icon: "fa-solid fa-file-signature", titre: "Aide à la candidature",
        resume: "Préparez à tête reposée les réponses du formulaire « Postuler pour rejoindre » du Discord, puis copiez-les une à une.",
        details: ["Les questions du formulaire, avec ce que l'équipe y regarde", "Vérification de votre pseudo Minecraft Java", "Brouillon gardé dans ce navigateur"],
    },
    {
        id: "cabine-photo", onglet: "Cabine photo", icon: "fa-solid fa-camera", titre: "Cabine photo",
        resume: "Le portrait 3D d'un skin Minecraft, tête et corps entier, à faire pivoter puis à enregistrer en PNG.",
        details: ["D'après un UUID, un pseudo ou un fichier de skin", "Fond transparent ou coloré, jusqu'à 2048 pixels"],
    },
    {
        id: "nether", onglet: "Nether", icon: "fa-solid fa-dungeon", titre: "Coordonnées du Nether",
        resume: "Où construire le portail de l'autre côté : saisissez les coordonnées d'un côté, l'autre se remplit.",
        details: [`Un bloc du Nether vaut ${RAPPORT_NETHER} blocs de la surface`, "Dans les deux sens, en X comme en Z"],
    },
    {
        id: "distance", onglet: "Trajets", icon: "fa-solid fa-route", titre: "Distance et temps de trajet",
        resume: "La distance entre deux villes de la carte, ou deux points saisis, et le temps pour s'y rendre.",
        details: ["À pied, à cheval, en bateau ou par le Nether", "En temps réel et en temps RP"],
    },
    {
        id: "tetras", onglet: "Tetras", icon: MONNAIE.icon, titre: "Tetras, diamants et blocs",
        resume: "Combien sortir du coffre pour payer un montant, ou ce que vaut votre bourse.",
        details: [MONNAIE.valeur, MONNAIE.equivalence],
    },
    {
        id: "fiche-discord", onglet: "Fiche Discord", icon: "fa-brands fa-discord", titre: "Fiche de personnage pour Discord",
        resume: "La fiche d'un de vos personnages mise en forme pour un message Discord, avec le lien vers sa page.",
        details: ["Nécessite d'être connecté et d'avoir un personnage"],
    },
];

export const GROUPES_OUTILS = [
    { id: "demarrer", titre: "Pour bien démarrer", icon: "fa-solid fa-signs-post", outils: ["candidature"] },
    { id: "jeu", titre: "En jeu", icon: "fa-solid fa-cube", outils: ["nether", "distance", "tetras"] },
    { id: "personnages", titre: "Pour vos personnages", icon: "fa-solid fa-masks-theater", outils: ["fiche-discord", "cabine-photo"] },
];

// ===== Candidature =====
// Le formulaire « Postuler pour rejoindre » du Discord (STRUCTURE_DISCORD.md, § 1) : ses règles et ses questions,
// à tenir à jour si le formulaire change. `conseil` reprend ce que l'équipe regarde (critères de 📝|candidatures) ;
// `conseille` est une longueur indicative en caractères, pas une limite de Discord.
export const REGLES_CANDIDATURE = [
    "Le RP prime : on joue son personnage en jeu, les échanges HRP restent dans les salons HRP.",
    "Les combats sont mis en scène, pas subis ; les grands événements sont validés par l'équipe Lore.",
    "On respecte les constructions des autres : pas de grief ni de vol hors cadre RP validé.",
    "Pas de triche ; les mods cosmétiques sont tolérés sur demande.",
    "Respect entre joueurs, en RP comme en HRP.",
];

export const PROJETS_CANDIDATURE = [
    "Fonder une civilisation", "Rejoindre une civilisation", "Commerce", "Religion", "Construction", "Exploration", "Politique et diplomatie", "Guerre",
];

export const ORIGINES_CANDIDATURE = ["Un ami", "Une liste de serveurs", "YouTube", "TikTok", "Reddit", "Une ancienne saison de Tetrago"];

export const QUESTIONS_CANDIDATURE = [
    {
        id: "pseudo", type: "pseudo", question: "Pseudo Minecraft (Java)",
        conseil: "Exactement celui du jeu : c'est lui qui sera ajouté à la whitelist. Une faute, et la connexion sera refusée.",
    },
    {
        id: "age", type: "ouinon", question: "Avez-vous plus de 15 ans ?",
        conseil: "Répondez honnêtement : l'équipe vérifie que l'âge est conforme à la règle du serveur.",
    },
    {
        // Une seule question du formulaire, en trois parties : l'équipe lit d'abord l'expérience et le projet
        id: "projet", type: "parcours", question: "Votre expérience du RP, ce que vous voulez faire sur Tetrago, et une idée de personnage", conseille: 250,
        conseil: "La réponse la plus lue. L'équipe y cherche d'abord votre expérience du RP et un projet réel sur le serveur, même modeste ; l'idée de personnage est un plus.",
        parties: [
            {
                id: "experience", titre: "Votre expérience du RP", essentiel: true, intitule: "Expérience du RP",
                aide: "Serveurs, forums, jeux de rôle sur table… Débuter n'est pas un défaut : dites-le, et ce qui vous attire dans le RP.",
                placeholder: "Ex. : deux ans sur un serveur médiéval, où je tenais une auberge…",
            },
            {
                id: "envies", titre: "Ce que vous voulez faire sur Tetrago", essentiel: true, intitule: "Sur Tetrago", choix: true,
                aide: "Cochez ce qui vous tente, puis précisez en une ou deux phrases.",
                placeholder: "Ex. : ouvrir une forge dans une ville marchande, puis peut-être fonder une guilde.",
            },
            {
                id: "personnage", titre: "Une idée de personnage", essentiel: false, intitule: "Idée de personnage",
                aide: "Quelques lignes suffisent : qui il est, d'où il vient, ce qu'il cherche.",
                placeholder: "Qui est-il, d'où vient-il, que cherche-t-il ?",
                modele: "Nom : \nOrigine : \nMétier ou rôle : \nCe qu'il cherche : ",
            },
        ],
    },
    {
        id: "origine", type: "origine", question: "Comment avez-vous connu le serveur ?",
        conseil: "Une réponse courte suffit ; si un joueur vous a invité, donnez son pseudo.",
        placeholder: "Ex. : un ami, Pseudo123",
    },
];
