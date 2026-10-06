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
};

const SECTIONS = [
    {
        etat: "avenir",
        titre: "À venir",
        dek: "Les chantiers suivants, dans le désordre : l'ordre se décidera avec vous.",
        fonctionnalites: [
            {
                titre: "Organisateur d'élections RP",
                icon: "fa-solid fa-check-to-slot",
                texte: "Ouvrir un scrutin au sein d'une civilisation, d'une alliance ou d'une religion : candidats, votants, dépouillement et résultat conservé.",
                details: [
                    "Candidatures, puis vote des membres entre deux dates.",
                    "Vote secret possible : on compte sans savoir qui a voté quoi.",
                    "Résultat archivé dans l'histoire de la civilisation, de l'alliance ou de la religion.",
                ],
            },
            {
                titre: "Aides et utilitaires",
                icon: "fa-solid fa-life-ring",
                texte: "Une section rassemblant les guides, les rappels de commandes et les petits outils du quotidien, pour ne plus fouiller le Discord.",
                details: [
                    "Conversion des coordonnées entre la surface et le Nether.",
                    "Distance et temps de trajet entre deux villes.",
                    "Conversion entre tetras, diamants et blocs ; fiche de personnage à coller sur Discord.",
                ],
            },
        ],
    },
    // {
    //     etat: "chantier",
    //     titre: "En chantier",
    //     dek: "Commencé, pas encore fini.",
    //     fonctionnalites: [
    //         {
    //             titre: "Frontières de toutes les villes",
    //             icon: "fa-solid fa-draw-polygon",
    //             texte: "Tant qu'une ville n'a pas de frontières tracées, sa population est mesurée dans un simple rayon autour de son point : le chiffre reste approximatif.",
    //         },
    //     ],
    // },
    {
        etat: "disponible",
        titre: "Fonctionnalités de la version 2.0",
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
                titre: "Population officielle ajustée",
                icon: "fa-solid fa-users",
                lien: "/civilisations",
                texte: "La population d'une ville, ce sont les lits habités comptés au relevé du monde, plus les écarts motivés (réfugiés, épidémie…) que ses dirigeants demandent et qu'un modérateur RP valide. Chaque civilisation affiche aussi l'armée qu'elle peut lever.",
            },
            {
                titre: "Zones commerciales",
                icon: "fa-solid fa-store",
                lien: "/commerces",
                texte: "Marchés et quartiers marchands tracés sur la carte par chaque ville, avec les boutiques qui s'y tiennent : visibles sur la carte, sur la fiche de la ville et sur la page des commerces.",
            },
            {
                titre: "Règles des guerres",
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
                icon: "fa-solid fa-landmark",
                lien: "/codex#coherence",
                texte: "Un Moyen Âge où la magie existe : ni poudre ni machines, des villes bâties selon leur temps et une mécanique qui se dissimule.",
            },
            {
                titre: "Fermes justifiées en RP",
                icon: "fa-solid fa-wheat-awn",
                lien: "/codex#fermes",
                texte: "Toute ferme se déclare avec sa raison d'être dans l'histoire et s'habille d'un bâtiment qui lui ressemble : plus de boîte de redstone posée au milieu d'un champ.",
            },
            {
                titre: "Actions secrètes",
                icon: "fa-solid fa-user-secret",
                lien: "/actions-secretes",
                texte: "Sceller une action à la date et à l'heure réelles, puis la révéler plus tard (soi-même, par un modérateur RP ou à une date fixée) : la preuve qu'elle a été décidée avant, et non après coup. Le conflit d'intérêts de l'équipe, qui joue aussi, est levé par la lecture tracée : chaque lecture d'un administrateur ou d'un modérateur RP est rendue publique.",
            },
            {
                titre: "Zones et bâtiments destructibles",
                icon: "fa-solid fa-house-crack",
                lien: "/civilisations",
                texte: "Savoir, avant la bataille, ce qui peut tomber : chaque ville désigne sur la carte les bâtiments et les zones qu'une guerre RP autorise à détruire, listés sur sa fiche.",
            },
            {
                titre: "La monnaie officielle : le tetra",
                icon: "fa-solid fa-gem",
                lien: "/codex#monnaie",
                texte: "Un tetra vaut un diamant. Il s'obtient par le commerce, le minage ou le trésor d'une civilisation, et c'est la seule monnaie admise entre joueurs.",
            },
            {
                titre: "Catalogue des boutiques",
                icon: "fa-solid fa-tags",
                lien: "/commerces#ou-acheter",
                texte: "Chaque magasin publie ses articles et leurs prix en tetras, et la recherche « Où acheter ? » de la page des commerces trouve les boutiques qui les vendent, de la moins chère à la plus chère.",
            },
            {
                titre: "Jours de marché et foires",
                icon: "fa-solid fa-calendar-day",
                lien: "/commerces#foires",
                texte: "Chaque zone commerciale affiche ses jours d'ouverture, et une ville peut annoncer une foire datée : sur sa fiche, sur la page des commerces, sur la carte et sur Discord.",
            },
            {
                titre: "Cibles d'une guerre",
                icon: "fa-solid fa-house-crack",
                lien: "/guerres",
                texte: "Sur la fiche d'une guerre, les bâtiments et zones destructibles des villes des deux camps, avec leur carte : ce que la guerre autorise à détruire.",
            },
            {
                titre: "Levée des troupes",
                icon: "fa-solid fa-people-group",
                lien: "/guerres",
                texte: "Pendant une guerre, chaque civilisation engagée lève ses troupes ville par ville, au plus un soldat pour dix habitants. Une troupe est toujours sur un champ de bataille ou en mouvement ; ses déplacements publics entrent dans la chronologie, et seuls son camp et les modérateurs RP la voient, y compris sur la carte de la guerre, jusqu'à la fin de celle-ci.",
            },
            {
                titre: "Compagnies de mercenaires",
                icon: "fa-solid fa-coins",
                lien: "/guerres#mercenaires",
                texte: "Une civilisation loue ses soldats en compagnies de mercenaires, avec leur tarif, sans entrer dans les guerres : le camp qui les engage les commande, et leur civilisation peut les rappeler en rompant le contrat.",
            },
            {
                titre: "Tableau de bord des modérateurs RP",
                icon: "fa-solid fa-gavel",
                texte: "Une seule page pour tout ce qui attend une décision de la modération RP : déclarations de guerre, ajustements de population, fermes déclarées, pièges révélés. Le suivi des guerres en cours et l'historique de chaque décision y sont rassemblés.",
                details: [
                    "Un piège déclaré comme tel au dépôt ne tue qu'une fois validé après sa révélation.",
                    "Un modérateur ne tranche ni sa propre demande, ni son propre piège.",
                ],
            },
            {
                titre: "Carte unifiée",
                icon: "fa-solid fa-layer-group",
                lien: CARTE.href,
                texte: "Civilisations, commerces et guerres ensemble sur une même carte, avec une légende : chaque thème s'affiche ou se masque, et l'adresse garde la vue choisie pour la partager.",
            },
            {
                titre: "Notifications sur le site",
                icon: "fa-solid fa-bell",
                texte: "Une cloche dans la barre, une fois connecté, pour ce qui vous concerne : appels aux armes, invitations d'alliance, liens de parenté à accepter, lectures tracées et révélations de vos actions secrètes, décisions de la modération RP.",
                details: [
                    "Un clic sur une notification mène à la page concernée et la marque comme lue.",
                    "Les modérateurs RP y voient arriver les déclarations de guerre, les fermes, les ajustements de population et les pièges à juger.",
                ],
            },
            {
                titre: "Déclaration des fermes sur le site",
                icon: "fa-solid fa-wheat-awn",
                lien: "/fermes",
                texte: "Déclarer une ferme sur le site (position, justification RP, photo) plutôt que par ticket, et suivre son statut : en attente, validée ou à mettre en conformité.",
            },
            {
                titre: "Chroniques de Tetrago",
                icon: "fa-solid fa-timeline",
                lien: "/chroniques",
                texte: "Une frise de l'histoire du monde, année après année du calendrier RP, remplie toute seule : fondations, alliances, guerres et batailles, naissances, morts et mariages des maisons nobles, plus les faits marquants qu'y inscrivent les modérateurs RP.",
            },
            {
                titre: "Lignées et généalogie",
                icon: "fa-solid fa-sitemap",
                lien: "/maisons",
                texte: "Des liens de parenté entre personnages (parents, conjoints, héritiers), acceptés par le joueur de chacun, et les maisons nobles : blason, devise, chef et l'arbre de leur lignée.",
            },
            {
                titre: "Calendrier des événements RP",
                icon: "fa-solid fa-calendar-days",
                lien: "/calendrier",
                texte: "Batailles prévues, fêtes, couronnements, tournois : chacun annonce ses événements et s'inscrit à ceux des autres, sous les traits de son personnage. Chaque annonce est publiée sur Discord et reproduite parmi les événements du serveur.",
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
];

// Ancre d'une fonctionnalité (#carte-unifiee), pour la partager ou y revenir
const slug = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const normaliser = (texte) => (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const correspond = (fonctionnalite, recherche) => !recherche
    || [fonctionnalite.titre, fonctionnalite.texte, ...(fonctionnalite.details || [])].some((texte) => normaliser(texte).includes(recherche));

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
                <h3 className="font-bold text-lg flex-1">
                    {lien ? <a href={lien} className="link link-hover">{titre}</a> : titre}
                </h3>
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
    const [actif, setActif] = useState(SECTIONS[0].etat);
    const [enHaut, setEnHaut] = useState(true);

    const terme = normaliser(recherche.trim());
    const sections = useMemo(
        () => SECTIONS.map((section) => ({ ...section, visibles: section.fonctionnalites.filter((f) => correspond(f, terme)) })),
        [terme]
    );
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

                    {terme ? (
                        <p role="status" className="mt-4 opacity-80">
                            {trouvees === 0 ? "Aucune fonctionnalité ne correspond à votre recherche." : `${trouvees} fonctionnalité${trouvees > 1 ? "s" : ""} trouvée${trouvees > 1 ? "s" : ""}.`}
                        </p>
                    ) : null}

                    {sections.map((section) => {
                        const etat = ETATS[section.etat];
                        // Une recherche déplie les sections, pour montrer tous les résultats
                        const repliee = repliees.has(section.etat) && !terme;
                        if (terme && section.visibles.length === 0) return null;
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
                                <div id={`${section.etat}-contenu`} hidden={repliee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {section.visibles.map((fonctionnalite) => (
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
