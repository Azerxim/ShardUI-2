import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import ConvertisseurNether from "@/components/aides/ConvertisseurNether";
import ConvertisseurTetras from "@/components/aides/ConvertisseurTetras";
import DistanceVilles from "@/components/aides/DistanceVilles";
import FicheDiscord from "@/components/aides/FicheDiscord";
import CabinePhoto from "@/components/aides/CabinePhoto";
import AideCandidature from "@/components/aides/AideCandidature";
import Onglets, { PanneauOnglet } from "@/components/ui/Onglets";
import { COMMANDES, GROUPES_OUTILS, GUIDES, OUTILS } from "@/config/aides";

// ===== Aides et utilitaires =====
// Guides pas à pas, rappel des commandes du serveur et petits outils du quotidien, pour ne plus fouiller le Discord.
// Contenu : config/aides.js ; outils : components/aides/.
// Un onglet par partie, repris dans l'adresse (/aides#outils) ; une ancre intérieure (#guide-commerce) ouvre son onglet.
// L'onglet « Outils » a ses propres onglets : un accueil qui présente les outils (#outils), puis un par outil, dont
// l'ancre est l'id (#nether, #candidature). Les onglets fermés restent montés : les saisies ne se perdent pas.

const ONGLETS = [
    { id: "guides", icon: "fa-solid fa-signs-post", text: "Guides", texte: "Pas à pas, de la candidature à votre première guerre." },
    { id: "commandes", icon: "fa-solid fa-terminal", text: "Commandes", texte: "Les commandes du serveur à garder sous la main." },
    { id: "outils", icon: "fa-solid fa-toolbox", text: "Outils", texte: "De petits outils pour préparer votre arrivée, vous repérer en jeu et présenter vos personnages." },
];

// Composant de chaque outil (textes de l'accueil des outils : config/aides.js, OUTILS)
const COMPOSANTS_OUTILS = {
    candidature: AideCandidature,
    nether: ConvertisseurNether,
    tetras: ConvertisseurTetras,
    distance: DistanceVilles,
    "fiche-discord": FicheDiscord,
    "cabine-photo": CabinePhoto,
};

const ACCUEIL_OUTILS = "accueil";
const ONGLETS_OUTILS = [
    { id: ACCUEIL_OUTILS, icon: "fa-solid fa-table-cells-large", text: "Tous les outils" },
    ...OUTILS.map((outil) => ({ id: outil.id, icon: outil.icon, text: outil.onglet })),
];
const outilParId = Object.fromEntries(OUTILS.map((outil) => [outil.id, outil]));

// Ce que désigne l'ancre de l'adresse : { onglet, outil? }, ou null si elle ne correspond à rien
function positionDeAncre(ancre) {
    if (ancre === "outils") return { onglet: "outils", outil: ACCUEIL_OUTILS };
    if (ONGLETS.some((onglet) => onglet.id === ancre)) return { onglet: ancre };
    if (ancre.startsWith("guide-")) return { onglet: "guides" };
    if (ancre.startsWith("commandes-")) return { onglet: "commandes" };
    if (outilParId[ancre]) return { onglet: "outils", outil: ancre };
    return null;
}

// Ancre de l'adresse pour un outil ouvert (l'accueil des outils reprend celle de l'onglet)
const ancreOutil = (outil) => (outil === ACCUEIL_OUTILS ? "outils" : outil);

const ancreActuelle = () => decodeURIComponent(window.location.hash.slice(1));

// Dernier onglet ouvert, gardé dans ce navigateur seulement : sans ancre dans l'adresse, la page y revient
const CLE_ONGLET = "aides-onglet";
const lireOnglet = () => {
    try {
        const id = localStorage.getItem(CLE_ONGLET);
        return ONGLETS.some((onglet) => onglet.id === id) ? id : null;
    } catch {
        return null;
    }
};
const retenirOnglet = (id) => {
    try {
        localStorage.setItem(CLE_ONGLET, id);
    } catch {
        // stockage indisponible (navigation privée) : l'onglet vaut pour cette visite
    }
};

