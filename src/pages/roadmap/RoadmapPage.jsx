import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import TitleH2 from "@/components/ui/TitleH2";

// ===== Feuille de route =====
// Page publique : ce qui existe déjà sur Tetrago, ce qui est en chantier, ce qui viendra.
// Les tâches internes restent dans TACHES_RESTANTES.md ; ici, seulement ce qui change quelque chose pour les joueurs.

const ETATS = {
    disponible: { label: "Disponible", icon: "fa-solid fa-circle-check", badge: "badge-success", puce: "text-success" },
    chantier: { label: "En chantier", icon: "fa-solid fa-hammer", badge: "badge-warning", puce: "text-warning" },
    avenir: { label: "À venir", icon: "fa-solid fa-hourglass-start", badge: "badge-ghost", puce: "opacity-60" },
};

const SECTIONS = [
    {
        etat: "disponible",
        titre: "Déjà en jeu",
        dek: "Tout ceci fonctionne aujourd'hui, sur le site comme sur le serveur.",
        fonctionnalites: [
            {
                titre: "Civilisations, villes et quartiers",
                icon: "fa-solid fa-flag",
                lien: "/civilisations",
                texte: "Fonder une civilisation, y rattacher des villes et découper celles-ci en quartiers, avec leurs dirigeants et leurs habitants.",
            },
            {
                titre: "Religions",
                icon: "fa-solid fa-cross",
                lien: "/religions",
                texte: "Créer un culte, accueillir ses fidèles, l'implanter dans les villes qui l'adoptent.",
            },
            {
                titre: "Commerces",
                icon: "fa-solid fa-shop",
                lien: "/commerces",
                texte: "Déclarer une échoppe, son enseigne, sa ville et les membres qui la tiennent.",
            },
            {
                titre: "Alliances",
                icon: "fa-solid fa-handshake",
                lien: "/alliances",
                texte: "Sceller un pacte entre civilisations, avec son chef de file et ses membres.",
            },
            {
                titre: "Guerres",
                icon: "fa-solid fa-shield-halved",
                lien: "/guerres",
                texte: "Déclarer une guerre, rallier un camp, tenir la chronologie des batailles, sièges et traités, tracer les zones de conflit sur la carte. Chaque étape est annoncée sur le Discord.",
            },
            {
                titre: "Personnages RP",
                icon: "fa-solid fa-masks-theater",
                lien: "/personnages",
                texte: "Espèce, classe, grade, skin et résidence : votre personnage vit sur le site autant que sur le serveur.",
            },
            {
                titre: "Bibliothèque",
                icon: "fa-solid fa-book",
                lien: "/bibliotheque",
                texte: "Livres et journaux du monde, avec les messages signés par les personnages.",
            },
            {
                titre: "Codex",
                icon: "fa-solid fa-scroll",
                lien: "/codex",
                texte: "La loi du serveur et les règles du rôle-play, réunies en deux livres.",
            },
            {
                titre: "Carte interactive",
                icon: "fa-solid fa-map",
                texte: "Le monde vu d'en haut : villes, quartiers, commerces, alliances et zones de guerre, chacun sur son calque. Les frontières se tracent dans l'éditeur.",
            },
            {
                titre: "Comptes Discord et Minecraft",
                icon: "fa-brands fa-discord",
                texte: "Se connecter au site avec son compte Discord, et lier son compte Minecraft pour retrouver son pseudo et son skin.",
            },
            {
                titre: "Statistiques du monde",
                icon: "fa-solid fa-chart-simple",
                texte: "La sauvegarde du serveur est relevée régulièrement : population des villes mesurée d'après les lits réellement habités, zones les plus vécues, présence de chaque joueur.",
            },
        ],
    },
    {
        etat: "chantier",
        titre: "En chantier",
        dek: "Commencé, pas encore fini.",
        fonctionnalites: [
            {
                titre: "Frontières de toutes les villes",
                icon: "fa-solid fa-draw-polygon",
                texte: "Tant qu'une ville n'a pas de frontières tracées, sa population est mesurée dans un simple rayon autour de son point : le chiffre reste approximatif.",
            },
            {
                titre: "Population officielle ajustée",
                icon: "fa-solid fa-users",
                texte: "Aujourd'hui, chaque relevé du monde écrase la population saisie à la main. À terme, un modérateur pourra valider un ajustement quand la mesure ne rend pas justice à la ville.",
            },
        ],
    },
    {
        etat: "avenir",
        titre: "À venir",
        dek: "Les chantiers suivants, dans le désordre : l'ordre se décidera avec vous.",
        fonctionnalites: [
            {
                titre: "La monnaie officielle du serveur",
                icon: "fa-solid fa-coins",
                texte: "Une page dédiée à la monnaie de Tetrago : son nom, ce qu'elle vaut, comment on l'obtient et où elle a cours.",
            },
            {
                titre: "Zones commerciales",
                icon: "fa-solid fa-store",
                texte: "Déclarer les quartiers marchands et les marchés, les retrouver sur la carte et savoir qui y tient boutique.",
            },
            {
                titre: "Règles des guerres",
                icon: "fa-solid fa-chess-knight",
                texte: "Le règlement complet d'une guerre RP, pour que chaque camp joue avec les mêmes cartes en main.",
                details: [
                    "Répartition des troupes et des soldats entre les camps.",
                    "Déplacements des troupes : ce qui se déclare en public, ce qui reste secret.",
                    "Assassinat d'un personnage : ce qu'un piège en jeu permet, et ce qu'il ne permet pas.",
                ],
            },
            {
                titre: "Zones et bâtiments destructibles",
                icon: "fa-solid fa-house-crack",
                texte: "Savoir, avant la bataille, ce qui peut tomber : les zones et les bâtiments qu'une guerre RP autorise à détruire, repérés sur la carte.",
            },
            {
                titre: "Actions secrètes",
                icon: "fa-solid fa-user-secret",
                texte: "Consigner une action tenue secrète, horodatée à la date et à l'heure réelles, et pouvoir la révéler en public plus tard — la preuve qu'elle a bien été décidée avant, et non après coup.",
                question: "À trancher : les administrateurs et les modérateurs RP voient les actions secrètes, alors qu'ils jouent eux aussi. Reste à décider comment lever ce conflit d'intérêts.",
            },
            {
                titre: "Cohérence historique",
                icon: "fa-solid fa-landmark",
                texte: "Ce que l'époque du serveur admet et ce qu'elle refuse : le thème tient tant que les constructions et les récits s'y tiennent.",
            },
            {
                titre: "Fermes justifiées en RP",
                icon: "fa-solid fa-wheat-awn",
                texte: "Toute ferme devra avoir une raison d'être dans l'histoire et une représentation qui lui ressemble : plus de boîte de redstone posée au milieu d'un champ.",
            },
            {
                titre: "Organisateur d'élections RP",
                icon: "fa-solid fa-check-to-slot",
                texte: "Ouvrir un scrutin au sein d'une civilisation, d'une alliance ou d'une religion : candidats, votants, dépouillement et résultat conservé.",
            },
            {
                titre: "Aides et utilitaires",
                icon: "fa-solid fa-life-ring",
                texte: "Une section rassemblant les guides, les rappels de commandes et les petits outils du quotidien, pour ne plus fouiller le Discord.",
            },
        ],
    },
];

