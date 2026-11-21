import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import Onglets, { PanneauOnglet } from "@/components/ui/Onglets";
import { COMMANDES, GUIDES, OUTILS } from "@/config/aides";

// ===== Aides et utilitaires =====
// Guides pas à pas et rappel des commandes du serveur, pour ne plus fouiller le Discord. Contenu : config/aides.js.
// Un onglet par partie, repris dans l'adresse (/aides#commandes) ; une ancre intérieure (#guide-commerce) ouvre son onglet.
// Les outils ont leur propre page (/outils, pages/outils/OutilsPage.jsx) : les anciens liens (/aides#outils,
// /aides#nether…) y mènent.

const ONGLETS = [
    { id: "guides", icon: "fa-solid fa-signs-post", text: "Guides", texte: "Pas à pas, de la candidature à votre première guerre." },
    { id: "commandes", icon: "fa-solid fa-terminal", text: "Commandes", texte: "Les commandes du serveur à garder sous la main." },
];

// Anciennes ancres des outils, du temps où ils étaient un onglet de cette page : renvoyées vers /outils
const outilsDeplaces = new Set(["outils", ...OUTILS.map((outil) => outil.id)]);
const adresseOutil = (ancre) => (ancre === "outils" ? "/outils" : `/outils#${ancre}`);

// Onglet que désigne l'ancre de l'adresse, ou null si elle ne correspond à rien
function ongletDeAncre(ancre) {
    if (ONGLETS.some((onglet) => onglet.id === ancre)) return ancre;
    if (ancre.startsWith("guide-")) return "guides";
    if (ancre.startsWith("commandes-")) return "commandes";
    return null;
}

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
    const navigate = useNavigate();
    // L'ancre de l'adresse passe avant le dernier onglet ouvert
    const [actif, setActif] = useState(() => ongletDeAncre(ancreActuelle()) ?? lireOnglet() ?? ONGLETS[0].id);

    useEffect(() => retenirOnglet(actif), [actif]);

    // Lien vers un onglet ou une ancre intérieure : ouvre son onglet, puis va à l'ancre ; un ancien lien d'outil
    // mène à la page des outils
    useEffect(() => {
        const suivreAncre = () => {
            const ancre = ancreActuelle();
            if (outilsDeplaces.has(ancre)) {
                navigate(adresseOutil(ancre), { replace: true });
                return;
            }
            const onglet = ongletDeAncre(ancre);
            if (!onglet) return;
            setActif(onglet);
            if (ancre !== onglet) requestAnimationFrame(() => document.getElementById(ancre)?.scrollIntoView({ block: "start" }));
        };
        suivreAncre();
        window.addEventListener("hashchange", suivreAncre);
        return () => window.removeEventListener("hashchange", suivreAncre);
    }, [navigate]);

    // replaceState : l'adresse suit l'onglet sans faire défiler la page ni allonger l'historique
    const ouvrir = (id) => {
        setActif(id);
        window.history.replaceState(null, "", `#${id}`);
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
                        description="Les guides pour bien démarrer et les commandes à garder sous la main. Les petits outils du quotidien ont leur propre page, Outils."
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

                </div>
            </main>
        </>
    );
}