const externe = (lien) => /^https?:/.test(lien);

function Guide({ guide }) {
    return (
        <article id={`guide-${guide.id}`} className="flex flex-col gap-3 bg-base-200 rounded-3xl p-5 shadow-md scroll-mt-24 target:ring-2 target:ring-primary">
            <h3 className="flex items-center gap-3 font-bold text-lg">
                <FontAwesomeIcon icon={guide.icon} className="text-secondary" />
                {guide.titre}
            </h3>
            <ol className="flex flex-col gap-2">
                {guide.etapes.map((etape, index) => (
                    <li key={etape.texte} className="flex gap-3 text-sm">
                        <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-base-100 font-semibold text-xs">{index + 1}</span>
                        <span className="opacity-90">
                            {etape.texte}
                            {etape.lien && (
                                <>
                                    {" "}
                                    <a
                                        href={etape.lien}
                                        {...(externe(etape.lien) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                        className="link link-hover font-semibold whitespace-nowrap"
                                    >
                                        {etape.libelle}
                                        <FontAwesomeIcon icon={externe(etape.lien) ? "fa-solid fa-arrow-up-right-from-square" : "fa-solid fa-angle-right"} className="ml-1 text-xs" />
                                    </a>
                                </>
                            )}
                        </span>
                    </li>
                ))}
            </ol>
        </article>
    );
}

// Accueil des outils : rangés par usage, chacun avec ce qu'il fait ; la carte entière ouvre l'outil (#id)
function AccueilOutils() {
    return (
        <div className="flex flex-col gap-6">
            {GROUPES_OUTILS.map((groupe) => (
                <section key={groupe.id} aria-labelledby={`groupe-outils-${groupe.id}`} className="flex flex-col gap-3">
                    <h3 id={`groupe-outils-${groupe.id}`} className="flex items-center gap-2 font-bold text-lg px-1">
                        <FontAwesomeIcon icon={groupe.icon} className="text-secondary" />
                        {groupe.titre}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {groupe.outils.map((id) => {
                            const outil = outilParId[id];
                            return (
                                <a key={id} href={`#${id}`} className="group flex flex-col gap-3 bg-base-200 rounded-3xl p-5 shadow-md hover:shadow-lg hover:bg-base-300 transition">
                                    <div className="flex flex-row items-start gap-3">
                                        <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-2xl bg-secondary text-secondary-content">
                                            <FontAwesomeIcon icon={outil.icon} />
                                        </span>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="font-bold">{outil.titre}</span>
                                            <span className="text-sm opacity-80">{outil.resume}</span>
                                        </div>
                                    </div>
                                    <ul className="flex flex-col gap-1 text-xs opacity-70">
                                        {outil.details.map((detail) => (
                                            <li key={detail} className="flex items-baseline gap-2">
                                                <FontAwesomeIcon icon="fa-solid fa-check" className="text-success" />
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                    <span className="mt-auto self-end text-sm font-semibold text-primary group-hover:underline">
                                        Ouvrir l'outil
                                        <FontAwesomeIcon icon="fa-solid fa-angle-right" className="ml-1" />
                                    </span>
                                </a>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}

function GroupeCommandes({ groupe }) {
    return (
        <article id={`commandes-${groupe.id}`} className="flex flex-col gap-3 bg-base-200 rounded-3xl p-5 shadow-md scroll-mt-24">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="flex items-center gap-3 font-bold text-lg">
                    <FontAwesomeIcon icon={groupe.icon} className="text-secondary" />
                    {groupe.titre}
                </h3>
                <span className="badge badge-ghost badge-sm">{groupe.source}</span>
            </div>
            <dl className="flex flex-col gap-2">
                {groupe.commandes.map((item) => (
                    <div key={item.commande} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 bg-base-100 rounded-xl px-3 py-2">
                        <dt className="sm:w-48 shrink-0"><code className="font-mono text-sm font-semibold break-words">{item.commande}</code></dt>
                        <dd className="text-sm opacity-80">{item.texte}</dd>
                    </div>
                ))}
            </dl>
        </article>
    );
}

export default function AidesPage() {
    // L'ancre de l'adresse passe avant le dernier onglet ouvert
    const [actif, setActif] = useState(() => positionDeAncre(ancreActuelle())?.onglet ?? lireOnglet() ?? ONGLETS[0].id);
    const [outil, setOutil] = useState(() => positionDeAncre(ancreActuelle())?.outil ?? ACCUEIL_OUTILS);

    useEffect(() => retenirOnglet(actif), [actif]);

    // Lien vers un onglet, un outil ou une ancre intérieure : ouvre son onglet (et son outil), puis va à l'ancre
    useEffect(() => {
        const suivreAncre = () => {
            const ancre = ancreActuelle();
            const position = positionDeAncre(ancre);
            if (!position) return;
            setActif(position.onglet);
            if (position.outil) setOutil(position.outil);
            if (ancre !== position.onglet) requestAnimationFrame(() => document.getElementById(ancre)?.scrollIntoView({ block: "start" }));
        };
        suivreAncre();
        window.addEventListener("hashchange", suivreAncre);
        return () => window.removeEventListener("hashchange", suivreAncre);
    }, []);

    // replaceState : l'adresse suit l'onglet sans faire défiler la page ni allonger l'historique
    const ouvrir = (id) => {
        setActif(id);
        window.history.replaceState(null, "", `#${id === "outils" ? ancreOutil(outil) : id}`);
    };
    const ouvrirOutil = (id) => {
        setOutil(id);
        window.history.replaceState(null, "", `#${ancreOutil(id)}`);
    };

    const panneau = (id, children) => (
        <PanneauOnglet prefixe="onglet" id={id} actif={actif} className="flex flex-col gap-4">
            <p className="opacity-80 px-1">{ONGLETS.find((onglet) => onglet.id === id).texte}</p>
            {children}
        </PanneauOnglet>
    );

    return (
        <>
            <Navbar active="aides" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-6">
                    <GrimoireHero
                        icon="fa-solid fa-life-ring"
                        title="Aides et utilitaires"
                        description="Les guides pour bien démarrer, les commandes à garder sous la main et les petits outils du quotidien : candidature, coordonnées du Nether, trajets, monnaie, fiche de personnage et cabine photo."
                    />

                    <Onglets onglets={ONGLETS} actif={actif} onChange={ouvrir} label="Aides et utilitaires" prefixe="onglet" className="-mt-4" />

                    {panneau("guides", (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {GUIDES.map((guide) => <Guide key={guide.id} guide={guide} />)}
                            </div>
                            <p className="text-sm opacity-70 px-1">
                                Un terme vous échappe ? Le <a href="/codex#glossaire" className="link link-hover font-semibold">glossaire du Codex</a> les explique tous.
                            </p>
                        </>
                    ))}

                    {panneau("commandes", (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {COMMANDES.map((groupe) => <GroupeCommandes key={groupe.id} groupe={groupe} />)}
                        </div>
                    ))}

                    {panneau("outils", (
                        <>
                            <Onglets onglets={ONGLETS_OUTILS} actif={outil} onChange={ouvrirOutil} label="Outils" prefixe="outil" variante="bordure" />
                            <PanneauOnglet prefixe="outil" id={ACCUEIL_OUTILS} actif={outil}>
                                <AccueilOutils />
                            </PanneauOnglet>
                            {OUTILS.map(({ id }) => {
                                const Composant = COMPOSANTS_OUTILS[id];
                                return (
                                    <PanneauOnglet key={id} prefixe="outil" id={id} actif={outil}>
                                        <Composant />
                                    </PanneauOnglet>
                                );
                            })}
                        </>
                    ))}
                </div>
            </main>
        </>
    );
}
