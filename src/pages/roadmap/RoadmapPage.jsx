import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import TitleH2 from "@/components/ui/TitleH2";
import { CARTE } from "@/config/navbar";

// ===== Feuille de route =====
// Page publique : ce qui viendra, ce qui est en chantier, puis ce qui existe déjà sur Tetrago (version 2.0).
// Les tâches internes restent dans TACHES_RESTANTES.md ; ici, seulement ce qui change quelque chose pour les joueurs.

const ETATS = {
    disponible: { label: "Disponible", icon: "fa-solid fa-circle-check", badge: "badge-success", puce: "text-success" },
    chantier: { label: "En chantier", icon: "fa-solid fa-hammer", badge: "badge-warning", puce: "text-warning" },
    avenir: { label: "À venir", icon: "fa-solid fa-hourglass-start", badge: "badge-ghost", puce: "opacity-60" },
    nouveau: { label: "Nouveau", icon: "fa-solid fa-star", badge: "badge-info", puce: "text-info" },
};

// Catégories des fonctionnalités, dans leur ordre d'affichage à l'intérieur de chaque section
const CATEGORIES = {
    carte: { label: "Carte & monde", icon: "fa-solid fa-map" },
    civilisations: { label: "Civilisations & politique", icon: "fa-solid fa-crown" },
    guerres: { label: "Guerres & intrigues", icon: "fa-solid fa-shield-halved" },
    economie: { label: "Économie", icon: "fa-solid fa-coins" },
    recit: { label: "Personnages & récit", icon: "fa-solid fa-masks-theater" },
    bibliotheque: { label: "Bibliothèque", icon: "fa-solid fa-book-open" },
    site: { label: "Compte & site", icon: "fa-solid fa-user-shield" },
};