function Fonctionnalite({ fonctionnalite, etat }) {
    const { titre, icon, texte, lien, details, question } = fonctionnalite;
    return (
        <div className="bg-base-200 rounded-3xl p-4 shadow-md flex flex-col gap-2">
            <div className="flex flex-row items-center gap-3">
                <FontAwesomeIcon icon={icon} className={`text-xl ${etat.puce}`} />
                <h3 className="font-bold text-lg">
                    {lien ? <a href={lien} className="link link-hover">{titre}</a> : titre}
                </h3>
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
        </div>
    );
}

export default function RoadmapPage() {
    return (
        <>
            <Navbar active="roadmap" />
            <div className="bg-base-100">
                <main className="container mx-auto p-4">

                    <GrimoireHero
                        icon="fa-solid fa-route"
                        title="La feuille de route"
                        description="Ce que Tetrago sait déjà faire, ce qui se construit en ce moment, et ce qui vous attend. Une idée, un désaccord sur l'ordre des chantiers ? Le Discord est là pour ça."
                    >
                        <div className="flex flex-wrap justify-center gap-2">
                            {SECTIONS.map((section) => (
                                <a key={section.etat} href={`#${section.etat}`} className="btn btn-sm bg-base-100 rounded-full">
                                    <FontAwesomeIcon icon={ETATS[section.etat].icon} />
                                    <span>{ETATS[section.etat].label}</span>
                                    <span className="badge badge-sm">{section.fonctionnalites.length}</span>
                                </a>
                            ))}
                        </div>
                    </GrimoireHero>

                    {SECTIONS.map((section) => {
                        const etat = ETATS[section.etat];
                        return (
                            <section key={section.etat} id={section.etat} className="mb-12 mt-6 scroll-mt-24">
                                <TitleH2 text={section.titre} icon={etat.icon} />
                                <p className="mt-3 mb-4 opacity-80 max-w-2xl flex flex-row flex-wrap items-center gap-2">
                                    <span className={`badge ${etat.badge}`}>{etat.label}</span>
                                    <span>{section.dek}</span>
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.fonctionnalites.map((fonctionnalite) => (
                                        <Fonctionnalite key={fonctionnalite.titre} fonctionnalite={fonctionnalite} etat={etat} />
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
                        <a href="https://discord.gg/nUFwE9S" target="_blank" rel="noopener noreferrer" className="btn btn-ghost bg-base-100">
                            <FontAwesomeIcon icon="fa-brands fa-discord" />
                            Proposer une idée sur le Discord
                        </a>
                    </section>

                </main>
            </div>
        </>
    );
}
