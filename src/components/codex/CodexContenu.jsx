import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import GrimoireHero from "@/components/layout/GrimoireHero";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import EtatVide from "@/components/ui/EtatVide";
import Glossaire from "@/components/aide/Glossaire";
import MonnaieOfficielle from "@/components/monnaie/MonnaieOfficielle";
import { LIVRES } from "@/config/codex";
import { DISCORD_INVITE } from "@/utils/parcours";

// ===== Corps du Codex =====
// Partagé par le Codex de saison et celui de lancement (seule la barre de navigation change : `apresHero`).
// Navigation : sommaire latéral fixe sur grand écran qui suit la lecture, bouton « Sommaire » flottant sur téléphone,
// recherche dans les articles (sans accents) et filtre « Zéro tolérance », référence et lien de chaque article.

const ROMAINS = ["I", "II", "III", "IV", "V"];

const ANNEXES = [
    { id: "monnaie", titre: "Monnaie officielle", icon: "fa-solid fa-gem" },
    { id: "glossaire", titre: "Glossaire", icon: "fa-solid fa-book-open" },
    { id: "serment", titre: "Le Serment", icon: "fa-solid fa-feather-pointed" },
];

const normaliser = (texte) => (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Livres numérotés : chapitre « II.5 », article « II.5.3 » et son ancre « guerres-3 »
const CODEX = LIVRES.map((livre, l) => ({
    ...livre,
    romain: ROMAINS[l],
    chapitres: livre.chapitres.map((chapitre, c) => ({
        ...chapitre,
        ref: `${ROMAINS[l]}.${c + 1}`,
        articles: chapitre.articles.map((article, a) => ({
            ...article,
            numero: a + 1,
            ref: `${ROMAINS[l]}.${c + 1}.${a + 1}`,
            ancre: `${chapitre.id}-${a + 1}`,
            cle: normaliser(`${article.titre} ${article.texte} ${chapitre.titre}`),
        })),
    })),
}));

const SECTIONS = [...CODEX.flatMap((livre) => livre.chapitres.map((chapitre) => chapitre.id)), ...ANNEXES.map((annexe) => annexe.id)];

// Met en valeur les mots cherchés (comparaison sans accents ni majuscules, sur la même longueur de texte)
function Surligne({ texte, mots }) {
    if (!mots.length) return texte;
    const plat = normaliser(texte);
    const zones = [];
    for (const mot of mots) {
        let index = plat.indexOf(mot);
        while (index !== -1) {
            zones.push([index, index + mot.length]);
            index = plat.indexOf(mot, index + mot.length);
        }
    }
    if (!zones.length || plat.length !== texte.length) return texte;
    zones.sort((a, b) => a[0] - b[0]);
    const morceaux = [];
    let curseur = 0;
    for (const [debut, fin] of zones) {
        if (debut < curseur) continue;
        morceaux.push(texte.slice(curseur, debut), <mark key={debut} className="bg-primary/30 text-inherit rounded px-0.5">{texte.slice(debut, fin)}</mark>);
        curseur = fin;
    }
    morceaux.push(texte.slice(curseur));
    return morceaux;
}

function Sommaire({ livres, actif, filtre, onAller }) {
    const lien = (id, contenu, compte = null) => (
        <li key={id}>
            <a
                href={`#${id}`}
                onClick={(event) => onAller(event, id)}
                aria-current={actif === id ? "location" : undefined}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm ${actif === id ? "bg-secondary text-secondary-content font-semibold" : "hover:bg-base-300"} ${compte === 0 ? "opacity-40" : ""}`}
            >
                {contenu}
                {compte !== null && <span className="badge badge-sm badge-ghost ml-auto">{compte}</span>}
            </a>
        </li>
    );
    return (
        <nav aria-label="Sommaire du Codex" className="flex flex-col gap-3">
            {livres.map((livre) => (
                <div key={livre.id}>
                    <p className="text-xs uppercase tracking-wide opacity-60 px-3 mb-1">{livre.numero} · {livre.titre}</p>
                    <ul className="flex flex-col gap-0.5">
                        {livre.chapitres.map((chapitre) => lien(chapitre.id, (
                            <>
                                <span className="tabular-nums opacity-60 w-8 shrink-0">{chapitre.ref}</span>
                                <span className="truncate">{chapitre.titre}</span>
                            </>
                        ), filtre ? chapitre.articles.length : null))}
                    </ul>
                </div>
            ))}
            {!filtre && (
                <div>
                    <p className="text-xs uppercase tracking-wide opacity-60 px-3 mb-1">Annexes</p>
                    <ul className="flex flex-col gap-0.5">
                        {ANNEXES.map((annexe) => lien(annexe.id, (
                            <>
                                <FontAwesomeIcon icon={annexe.icon} className="w-8 shrink-0 opacity-60" />
                                <span className="truncate">{annexe.titre}</span>
                            </>
                        )))}
                    </ul>
                </div>
            )}
        </nav>
    );
}

export default function CodexContenu({ apresHero = null }) {
    const [recherche, setRecherche] = useState("");
    const [zeroTolerance, setZeroTolerance] = useState(false);
    const [actif, setActif] = useState(SECTIONS[0]);
    const [enHaut, setEnHaut] = useState(true);
    const [copie, setCopie] = useState(null);
    const panneauRef = useRef(null);

    const mots = normaliser(recherche.trim()).split(/\s+/).filter(Boolean);
    const filtre = mots.length > 0 || zeroTolerance;

    const livres = useMemo(() => CODEX.map((livre) => ({
        ...livre,
        chapitres: livre.chapitres.map((chapitre) => ({
            ...chapitre,
            articles: chapitre.articles.filter((article) => (!zeroTolerance || article.warn) && mots.every((mot) => article.cle.includes(mot))),
        })),
    })), [recherche, zeroTolerance]); // eslint-disable-line react-hooks/exhaustive-deps

    const trouves = livres.reduce((total, livre) => total + livre.chapitres.reduce((n, chapitre) => n + chapitre.articles.length, 0), 0);

    // Sommaire qui suit la lecture : la section dont le haut a passé la barre de navigation fixe
    useEffect(() => {
        const visibles = new Map();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => visibles.set(entry.target.id, entry.isIntersecting));
            const premiere = SECTIONS.find((id) => visibles.get(id));
            if (premiere) setActif(premiere);
        }, { rootMargin: "-110px 0px -55% 0px" });
        SECTIONS.forEach((id) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });
        return () => observer.disconnect();
    }, [filtre]);

    // Bouton « Haut » après un premier écran de lecture
    useEffect(() => {
        const surDefilement = () => setEnHaut(window.scrollY < 600);
        window.addEventListener("scroll", surDefilement, { passive: true });
        return () => window.removeEventListener("scroll", surDefilement);
    }, []);

    // Lien direct vers un article ou un chapitre (#guerres-3) : le contenu est rendu après le chargement de la page
    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    }, []);

    const aller = (event, id) => {
        event.preventDefault();
        panneauRef.current?.close();
        const viser = () => {
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
            window.history.replaceState(null, "", `#${id}`);
        };
        // Une section masquée par la recherche réapparaît avant qu'on s'y rende
        if (filtre && !document.getElementById(id)) {
            setRecherche("");
            setZeroTolerance(false);
            setTimeout(viser, 50);
        } else {
            viser();
        }
    };

    const copierLien = async (article) => {
        const url = `${window.location.origin}${window.location.pathname}#${article.ancre}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopie(`Lien de l'article ${article.ref} copié`);
        } catch {
            setCopie(`Copiez le lien : ${url}`);
        }
        window.history.replaceState(null, "", `#${article.ancre}`);
        setTimeout(() => setCopie(null), 2500);
    };

    const effacer = () => {
        setRecherche("");
        setZeroTolerance(false);
    };

    return (
        <>
            {/* Hero façon grimoire étoilé, cohérent avec l'accueil */}
            <GrimoireHero
                icon="fa-solid fa-scroll"
                title="Le Codex de Tetrago"
                description="Deux livres tiennent ce monde debout : la loi qui protège le serveur, et le codex qui protège l'histoire que nous écrivons ensemble. Le lire n'est pas une option — c'en est la condition."
            />
            {apresHero}

            <div className="flex gap-6 w-full items-start mt-2">
                {/* Sommaire latéral : grand écran */}
                <aside className="hidden lg:block w-72 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto bg-base-200 rounded-3xl p-3">
                    <Sommaire livres={livres} actif={actif} filtre={filtre} onAller={aller} />
                </aside>

                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Recherche dans les articles */}
                    <div role="search" className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
                        <label className="input input-ghost bg-base-200 rounded-3xl flex-1 min-w-0">
                            <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="opacity-60" />
                            <input type="search" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher une règle : grief, piège, ferme…" aria-label="Rechercher dans le Codex" />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-base-200 rounded-3xl px-4 py-2 shrink-0">
                            <input type="checkbox" checked={zeroTolerance} onChange={(event) => setZeroTolerance(event.target.checked)} className="toggle toggle-sm toggle-error" />
                            <span className="text-sm">Zéro tolérance</span>
                        </label>
                    </div>
                    {filtre && trouves > 0 && (
                        <p className="text-sm opacity-70 -mt-4 mb-6 px-1" aria-live="polite">
                            {trouves} article{trouves > 1 ? "s" : ""} trouvé{trouves > 1 ? "s" : ""}.{" "}
                            <button type="button" className="link" onClick={effacer}>Tout afficher</button>
                        </p>
                    )}

                    {/* Sommaire repliable : téléphone et tablette */}
                    {!filtre && (
                        <details className="lg:hidden bg-base-200 rounded-3xl p-3 mb-8">
                            <summary className="cursor-pointer font-semibold px-2 flex items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-list-ul" />
                                Sommaire
                            </summary>
                            <div className="mt-3"><Sommaire livres={livres} actif={actif} filtre={false} onAller={aller} /></div>
                        </details>
                    )}

                    {filtre && trouves === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-magnifying-glass"
                            texte="Aucun article ne correspond à votre recherche."
                            aide="Essayez un autre mot, ou consultez le glossaire."
                            action={{ label: "Tout afficher", icon: "fa-solid fa-xmark", onClick: effacer }}
                            className="w-full mb-16"
                        />
                    ) : livres.map((livre) => {
                        const chapitres = livre.chapitres.filter((chapitre) => chapitre.articles.length > 0);
                        if (!chapitres.length) return null;
                        return (
                            <section key={livre.id} className="mb-16">
                                <TitleH1 text={`${livre.numero} — ${livre.titre}`} icon={livre.icon} />
                                <p className="mt-3 mb-6 opacity-80 max-w-2xl">{livre.dek}</p>

                                <div className="flex flex-col gap-4">
                                    {chapitres.map((chapitre) => (
                                        <div key={chapitre.id} id={chapitre.id} className="bg-base-200 p-4 rounded-3xl shadow-md scroll-mt-24">
                                            <TitleH2 text={`${chapitre.ref} · ${chapitre.titre}`} icon={chapitre.icon} classes="" />
                                            <div className="flex flex-col gap-1 mt-3">
                                                {chapitre.articles.map((article) => (
                                                    <div key={article.ancre} id={article.ancre} className="group flex gap-3 rounded-xl p-2 scroll-mt-28 target:bg-primary/10 target:ring-1 target:ring-primary">
                                                        <a href={`#${article.ancre}`} onClick={(event) => aller(event, article.ancre)} className="opacity-50 hover:opacity-100 mt-0.5 shrink-0 tabular-nums" title={`Art. ${article.ref}`}>
                                                            {article.numero}.
                                                        </a>
                                                        <p className="flex-1 min-w-0">
                                                            <strong><Surligne texte={article.titre} mots={mots} /></strong>{" "}
                                                            {article.warn && (
                                                                <span className="badge badge-error badge-sm align-middle mx-1">Zéro tolérance</span>
                                                            )}
                                                            <Surligne texte={article.texte} mots={mots} />
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => copierLien(article)}
                                                            className="btn btn-ghost btn-xs self-start opacity-40 sm:opacity-0 group-hover:opacity-70 focus-visible:opacity-100 tooltip tooltip-left"
                                                            data-tip={`Copier le lien (Art. ${article.ref})`}
                                                            aria-label={`Copier le lien de l'article ${article.ref}`}
                                                        >
                                                            <FontAwesomeIcon icon="fa-solid fa-link" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}

                    {!filtre && (
                        <>
                            {/* Monnaie officielle : cible du lien de la page des commerces (/codex#monnaie) */}
                            <section className="mb-16">
                                <MonnaieOfficielle id="monnaie" />
                            </section>

                            {/* Glossaire : cible des « ? » de l'aide contextuelle (/codex#glossaire-<terme>) */}
                            <section className="mb-16">
                                <TitleH1 text="Glossaire" icon="fa-solid fa-book-open" />
                                <p className="mt-3 mb-6 opacity-80 max-w-2xl">Les mots du monde de Tetrago, tels que le site les emploie.</p>
                                <Glossaire />
                            </section>

                            {/* Serment de clôture */}
                            <section id="serment" className="grimoire-hero rounded-3xl py-16 px-4 text-center scroll-mt-24">
                                <div className="grimoire-stars"></div>
                                <div className="relative flex flex-col items-center gap-4 text-neutral-content">
                                    <FontAwesomeIcon icon="fa-solid fa-feather-pointed" size="2x" className="text-warning" />
                                    <h2 className="text-2xl font-bold">Le Serment</h2>
                                    <p className="max-w-xl italic opacity-90">
                                        « Je jure, en foulant les terres de Tetrago, d'honorer ce codex — de bâtir sans détruire, de jouer
                                        sans tricher, d'incarner sans imposer. Que ma parole vaille sceau. »
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                                        <a href="/civilisations" className="btn btn-secondary">
                                            <FontAwesomeIcon icon="fa-solid fa-flag" />
                                            Fonder ma civilisation
                                        </a>
                                        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="btn btn-ghost bg-base-200">
                                            <FontAwesomeIcon icon="fa-brands fa-discord" />
                                            Une question ? Le Discord
                                        </a>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>

            {/* Boutons flottants : sommaire (téléphone, tablette) et retour en haut */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
                {!enHaut && (
                    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="btn btn-circle shadow-lg" aria-label="Revenir en haut">
                        <FontAwesomeIcon icon="fa-solid fa-arrow-up" />
                    </button>
                )}
                <button type="button" onClick={() => panneauRef.current?.showModal()} className="btn btn-secondary rounded-3xl shadow-lg lg:hidden" aria-label="Ouvrir le sommaire du Codex">
                    <FontAwesomeIcon icon="fa-solid fa-list-ul" />
                    Sommaire
                </button>
            </div>
            <dialog ref={panneauRef} className="modal modal-bottom sm:modal-middle lg:hidden">
                <div className="modal-box rounded-t-3xl sm:rounded-3xl max-h-[80dvh] overflow-y-auto">
                    <h3 className="font-bold text-lg mb-3">Sommaire du Codex</h3>
                    <Sommaire livres={livres} actif={actif} filtre={filtre} onAller={aller} />
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button aria-label="Fermer le sommaire">Fermer</button>
                </form>
            </dialog>

            {copie && (
                <div role="status" className="toast toast-center toast-bottom z-50">
                    <div className="alert alert-info rounded-2xl">{copie}</div>
                </div>
            )}
        </>
    );
}