const SECTIONS = [
    {
        etat: "avenir",
        titre: "À venir",
        dek: "Les chantiers suivants, dans le désordre : l'ordre se décidera avec vous.",
        fonctionnalites: [
            {
                titre: "Recherche sur la carte",
                categorie: "carte",
                icon: "fa-solid fa-magnifying-glass-location",
                texte: "Un champ « Aller à… » pour retrouver une ville, un quartier, un magasin ou des coordonnées : la carte s'y centre et ouvre sa fiche.",
            },
            {
                titre: "Règle de mesure",
                categorie: "carte",
                icon: "fa-solid fa-ruler",
                texte: "Deux clics sur la carte pour connaître la distance en blocs et le temps de trajet dans le récit, au rythme d'un jour Minecraft pour un jour RP.",
            },
            {
                titre: "Calque « Vie RP »",
                categorie: "carte",
                icon: "fa-solid fa-masks-theater",
                texte: "La vie du monde sur la carte : événements du calendrier qui ont un lieu, élections en cours dans les villes, fermes validées.",
                details: [
                    "Des fermes, seule la position est montrée : la photo de la déclaration reste privée.",
                ],
            },
            {
                titre: "Frontières au fil du temps",
                categorie: "carte",
                icon: "fa-solid fa-clock-rotate-left",
                texte: "Un curseur de date RP pour revoir l'étendue des civilisations à une époque donnée, d'après les fondations et les chroniques.",
            },
            {
                titre: "Réseau du Nether",
                categorie: "carte",
                icon: "fa-solid fa-dungeon",
                texte: "Les portails et les chemins du Nether reportés sur la carte de la surface, pour voir d'un coup d'œil par où passer.",
            },
            {
                titre: "Carte plus rapide à charger",
                categorie: "carte",
                icon: "fa-solid fa-gauge-high",
                texte: "Une feuille de style préparée à l'avance au lieu d'être construite par le navigateur : la carte s'ouvrira plus vite, surtout sur téléphone.",
            },
            {
                titre: "Fiche de ville plus complète",
                categorie: "civilisations",
                icon: "fa-solid fa-city",
                texte: "La date de fondation toujours affichée (ou signalée inconnue), les habitants célèbres et les postes du gouvernement de la ville réunis sur sa fiche.",
            },
            {
                titre: "Historique des modifications",
                categorie: "site",
                icon: "fa-solid fa-clock-rotate-left",
                texte: "Qui a changé le titre, la devise ou les frontières d'une fiche, et quand : utile aux dirigeants comme aux modérateurs RP.",
            },
            {
                titre: "Page « Mon royaume »",
                categorie: "civilisations",
                icon: "fa-solid fa-crown",
                texte: "Pour les dirigeants, un seul écran avec ce qui attend une décision : demandes d'adhésion, écarts de population, troupes levées, élections à organiser, fermes à mettre en conformité.",
            },
            {
                titre: "Abonnements aux notifications",
                categorie: "site",
                icon: "fa-solid fa-bell",
                texte: "Suivre une civilisation, une guerre ou une maison sans en être membre, et choisir quelles notifications recevoir, sur le site ou sur Discord.",
            },
            {
                titre: "Recherche dans le texte des livres",
                categorie: "bibliotheque",
                icon: "fa-solid fa-magnifying-glass",
                texte: "Retrouver un passage, pas seulement un titre : la recherche de la bibliothèque parcourt aussi les chapitres et mène au bon endroit.",
            },
            {
                titre: "Chapitres à réordonner",
                categorie: "bibliotheque",
                icon: "fa-solid fa-list-ol",
                texte: "Changer l'ordre des chapitres d'un livre en les faisant glisser.",
            },
            {
                titre: "Marque-page",
                categorie: "bibliotheque",
                icon: "fa-solid fa-bookmark",
                texte: "Reprendre un livre là où on s'était arrêté, sans même avoir besoin d'un compte.",
            },
            {
                titre: "Co-auteurs",
                categorie: "bibliotheque",
                icon: "fa-solid fa-user-group",
                texte: "Écrire un livre à plusieurs, ou tenir un journal à plusieurs plumes.",
            },
            {
                titre: "Publication à une date RP",
                categorie: "bibliotheque",
                icon: "fa-solid fa-hourglass-half",
                texte: "Écrire un livre à l'avance et le faire paraître à la date choisie dans le récit.",
            },
            {
                titre: "Écrits réservés",
                categorie: "bibliotheque",
                icon: "fa-solid fa-key",
                texte: "Des archives secrètes ou des textes sacrés lisibles seulement par les membres d'une civilisation ou d'une religion.",
            },
            {
                titre: "Suivre un journal ou un auteur",
                categorie: "bibliotheque",
                icon: "fa-solid fa-bell",
                texte: "Être prévenu à chaque nouveau chapitre ou nouveau message d'un journal ou d'un auteur qu'on suit.",
            },
            {
                titre: "Écrits reliés aux chroniques",
                categorie: "bibliotheque",
                icon: "fa-solid fa-timeline",
                texte: "Citer un passage de livre ou un message de journal dans les chroniques, et retrouver depuis un écrit les faits qu'il raconte.",
            },
            {
                titre: "Livres en jeu",
                categorie: "bibliotheque",
                icon: "fa-solid fa-cube",
                texte: "Faire passer un chapitre du site en livre écrit dans Minecraft, ou ranger dans la bibliothèque un livre écrit en jeu.",
            },
            {
                titre: "Export et impression",
                categorie: "bibliotheque",
                icon: "fa-solid fa-download",
                texte: "Télécharger un livre complet en PDF, ou l'imprimer mis en page comme un grimoire.",
            },
            {
                titre: "Écrits les plus lus",
                categorie: "bibliotheque",
                icon: "fa-solid fa-chart-line",
                texte: "Le nombre de lectures de chaque écrit, et sur l'accueil les plus lus de la semaine et les dernières parutions.",
            },
            {
                titre: "Le fil du monde",
                categorie: "bibliotheque",
                icon: "fa-solid fa-newspaper",
                texte: "Une nouvelle page qui réunit tous les messages des journaux publics en un seul fil, comme la gazette du serveur, à filtrer par catégorie, civilisation ou personnage.",
            },
            {
                titre: "Lecture chapitre par chapitre",
                categorie: "bibliotheque",
                icon: "fa-solid fa-book-open-reader",
                texte: "Une page de lecture en plein écran pour chaque chapitre, avec le précédent et le suivant, et une adresse à partager sur Discord.",
            },
            {
                titre: "Rayons de la bibliothèque",
                categorie: "bibliotheque",
                icon: "fa-solid fa-book",
                texte: "Une page par catégorie, avec sa présentation, une vitrine des écrits récents et les plus anciens ; le rayon « Monde » devient la vitrine officielle du serveur.",
            },
            {
                titre: "Page d'un auteur RP",
                categorie: "bibliotheque",
                icon: "fa-solid fa-user-pen",
                texte: "Tout ce qu'un personnage a écrit au même endroit : ses livres, ses journaux et les messages qu'il a signés.",
            },
            {
                titre: "L'atelier de l'auteur",
                categorie: "bibliotheque",
                icon: "fa-solid fa-pen-nib",
                texte: "Le tableau de bord de vos écrits : publics ou privés, journaux sans salon, liens à compléter, et plus tard les brouillons et les co-auteurs.",
            },
            {
                titre: "Archives d'une civilisation",
                categorie: "bibliotheque",
                icon: "fa-solid fa-box-archive",
                texte: "Tous les écrits liés à une civilisation, une religion ou une guerre, rangés sur une frise en dates RP : l'histoire d'un royaume se lit comme un dossier.",
            },
            {
                titre: "Recueils",
                categorie: "bibliotheque",
                icon: "fa-solid fa-layer-group",
                texte: "Des sélections composées par les joueurs ou les modérateurs, qui mêlent livres, journaux et messages : « Les traités de la guerre du Nord », « Légendes de l'an 1 »…",
            },
            {
                titre: "Appels à écrits",
                categorie: "bibliotheque",
                icon: "fa-solid fa-bullhorn",
                texte: "Les modérateurs RP lancent un thème avec une date limite RP, et chacun y rattache ses écrits ; les meilleurs entrent dans les chroniques ou un recueil.",
            },
        ],
    },
    // {
    //     etat: "chantier",
    //     titre: "En chantier",
    //     dek: "Les fonctionnalités actuellement en chantier.",
    //     fonctionnalites: [
    //         {
    //             titre: "Frontières de toutes les villes",
    //             icon: "fa-solid fa-draw-polygon",
    //             texte: "Tant qu'une ville n'a pas de frontières tracées, sa population est mesurée dans un simple rayon autour de son point : le chiffre reste approximatif.",
    //         },
    //     ],
    // },
    {
        etat: "nouveau",
        titre: "Nouvelles fonctionnalités",
        dek: "Les fonctionnalités ajoutées récemment.",
        fonctionnalites: [
            {
                titre: "Catégories des journaux",
                categorie: "bibliotheque",
                icon: "fa-solid fa-newspaper",
                lien: "/bibliotheque#journaux",
                texte: "Chaque journal choisit sa catégorie (gazette, chronique, correspondance, carnet, proclamation…) : elle se filtre dans la bibliothèque, et son salon Discord est rangé dans la catégorie correspondante du serveur.",
                details: [
                    "« Monde », réservée aux administrateurs pour les récits officiels, toujours en tête.",
                ],
            },
            {
                titre: "Salon Discord d'un journal",
                categorie: "bibliotheque",
                icon: "fa-brands fa-discord",
                lien: "/bibliotheque#journaux",
                texte: "Un administrateur peut relier un journal à un salon qui existe déjà sur le serveur. À la suppression d'un journal, son salon peut être gardé sur Discord au lieu d'être supprimé.",
            },
            {
                titre: "Journaux en couleur, datés dans le RP",
                categorie: "bibliotheque",
                icon: "fa-solid fa-palette",
                lien: "/bibliotheque#journaux",
                texte: "Une couleur au choix teinte la tuile du journal et l'en-tête de sa page ; sa date de publication se saisit en date RP, sans rien de rempli d'office.",
            },
            {
                titre: "Sauts de ligne respectés",
                categorie: "bibliotheque",
                icon: "fa-solid fa-paragraph",
                texte: "Dans les messages des journaux et les textes du site, un simple retour à la ligne (ou <br>) passe à la ligne, comme on l'a écrit.",
            },
            {
                titre: "Programmes des candidats plus lisibles",
                categorie: "civilisations",
                icon: "fa-solid fa-check-to-slot",
                lien: "/elections",
                texte: "Sur la page d'un scrutin, chaque candidat occupe toute la largeur ; un long programme est replié sur cinq lignes avec « Voir plus », et l'éditeur du dépôt s'ouvre plus grand.",
            },
            {
                titre: "Version du jeu",
                categorie: "site",
                icon: "fa-solid fa-cube",
                texte: "La version du serveur Minecraft s'affiche en bas du panneau des joueurs connectés.",
            },
            {
                titre: "Feuille de route par catégorie",
                categorie: "site",
                icon: "fa-solid fa-route",
                lien: "/roadmap",
                texte: "Cette page range désormais les fonctionnalités par catégorie (carte, civilisations, guerres, économie, récit, bibliothèque, site), avec des pastilles pour n'en afficher qu'une.",
            },
            {
                titre: "Catégories des livres",
                categorie: "bibliotheque",
                icon: "fa-solid fa-tags",
                lien: "/bibliotheque#livres",
                texte: "Comme les journaux, les livres sont rangés par catégorie (lois, histoire, légendes, religion, traités, récits, savoirs…) : une étagère par catégorie dans la bibliothèque, et un filtre pour n'en garder qu'une.",
                details: [
                    "« Textes officiels », réservée aux administrateurs, toujours en tête.",
                ],
            },
            {
                titre: "Journaux plus rapides à ouvrir",
                categorie: "bibliotheque",
                icon: "fa-solid fa-gauge-high",
                lien: "/bibliotheque#journaux",
                texte: "Les messages des journaux sont gardés quelques minutes par le site au lieu d'être relus sur Discord à chaque visite ; les longs journaux s'ouvrent sur leurs 100 derniers messages, et « Charger plus » remonte le fil.",
                details: [
                    "« Rafraîchir » relit le salon Discord tout de suite.",
                ],
            },
            {
                titre: "Rôles pris en compte sans recharger",
                categorie: "site",
                icon: "fa-solid fa-user-shield",
                texte: "Un rôle accordé ou retiré par un administrateur apparaît dans la minute, ou dès le retour sur l'onglet, sans avoir à recharger la page ; une annonce le signale.",
                details: [
                    "Une fenêtre en cours de saisie n'est jamais fermée : la page attend qu'elle le soit.",
                ],
            },
            {
                titre: "Tetrago sur l'écran d'accueil",
                categorie: "site",
                icon: "fa-solid fa-mobile-screen",
                lien: "/aides#guide-installer",
                texte: "Le site s'installe comme une application sur téléphone et sur ordinateur, et les pages déjà consultées se relisent même sans réseau.",
                details: [
                    "Les pages gardées hors ligne sont effacées à la déconnexion.",
                ],
            },
        ],
    },
    {
        etat: "disponible",
        titre: "Fonctionnalités",
        dek: "Tout ceci fonctionne aujourd'hui, sur le site comme sur le serveur.",
        fonctionnalites: [
            {
                titre: "Civilisations, villes et quartiers",
                categorie: "civilisations",
                icon: "fa-solid fa-flag",
                lien: "/civilisations",
                texte: "Fonder une civilisation, y rattacher des villes et découper celles-ci en quartiers, avec leurs dirigeants et leurs habitants.",
            },
            {
                titre: "Religions",
                categorie: "civilisations",
                icon: "fa-solid fa-cross",
                lien: "/religions",
                texte: "Créer un culte, accueillir ses fidèles, l'implanter dans les villes qui l'adoptent.",
            },
            {
                titre: "Commerces",
                categorie: "economie",
                icon: "fa-solid fa-shop",
                lien: "/commerces",
                texte: "Déclarer une échoppe, son enseigne, sa ville et les membres qui la tiennent.",
            },
            {
                titre: "Population officielle ajustée",
                categorie: "civilisations",
                icon: "fa-solid fa-users",
                lien: "/civilisations",
                texte: "La population d'une ville, ce sont les lits habités comptés au relevé du monde, plus les écarts motivés (réfugiés, épidémie…) que ses dirigeants demandent et qu'un modérateur RP valide. Chaque civilisation affiche aussi l'armée qu'elle peut lever.",
            },
            {
                titre: "Zones commerciales",
                categorie: "economie",
                icon: "fa-solid fa-store",
                lien: "/commerces",
                texte: "Marchés et quartiers marchands tracés sur la carte par chaque ville, avec les boutiques qui s'y tiennent : visibles sur la carte, sur la fiche de la ville et sur la page des commerces.",
            },
            {
                titre: "Règles des guerres",
                categorie: "guerres",
                icon: "fa-solid fa-chess-knight",
                lien: "/codex#guerres",
                texte: "Le règlement d'une guerre RP dans le Codex, pour que chaque camp joue avec les mêmes cartes en main.",
                details: [
                    "Troupes à la mesure de la population, réparties et déclarées au modérateur RP.",
                    "Déplacements publics dans la chronologie, secrets scellés en action secrète.",
                    "Assassinat par piège : mortel seulement s'il a été scellé avant et validé après.",
                ],
            },
            {
                titre: "Cohérence historique",
                categorie: "recit",
                icon: "fa-solid fa-landmark",
                lien: "/codex#coherence",
                texte: "Un Moyen Âge où la magie existe : ni poudre ni machines, des villes bâties selon leur temps et une mécanique qui se dissimule.",
            },
            {
                titre: "Fermes justifiées en RP",
                categorie: "economie",
                icon: "fa-solid fa-wheat-awn",
                lien: "/codex#fermes",
                texte: "Toute ferme automatique se déclare avec sa raison d'être dans l'histoire et s'habille d'un bâtiment qui lui ressemble : plus de boîte de redstone posée au milieu d'un champ.",
            },
            {
                titre: "Actions secrètes",
                categorie: "guerres",
                icon: "fa-solid fa-user-secret",
                lien: "/actions-secretes",
                texte: "Sceller une action à la date et à l'heure réelles, puis la révéler plus tard (soi-même, par un modérateur RP ou à une date fixée) : la preuve qu'elle a été décidée avant, et non après coup. Le conflit d'intérêts de l'équipe, qui joue aussi, est levé par la lecture tracée : chaque lecture d'un administrateur ou d'un modérateur RP est rendue publique.",
            },
            {
                titre: "Zones et bâtiments destructibles",
                categorie: "guerres",
                icon: "fa-solid fa-house-crack",
                lien: "/civilisations",
                texte: "Savoir, avant la bataille, ce qui peut tomber : chaque ville désigne sur la carte les bâtiments et les zones qu'une guerre RP autorise à détruire, listés sur sa fiche.",
            },
            {
                titre: "La monnaie officielle : le tetra",
                categorie: "economie",
                icon: "fa-solid fa-coins",
                lien: "/codex#monnaie",
                texte: "Une vraie pièce en jeu, frappée par la Monnaie de Tetrago : 8 tetras par diamant, 9 petits tetras par tetra, impossible à contrefaire. Elle s'obtient par le commerce, la frappe ou le trésor d'une civilisation, et c'est la seule monnaie admise entre joueurs.",
            },
            {
                titre: "Catalogue des boutiques",
                categorie: "economie",
                icon: "fa-solid fa-tags",
                lien: "/commerces#ou-acheter",
                texte: "Chaque magasin publie ses articles et leurs prix en tetras et petits tetras, et la recherche « Où acheter ? » de la page des commerces trouve les boutiques qui les vendent, de la moins chère à la plus chère.",
            },
            {
                titre: "Jours de marché et foires",
                categorie: "economie",
                icon: "fa-solid fa-calendar-day",
                lien: "/commerces#foires",
                texte: "Chaque zone commerciale affiche ses jours d'ouverture, et une ville peut annoncer une foire datée : sur sa fiche, sur la page des commerces, sur la carte et sur Discord.",
            },
            {
                titre: "Cibles d'une guerre",
                categorie: "guerres",
                icon: "fa-solid fa-house-crack",
                lien: "/guerres",
                texte: "Sur la fiche d'une guerre, les bâtiments et zones destructibles des villes des deux camps, avec leur carte : ce que la guerre autorise à détruire.",
            },
            {
                titre: "Levée des troupes",
                categorie: "guerres",
                icon: "fa-solid fa-people-group",
                lien: "/guerres",
                texte: "Pendant une guerre, chaque civilisation engagée lève ses troupes ville par ville, au plus un soldat pour cinq habitants. Une troupe est toujours sur un champ de bataille ou en mouvement ; ses déplacements publics entrent dans la chronologie, et seuls son camp et les modérateurs RP la voient, y compris sur la carte de la guerre, jusqu'à la fin de celle-ci.",
            },
            {
                titre: "Compagnies de mercenaires",
                categorie: "guerres",
                icon: "fa-solid fa-coins",
                lien: "/guerres#mercenaires",
                texte: "Une civilisation loue ses soldats en compagnies de mercenaires, avec leur tarif, sans entrer dans les guerres : le camp qui les engage les commande, et leur civilisation peut les rappeler en rompant le contrat.",
            },
            {
                titre: "Tableau de bord des modérateurs RP",
                categorie: "site",
                icon: "fa-solid fa-gavel",
                texte: "Une seule page pour tout ce qui attend une décision de la modération RP : déclarations de guerre, ajustements de population, fermes déclarées, pièges révélés. Le suivi des guerres en cours et l'historique de chaque décision y sont rassemblés.",
                details: [
                    "Un piège déclaré comme tel au dépôt ne tue qu'une fois validé après sa révélation.",
                    "Un modérateur ne tranche ni sa propre demande, ni son propre piège.",
                ],
            },
            {
                titre: "Carte unifiée",
                categorie: "carte",
                icon: "fa-solid fa-layer-group",
                lien: CARTE.href,
                texte: "Civilisations, commerces et guerres ensemble sur une même carte, avec une légende : chaque thème s'affiche ou se masque, et l'adresse garde la vue choisie pour la partager.",
            },
            {
                titre: "Notifications sur le site",
                categorie: "site",
                icon: "fa-solid fa-bell",
                texte: "Une cloche dans la barre, une fois connecté, pour ce qui vous concerne : appels aux armes, invitations d'alliance, liens de parenté à accepter, lectures tracées et révélations de vos actions secrètes, décisions de la modération RP.",
                details: [
                    "Un clic sur une notification mène à la page concernée et la marque comme lue.",
                    "Les modérateurs RP y voient arriver les déclarations de guerre, les fermes, les ajustements de population et les pièges à juger.",
                ],
            },
            {
                titre: "Déclaration des fermes sur le site",
                categorie: "economie",
                icon: "fa-solid fa-wheat-awn",
                lien: "/fermes",
                texte: "Déclarer une ferme automatique sur le site (position, justification RP, photo) plutôt que par ticket, et suivre son statut : en attente, validée ou à mettre en conformité.",
            },
            {
                titre: "Chroniques de Tetrago",
                categorie: "recit",
                icon: "fa-solid fa-timeline",
                lien: "/chroniques",
                texte: "Une frise de l'histoire du monde, année après année du calendrier RP, remplie toute seule : fondations, alliances, guerres et batailles, naissances, morts et mariages des maisons nobles, plus les faits marquants qu'y inscrivent les modérateurs RP.",
            },
            {
                titre: "Lignées et généalogie",
                categorie: "recit",
                icon: "fa-solid fa-sitemap",
                lien: "/maisons",
                texte: "Des liens de parenté entre personnages (parents, conjoints, héritiers), acceptés par le joueur de chacun, et les maisons nobles : blason, devise, chef et l'arbre de leur lignée.",
            },
            {
                titre: "Calendrier des événements RP",
                categorie: "recit",
                icon: "fa-solid fa-calendar-days",
                lien: "/calendrier",
                texte: "Batailles prévues, fêtes, couronnements, tournois : chacun annonce ses événements et s'inscrit à ceux des autres, sous les traits de son personnage. Chaque annonce est publiée sur Discord et reproduite parmi les événements du serveur.",
            },
            {
                titre: "Alliances",
                categorie: "civilisations",
                icon: "fa-solid fa-handshake",
                lien: "/alliances",
                texte: "Sceller un pacte entre civilisations, avec son chef de file et ses membres.",
            },
            {
                titre: "Guerres",
                categorie: "guerres",
                icon: "fa-solid fa-shield-halved",
                lien: "/guerres",
                texte: "Déclarer une guerre, rallier un camp, tenir la chronologie des batailles, sièges et traités, tracer les zones de conflit sur la carte. Chaque étape est annoncée sur le Discord.",
            },
            {
                titre: "Personnages RP",
                categorie: "recit",
                icon: "fa-solid fa-masks-theater",
                lien: "/personnages",
                texte: "Espèce, classe, grade, skin et résidence : votre personnage vit sur le site autant que sur le serveur.",
            },
            {
                titre: "Bibliothèque",
                categorie: "bibliotheque",
                icon: "fa-solid fa-book",
                lien: "/bibliotheque",
                texte: "Livres et journaux du monde, avec les messages signés par les personnages.",
            },
            {
                titre: "Codex",
                categorie: "bibliotheque",
                icon: "fa-solid fa-scroll",
                lien: "/codex",
                texte: "La loi du serveur et les règles du rôle-play, réunies en deux livres.",
            },
            {
                titre: "Élections RP",
                categorie: "civilisations",
                icon: "fa-solid fa-check-to-slot",
                lien: "/elections",
                texte: "Ouvrir un scrutin au sein d'une civilisation, d'une alliance ou d'une religion : candidatures, vote entre deux heures, dépouillement, et l'élu qui prend son poste au gouvernement.",
                details: [
                    "Vote secret, ou public avec les bulletins nommés ; second tour sans majorité absolue.",
                    "Civilisation : ses habitants votent. Alliance : chaque civilisation, par son représentant. Religion : ses fidèles, ou les villes où elle domine.",
                    "Postes de gouvernement pour les civilisations et les villes ; résultat inscrit dans les chroniques.",
                ],
            },
            {
                titre: "Aides et utilitaires",
                categorie: "site",
                icon: "fa-solid fa-life-ring",
                lien: "/outils",
                texte: "Les guides pour bien démarrer et les rappels de commandes sur la page des aides, et les petits outils du quotidien sur la leur, pour ne plus fouiller le Discord.",
                details: [
                    "Conversion des coordonnées entre la surface et le Nether.",
                    "Distance et temps de trajet entre deux villes.",
                    "Conversion entre tetras, petits tetras et diamants ; fiche de personnage à coller sur Discord.",
                ],
            },
            {
                titre: "Carte interactive",
                categorie: "carte",
                icon: "fa-solid fa-map",
                texte: "Le monde vu d'en haut : villes, quartiers, commerces, alliances et zones de guerre, chacun sur son calque. Les frontières se tracent dans l'éditeur.",
            },
            {
                titre: "Protection des constructions",
                categorie: "carte",
                icon: "fa-solid fa-lock",
                lien: "/aides#guide-proteger",
                texte: "Le mod Flan protège en jeu les terrains revendiqués à la houe en or : rien n'y est détruit sans l'accord de leur propriétaire, qui donne ses droits à qui il veut.",
            },
            {
                titre: "Monde à télécharger",
                categorie: "carte",
                icon: "fa-solid fa-download",
                lien: "/outils#monde",
                texte: "Le monde qui a servi à la dernière mise à jour de la carte, à télécharger et à ouvrir en solo : pour visiter, repérer un terrain ou préparer un tournage.",
            },
            {
                titre: "Comptes Discord et Minecraft",
                categorie: "site",
                icon: "fa-brands fa-discord",
                texte: "Se connecter au site avec son compte Discord, et lier son compte Minecraft pour retrouver son pseudo et son skin.",
            },
            {
                titre: "Statistiques du monde",
                categorie: "carte",
                icon: "fa-solid fa-chart-simple",
                texte: "La sauvegarde du serveur est relevée régulièrement : population des villes mesurée d'après les lits réellement habités, zones les plus vécues, présence de chaque joueur.",
            },
        ],
    },
];

