import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import TitleH2 from "@/components/ui/TitleH2";
import ConvertisseurNether from "@/components/aides/ConvertisseurNether";
import ConvertisseurTetras from "@/components/aides/ConvertisseurTetras";
import DistanceVilles from "@/components/aides/DistanceVilles";
import FicheDiscord from "@/components/aides/FicheDiscord";
import { COMMANDES, GUIDES } from "@/config/aides";

// ===== Aides et utilitaires =====
// Guides pas à pas, rappel des commandes du serveur et petits outils du quotidien, pour ne plus fouiller le Discord.
// Contenu : config/aides.js ; outils : components/aides/.

const SOMMAIRE = [
    { id: "guides", icon: "fa-solid fa-signs-post", text: "Guides" },
    { id: "commandes", icon: "fa-solid fa-terminal", text: "Commandes" },
    { id: "outils", icon: "fa-solid fa-toolbox", text: "Outils" },
];

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
    return (
        <>
            <Navbar active="aides" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-6">
                    <GrimoireHero
                        icon="fa-solid fa-life-ring"
                        title="Aides et utilitaires"
                        description="Les guides pour bien démarrer, les commandes à garder sous la main et les petits outils du quotidien : coordonnées du Nether, trajets, monnaie et fiche de personnage."
                    />

                    <nav aria-label="Sections des aides" className="flex flex-wrap gap-2 -mt-4">
                        {SOMMAIRE.map((entree) => (
                            <a key={entree.id} href={`#${entree.id}`} className="btn btn-sm rounded-full bg-base-200 gap-2">
                                <FontAwesomeIcon icon={entree.icon} />
                                {entree.text}
                            </a>
                        ))}
                    </nav>

                    <section id="guides" aria-label="Guides" className="flex flex-col gap-3 scroll-mt-24">
                        <TitleH2 text="Guides" icon="fa-solid fa-signs-post" />
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {GUIDES.map((guide) => <Guide key={guide.id} guide={guide} />)}
                        </div>
                        <p className="text-sm opacity-70 px-1">
                            Un terme vous échappe ? Le <a href="/codex#glossaire" className="link link-hover font-semibold">glossaire du Codex</a> les explique tous.
                        </p>
                    </section>

                    <section id="commandes" aria-label="Commandes du serveur" className="flex flex-col gap-3 scroll-mt-24">
                        <TitleH2 text="Commandes du serveur" icon="fa-solid fa-terminal" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {COMMANDES.map((groupe) => <GroupeCommandes key={groupe.id} groupe={groupe} />)}
                        </div>
                    </section>

                    <section id="outils" aria-label="Outils" className="flex flex-col gap-3 scroll-mt-24">
                        <TitleH2 text="Outils" icon="fa-solid fa-toolbox" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ConvertisseurNether />
                            <ConvertisseurTetras />
                            <div className="lg:col-span-2"><DistanceVilles /></div>
                            <div className="lg:col-span-2"><FicheDiscord /></div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
