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
import TelechargementMonde from "@/components/aides/TelechargementMonde";
import MonnaieOfficielle from "@/components/monnaie/MonnaieOfficielle";
import Onglets, { PanneauOnglet } from "@/components/ui/Onglets";
import { GROUPES_OUTILS, OUTILS } from "@/config/aides";

// ===== Outils =====
// Petits outils du quotidien, sortis de la page des aides : un accueil qui les présente (/outils), puis un onglet par
// outil, dont l'ancre est l'id (/outils#nether, /outils#candidature). Textes : config/aides.js (OUTILS) ; outils :
// components/aides/. Les onglets fermés restent montés : les saisies ne se perdent pas.

// Composant de chaque outil
const COMPOSANTS_OUTILS = {
    candidature: AideCandidature,
    nether: ConvertisseurNether,
    tetras: ConvertisseurTetras,
    distance: DistanceVilles,
    "fiche-discord": FicheDiscord,
    "cabine-photo": CabinePhoto,
    monde: TelechargementMonde,
};

// Affiché au-dessus d'un outil : la carte de la monnaie, la même que sur la page des commerces, avant le calcul des tetras
const COMPLEMENTS = {
    tetras: <MonnaieOfficielle compact usage="calcul" />,
};

const ACCUEIL = "accueil";
const ONGLETS = [
    { id: ACCUEIL, icon: "fa-solid fa-table-cells-large", text: "Tous les outils" },
    ...OUTILS.map((outil) => ({ id: outil.id, icon: outil.icon, text: outil.onglet })),
];
const outilParId = Object.fromEntries(OUTILS.map((outil) => [outil.id, outil]));

const ancreActuelle = () => decodeURIComponent(window.location.hash.slice(1));
// Outil désigné par l'ancre de l'adresse (l'accueil sans ancre, ou pour une ancre inconnue)
const outilDeAncre = (ancre) => (outilParId[ancre] ? ancre : ACCUEIL);

// Accueil : les outils rangés par usage, chacun avec ce qu'il fait ; la carte entière ouvre l'outil (#id)
function AccueilOutils() {
    return (
        <div className="flex flex-col gap-6">
            {GROUPES_OUTILS.map((groupe) => (
                <section key={groupe.id} aria-labelledby={`groupe-outils-${groupe.id}`} className="flex flex-col gap-3">
                    <h2 id={`groupe-outils-${groupe.id}`} className="flex items-center gap-2 font-bold text-lg px-1">
                        <FontAwesomeIcon icon={groupe.icon} className="text-secondary" />
                        {groupe.titre}
                    </h2>
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

export default function OutilsPage() {
    const [outil, setOutil] = useState(() => outilDeAncre(ancreActuelle()));

    // Lien vers un outil (#nether), depuis l'accueil ou une autre page : ouvre son onglet
    useEffect(() => {
        const suivreAncre = () => setOutil(outilDeAncre(ancreActuelle()));
        window.addEventListener("hashchange", suivreAncre);
        return () => window.removeEventListener("hashchange", suivreAncre);
    }, []);

    // replaceState : l'adresse suit l'onglet sans faire défiler la page ni allonger l'historique
    const ouvrir = (id) => {
        setOutil(id);
        window.history.replaceState(null, "", id === ACCUEIL ? window.location.pathname : `#${id}`);
    };

    return (
        <>
            <Navbar active="outils" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-6">
                    <GrimoireHero
                        icon="fa-solid fa-toolbox"
                        title="Outils"
                        description="De petits outils pour préparer votre arrivée, vous repérer en jeu et présenter vos personnages : candidature, coordonnées du Nether, trajets, monnaie, monde à télécharger, fiche de personnage et cabine photo."
                    />

                    <Onglets onglets={ONGLETS} actif={outil} onChange={ouvrir} label="Outils" prefixe="outil" className="-mt-4" />
                    <PanneauOnglet prefixe="outil" id={ACCUEIL} actif={outil}>
                        <AccueilOutils />
                    </PanneauOnglet>
                    {OUTILS.map(({ id }) => {
                        const Composant = COMPOSANTS_OUTILS[id];
                        return (
                            <PanneauOnglet key={id} prefixe="outil" id={id} actif={outil} className="flex flex-col gap-4">
                                {COMPLEMENTS[id] ?? null}
                                <Composant />
                            </PanneauOnglet>
                        );
                    })}
                </div>
            </main>
        </>
    );
}