// Ancre d'une fonctionnalité (#carte-unifiee), pour la partager ou y revenir
const slug = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const normaliser = (texte) => (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const correspond = (fonctionnalite, recherche) => !recherche
    || [fonctionnalite.titre, fonctionnalite.texte, CATEGORIES[fonctionnalite.categorie]?.label, ...(fonctionnalite.details || [])].some((texte) => normaliser(texte).includes(recherche));

// Fonctionnalités d'une section regroupées par catégorie, dans l'ordre de CATEGORIES : [[clé, [fonctionnalités]], …]
const parCategorie = (fonctionnalites) => Object.keys(CATEGORIES)
    .map((cle) => [cle, fonctionnalites.filter((f) => f.categorie === cle)])
    .filter(([, liste]) => liste.length > 0);

// Sections repliées, gardées dans ce navigateur seulement (simple confort de lecture)
const CLE_REPLIEES = "roadmap-sections-repliees";
const lireRepliees = () => {
    try {
        return new Set(JSON.parse(localStorage.getItem(CLE_REPLIEES) || "[]"));
    } catch {
        return new Set();
    }
};
const ecrireRepliees = (repliees) => {
    try {
        localStorage.setItem(CLE_REPLIEES, JSON.stringify([...repliees]));
    } catch {
        // stockage indisponible (navigation privée) : le choix vaut pour cette visite
    }
};

function Fonctionnalite({ fonctionnalite, etat }) {
    const { titre, icon, texte, lien, details, question } = fonctionnalite;
    const ancre = slug(titre);
    return (
        <article id={ancre} className="group bg-base-200 rounded-3xl p-4 shadow-md flex flex-col gap-2 scroll-mt-40 target:ring-2 target:ring-primary">
            <div className="flex flex-row items-center gap-3">
                <FontAwesomeIcon icon={icon} className={`text-xl ${etat.puce}`} />
                <h4 className="font-bold text-lg flex-1">
                    {lien ? <a href={lien} className="link link-hover">{titre}</a> : titre}
                </h4>
                <a href={`#${ancre}`} className="opacity-0 group-hover:opacity-60 focus:opacity-60 text-sm" aria-label={`Lien vers « ${titre} »`}>
                    <FontAwesomeIcon icon="fa-solid fa-link" />
                </a>
            </div>
            <p className="opacity-80">{texte}</p>
            {details && (
                <ul className="flex flex-col gap-1 list-disc list-inside opacity-70 text-sm">
                    {details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
            )}
            {question && (
                <p className="flex flex-row gap-2 items-start text-sm bg-base-100 rounded-2xl p-3">
                    <FontAwesomeIcon icon="fa-solid fa-circle-question" className="mt-1 text-warning" />
                    <span className="opacity-80">{question}</span>
                </p>
            )}
        </article>
    );
}

export default function RoadmapPage() {
    const [repliees, setRepliees] = useState(lireRepliees);
    const [recherche, setRecherche] = useState("");
    // Catégorie affichée (null : toutes)
    const [categorie, setCategorie] = useState(null);
    const [actif, setActif] = useState(SECTIONS[0].etat);
    const [enHaut, setEnHaut] = useState(true);

    const terme = normaliser(recherche.trim());
    const sections = useMemo(
        () => SECTIONS.map((section) => ({
            ...section,
            visibles: section.fonctionnalites.filter((f) => correspond(f, terme) && (!categorie || f.categorie === categorie)),
        })),
        [terme, categorie]
    );
    // Nombre de fonctionnalités de chaque catégorie, toutes sections confondues (selon la recherche)
    const parCategorieTotal = useMemo(() => {
        const totaux = {};
        SECTIONS.forEach((section) => section.fonctionnalites.forEach((f) => {
            if (correspond(f, terme)) totaux[f.categorie] = (totaux[f.categorie] || 0) + 1;
        }));
        return totaux;
    }, [terme]);
    const trouvees = sections.reduce((total, section) => total + section.visibles.length, 0);

    const changer = (etat, replier) => setRepliees((avant) => {
        const apres = new Set(avant);
        if (replier) apres.add(etat);
        else apres.delete(etat);
        ecrireRepliees(apres);
        return apres;
    });
    const toutes = (replier) => {
        const apres = new Set(replier ? SECTIONS.map((section) => section.etat) : []);
        ecrireRepliees(apres);
        setRepliees(apres);
    };

    // Un lien vers une section ou une fonctionnalité repliée la déplie avant d'y aller
    useEffect(() => {
        const ouvrirCible = () => {
            const id = decodeURIComponent(window.location.hash.slice(1));
            if (!id) return;
            const section = SECTIONS.find((s) => s.etat === id || s.fonctionnalites.some((f) => slug(f.titre) === id));
            if (!section) return;
            setCategorie(null);
            setRepliees((avant) => {
                if (!avant.has(section.etat)) return avant;
                const apres = new Set(avant);
                apres.delete(section.etat);
                ecrireRepliees(apres);
                return apres;
            });
            requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
        };
        ouvrirCible();
        window.addEventListener("hashchange", ouvrirCible);
        return () => window.removeEventListener("hashchange", ouvrirCible);
    }, []);

    // Section en cours de lecture, soulignée dans la barre de navigation
    useEffect(() => {
        const visibles = new Map();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => visibles.set(entry.target.id, entry.isIntersecting));
            const premiere = SECTIONS.find((section) => visibles.get(section.etat));
            if (premiere) setActif(premiere.etat);
        }, { rootMargin: "-170px 0px -55% 0px" });
        SECTIONS.forEach((section) => {
            const element = document.getElementById(section.etat);
            if (element) observer.observe(element);
        });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const surDefilement = () => setEnHaut(window.scrollY < 600);
        window.addEventListener("scroll", surDefilement, { passive: true });
        return () => window.removeEventListener("scroll", surDefilement);
    }, []);

    return (
        <>
            <Navbar active="roadmap" />
            <div className="bg-base-100">
                <main className="container mx-auto p-4">

                    <GrimoireHero
                        icon="fa-solid fa-route"
                        title="La feuille de route"
                        description="Ce qui vous attend, ce qui se construit en ce moment, et ce que Tetrago sait déjà faire. Une idée, un désaccord sur l'ordre des chantiers ? Le Discord est là pour ça."
                    />

                    {/* Navigation : suit la lecture, filtre et replie les sections */}
                    <nav aria-label="Sections de la feuille de route" className="sticky top-24 z-20 mt-2 py-2 px-3 rounded-3xl bg-base-200 backdrop-blur shadow-md flex flex-col md:flex-row md:items-center gap-2">
                        <div className="flex flex-wrap gap-2 flex-1">
                            {sections.map((section) => {
                                const etat = ETATS[section.etat];
                                return (
                                    <a
                                        key={section.etat}
                                        href={`#${section.etat}`}
                                        aria-current={actif === section.etat ? "true" : undefined}
                                        className={`btn btn-sm rounded-full ${actif === section.etat ? "btn-primary" : "bg-base-200"}`}
                                    >
                                        <FontAwesomeIcon icon={etat.icon} />
                                        <span>{etat.label}</span>
                                        <span className="badge badge-sm">{section.visibles.length}</span>
                                    </a>
                                );
                            })}
                        </div>
                        <div className="flex flex-row items-center gap-2">
                            <label className="input input-sm rounded-full bg-base-200 flex-1 md:w-64">
                                <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="opacity-60" />
                                <input type="search" aria-label="Rechercher dans la feuille de route" placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                            </label>
                            <button type="button" className="btn btn-sm btn-ghost rounded-full" onClick={() => toutes(repliees.size < SECTIONS.length)}>
                                <FontAwesomeIcon icon={repliees.size < SECTIONS.length ? "fa-solid fa-compress" : "fa-solid fa-expand"} />
                                <span className="hidden sm:inline">{repliees.size < SECTIONS.length ? "Tout replier" : "Tout déplier"}</span>
                            </button>
                        </div>
                    </nav>

                    {/* Catégories : une seule à la fois, un second clic revient à toutes */}
                    <div role="group" aria-label="Catégories de la feuille de route" className="mt-3 flex flex-wrap gap-2">
                        <button type="button" aria-pressed={!categorie} onClick={() => setCategorie(null)} className={`btn btn-xs rounded-full ${!categorie ? "btn-primary" : "btn-ghost bg-base-200"}`}>
                            Toutes
                        </button>
                        {Object.entries(CATEGORIES).map(([cle, { label, icon }]) => (
                            <button
                                key={cle}
                                type="button"
                                aria-pressed={categorie === cle}
                                onClick={() => setCategorie(categorie === cle ? null : cle)}
                                className={`btn btn-xs rounded-full ${categorie === cle ? "btn-primary" : "btn-ghost bg-base-200"}`}
                            >
                                <FontAwesomeIcon icon={icon} />
                                {label}
                                <span className="badge badge-xs">{parCategorieTotal[cle] || 0}</span>
                            </button>
                        ))}
                    </div>

                    {terme || categorie ? (
                        <p role="status" className="mt-4 opacity-80">
                            {trouvees === 0 ? "Aucune fonctionnalité ne correspond à votre recherche." : `${trouvees} fonctionnalité${trouvees > 1 ? "s" : ""} trouvée${trouvees > 1 ? "s" : ""}.`}
                        </p>
                    ) : null}

                    {sections.map((section) => {
                        const etat = ETATS[section.etat];
                        // Une recherche déplie les sections, pour montrer tous les résultats
                        const repliee = repliees.has(section.etat) && !terme;
                        if ((terme || categorie) && section.visibles.length === 0) return null;
                        return (
                            <section key={section.etat} id={section.etat} className="mb-10 mt-6 scroll-mt-40">
                                <div className="flex flex-row items-center gap-2">
                                    <div className="flex-1 min-w-0"><TitleH2 text={section.titre} icon={etat.icon} /></div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-ghost bg-base-200 rounded-full"
                                        aria-expanded={!repliee}
                                        aria-controls={`${section.etat}-contenu`}
                                        onClick={() => changer(section.etat, !repliee)}
                                    >
                                        <FontAwesomeIcon icon="fa-solid fa-chevron-down" className={`transition-transform ${repliee ? "-rotate-90" : ""}`} />
                                        <span>{repliee ? "Afficher" : "Masquer"}</span>
                                    </button>
                                </div>
                                <p className="mt-3 mb-4 opacity-80 max-w-2xl flex flex-row flex-wrap items-center gap-2">
                                    <span className={`badge ${etat.badge}`}>{etat.label}</span>
                                    <span>{section.dek}</span>
                                    {repliee ? <span className="text-sm opacity-70">· {section.fonctionnalites.length} fonctionnalité{section.fonctionnalites.length > 1 ? "s" : ""} masquée{section.fonctionnalites.length > 1 ? "s" : ""}</span> : null}
                                </p>
                                <div id={`${section.etat}-contenu`} hidden={repliee} className="flex flex-col gap-6">
                                    {parCategorie(section.visibles).map(([cle, liste]) => (
                                        <div key={cle} role="group" aria-labelledby={`${section.etat}-${cle}`} className="flex flex-col gap-3">
                                            <h3 id={`${section.etat}-${cle}`} className="flex flex-row items-center gap-2 font-semibold text-base opacity-80 px-1">
                                                <FontAwesomeIcon icon={CATEGORIES[cle].icon} />
                                                {CATEGORIES[cle].label}
                                                <span className="badge badge-sm badge-ghost">{liste.length}</span>
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {liste.map((fonctionnalite) => (
                                                    <Fonctionnalite key={fonctionnalite.titre} fonctionnalite={fonctionnalite} etat={etat} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    <section className="bg-base-200 rounded-3xl p-6 text-center flex flex-col items-center gap-3 mb-6">
                        <FontAwesomeIcon icon="fa-solid fa-comments" size="2x" className="text-warning" />
                        <h2 className="text-2xl font-bold">Cette liste vous appartient</h2>
                        <p className="max-w-xl opacity-80">
                            Rien n'est gravé : un chantier peut monter dans la liste parce que vous en avez besoin,
                            ou en descendre parce qu'il ne sert personne. Dites-le.
                        </p>
                        <a href="https://discord.gg/pcVFzYA534" target="_blank" rel="noopener noreferrer" className="btn btn-ghost bg-base-100">
                            <FontAwesomeIcon icon="fa-brands fa-discord" />
                            Proposer une idée sur le Discord
                        </a>
                    </section>

                    {enHaut ? null : (
                        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn btn-circle btn-base-200 fixed bottom-6 right-6 z-30 shadow-lg" aria-label="Revenir en haut de la page">
                            <FontAwesomeIcon icon="fa-solid fa-arrow-up" />
                        </a>
                    )}

                </main>
            </div>
        </>
    );
}
