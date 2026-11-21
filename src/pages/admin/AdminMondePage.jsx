import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import Stat from "@/components/ui/Stat";
import CourbeEvolution from "@/components/monde/CourbeEvolution";
import GenerationCarte from "@/components/monde/GenerationCarte";
import { getMondeResume, getDimensions, deleteMondeReleve, resoudreMondePseudos } from "@/services/api";
import { MAPS_BASE_URL } from "@/config/maps";
import { alerteErreur } from "@/utils/alerteErreur";


// Lieux mesurés : libellé et icône par type
const LIEUX = {
    civilisation: { label: "Civilisation", pluriel: "Civilisations", icon: "fa-solid fa-flag" },
    ville: { label: "Ville", pluriel: "Villes", icon: "fa-solid fa-city" },
    quartier: { label: "Quartier", pluriel: "Quartiers", icon: "fa-solid fa-house-chimney" },
};

// Modes de jeu relevés dans le fichier du joueur (la survie, attendue, n'est pas signalée)
const MODES_JEU = { creatif: "créatif", aventure: "aventure", spectateur: "spectateur" };

const nombre = (valeur, decimales = 0) =>
    valeur === null || valeur === undefined ? "—" : Number(valeur).toLocaleString("fr-FR", { maximumFractionDigits: decimales });

const heures = (valeur) => (valeur === null || valeur === undefined ? "—" : `${nombre(valeur)} h`);

// 1 bloc = 1 m² : la superficie est donnée en hectares
const hectares = (blocs) => (blocs ? `${nombre(blocs / 10000, 1)} ha` : "—");

const date = (valeur) => (valeur ? new Date(valeur).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

const normaliser = (texte) => (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Mesures suivies dans la courbe d'évolution
const COURBES = [
    { cle: "population", label: "Population", format: (valeur) => nombre(valeur) },
    { cle: "heures_presence", label: "Présence", format: heures, unite: " h" },
    { cle: "joueurs_actifs", label: "Joueurs actifs", format: (valeur) => nombre(valeur) },
    { cle: "heures_jeu", label: "Temps de jeu", format: heures, unite: " h" },
    { cle: "lits", label: "Lits", format: (valeur) => nombre(valeur) },
    { cle: "villageois", label: "Villageois", format: (valeur) => nombre(valeur) },
];

function Evolution({ valeur, suffixe = "" }) {
    if (!valeur) return null;
    const positif = valeur > 0;
    return (
        <span className={`text-xs font-semibold ${positif ? "text-success" : "text-error"}`}>
            {positif ? "+" : ""}{nombre(valeur, 1)}{suffixe}
        </span>
    );
}

// Tri d'un tableau par colonne : un clic trie, un second inverse l'ordre
function useTri(lignes, cleInitiale, descendantInitial = true) {
    const [tri, setTri] = useState({ cle: cleInitiale, descendant: descendantInitial });
    const triees = useMemo(() => {
        const copie = [...lignes];
        copie.sort((a, b) => {
            const va = typeof tri.cle === "function" ? tri.cle(a) : a[tri.cle];
            const vb = typeof tri.cle === "function" ? tri.cle(b) : b[tri.cle];
            if (va === vb) return 0;
            if (va === null || va === undefined) return 1;
            if (vb === null || vb === undefined) return -1;
            const ordre = typeof va === "string" ? va.localeCompare(vb, "fr") : va - vb;
            return tri.descendant ? -ordre : ordre;
        });
        return copie;
    }, [lignes, tri]);
    const trier = (cle, descendant = true) =>
        setTri((actuel) => (actuel.cle === cle ? { cle, descendant: !actuel.descendant } : { cle, descendant }));
    return [triees, tri, trier];
}

function EnTete({ label, cle, tri, trier, droite = true, title, texte = false }) {
    const actif = tri.cle === cle;
    return (
        <th className={droite ? "text-right" : ""} title={title} aria-sort={actif ? (tri.descendant ? "descending" : "ascending") : "none"}>
            <button type="button" className={`inline-flex items-center gap-1 hover:text-primary ${actif ? "text-primary" : ""}`} onClick={() => trier(cle, !texte)}>
                {label}
                <FontAwesomeIcon icon={actif ? (tri.descendant ? "fa-solid fa-sort-down" : "fa-solid fa-sort-up") : "fa-solid fa-sort"} className={actif ? "" : "opacity-30"} />
            </button>
        </th>
    );
}

function Recherche({ valeur, onChange, placeholder }) {
    return (
        <label className="input input-sm input-bordered rounded-2xl flex items-center gap-2 w-full sm:w-64">
            <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="opacity-50" />
            <input type="search" className="grow" placeholder={placeholder} value={valeur} onChange={(event) => onChange(event.target.value)} />
        </label>
    );
}

function AccessMessage({ text, link, label }) {
    return (
        <>
            <Navbar active="admin-monde" />
            <div className="text-center py-12 px-4">
                <p className="text-xl">{text}</p>
                <Link to={link} className="btn btn-primary mt-4">{label}</Link>
            </div>
        </>
    );
}

function lienFiche(lieu) {
    if (lieu.supprime) return null;
    if (lieu.entity_type === "civilisation") return `/civilisation/${lieu.entity_id}`;
    if (lieu.entity_type === "quartier") return `/quartier/${lieu.entity_id}`;
    if (lieu.entity_type === "ville" && lieu.civilisation_id) return `/civilisation/${lieu.civilisation_id}/ville/${lieu.entity_id}`;
    return null;
}

// ---------------------------------------------------------------------------
// Sections

function Alertes({ releve, lieux, zones, sansPseudo }) {
    const auRayon = lieux.filter((lieu) => lieu.methode === "rayon");
    const zonesOrphelines = zones.filter((zone) => zone.lieu_distance > 0);
    const alertes = [];
    if (auRayon.length) {
        alertes.push({
            icon: "fa-solid fa-draw-polygon",
            texte: `${nombre(auRayon.length)} lieu(x) sans frontières tracées, mesuré(s) dans un rayon : ${auRayon.slice(0, 5).map((lieu) => lieu.titre_actuel || lieu.title).join(", ")}${auRayon.length > 5 ? "…" : ""}`,
        });
    }
    if (zonesOrphelines.length) {
        alertes.push({
            icon: "fa-solid fa-location-crosshairs",
            texte: `${nombre(zonesOrphelines.length)} zone(s) parmi les plus visitées hors de tout lieu déclaré : peut-être des lieux de vie à ajouter sur le site.`,
        });
    }
    if (sansPseudo.length) {
        alertes.push({ icon: "fa-solid fa-address-card", texte: `${nombre(sansPseudo.length)} joueur(s) sans pseudo connu.` });
    }
    if (releve.chunks_illisibles) {
        alertes.push({ icon: "fa-solid fa-file-circle-exclamation", texte: `${nombre(releve.chunks_illisibles)} chunk(s) illisible(s) ignoré(s) à la lecture de la sauvegarde.` });
    }
    if (releve.seuil_heures_lit) {
        alertes.push({
            icon: "fa-solid fa-clock-rotate-left",
            texte: `Relevé ancien : sa population ne comptait que les lits des chunks fréquentés au moins ${nombre(releve.seuil_heures_lit, 1)} h. Les relevés récents comptent tous les lits.`,
        });
    }
    if (!alertes.length) return null;
    return (
        <div role="status" className="alert alert-warning alert-soft flex flex-col items-start gap-1">
            <span className="font-semibold">Points à vérifier</span>
            <ul className="text-sm flex flex-col gap-1">
                {alertes.map((alerte) => (
                    <li key={alerte.icon} className="flex flex-row gap-2 items-start">
                        <FontAwesomeIcon icon={alerte.icon} className="mt-0.5 w-4" />
                        <span>{alerte.texte}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function SectionEvolution({ historique, releveId, onSelect }) {
    const [mesure, setMesure] = useState("population");
    const courbe = COURBES.find((entree) => entree.cle === mesure);
    const points = historique.map((entree) => ({ id: entree.id, date: entree.date, valeur: entree[mesure] }));
    return (
        <section className="flex flex-col gap-2">
            <TitleH2 text="Évolution" icon="fa-solid fa-chart-line" />
            <div className="bg-base-200 rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
                <div role="tablist" aria-label="Mesure affichée" className="tabs tabs-box tabs-sm bg-base-100 rounded-2xl w-full sm:w-fit flex-nowrap overflow-x-auto">
                    {COURBES.map((entree) => (
                        <button
                            key={entree.cle}
                            type="button"
                            role="tab"
                            aria-selected={entree.cle === mesure}
                            className={`tab rounded-xl whitespace-nowrap ${entree.cle === mesure ? "tab-active" : ""}`}
                            onClick={() => setMesure(entree.cle)}
                        >
                            {entree.label}
                        </button>
                    ))}
                </div>
                <CourbeEvolution points={points} format={courbe.format} unite={courbe.unite} libelle={courbe.label} selectionId={releveId} onSelect={onSelect} />
                <p className="text-xs opacity-60">Un clic sur la courbe ouvre le relevé correspondant ; le point plein marque le relevé affiché.</p>
            </div>
        </section>
    );
}

function SectionLieux({ lieux, lienCarte }) {
    const [recherche, setRecherche] = useState("");
    const [type, setType] = useState("tous");
    const filtres = useMemo(() => {
        const texte = normaliser(recherche);
        return lieux.filter((lieu) =>
            (type === "tous" || lieu.entity_type === type) && (!texte || normaliser(lieu.titre_actuel || lieu.title).includes(texte)));
    }, [lieux, recherche, type]);
    const [lignes, tri, trier] = useTri(filtres, "heures_presence");
    const compte = (cle) => lieux.filter((lieu) => lieu.entity_type === cle).length;

    return (
        <section className="flex flex-col gap-2">
            <TitleH2 text="Villes et quartiers" icon="fa-solid fa-city" />
            <div className="bg-base-200 rounded-2xl p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex flex-col items-center gap-1 text-center overflow-x-auto">
                    <span className="font-mono text-sm sm:text-base whitespace-nowrap">
                        population = nombre de lits des chunks dont au moins un bloc est dans le lieu
                    </span>
                    <span className="font-mono text-xs sm:text-sm opacity-70 whitespace-nowrap">
                        aucun seuil de présence : un lit compte dès qu'il est posé
                    </span>
                </div>
                <ul className="text-sm opacity-70 flex flex-col gap-1 list-disc list-inside">
                    <li>
                        <span className="font-semibold">Lits</span> : chacun est repéré par sa tête dans la palette des blocs de la
                        sauvegarde. Un chunk qui touche le lieu, ne serait-ce que par un bloc, apporte tous ses lits : la mesure
                        déborde donc un peu des frontières, et un village généré par le jeu à l'intérieur est compté.
                    </li>
                    <li>
                        <span className="font-semibold">Frontières</span> : celles tracées sur la carte. Sans frontières (badge « rayon »),
                        le lieu est mesuré dans un rayon autour de son point, et la mesure reste approximative. Une civilisation sans
                        frontières (badge « villes ») reprend la somme de ses villes.
                    </li>
                    <li>
                        <span className="font-semibold">Présence et villageois</span> : chunks dont le centre est dans le lieu ;
                        la présence est le temps que les joueurs y ont passé (<span className="font-mono">InhabitedTime</span>).
                    </li>
                    <li>
                        Chaque relevé remplace la population des villes et des quartiers du site par cette mesure ;
                        la colonne « Avant » rappelle la valeur qu'ils affichaient auparavant, la flèche l'écart avec le relevé précédent.
                    </li>
                </ul>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-1">
                <Recherche valeur={recherche} onChange={setRecherche} placeholder="Chercher un lieu" />
                <div className="join">
                    {["tous", "civilisation", "ville", "quartier"].map((cle) => (
                        <button
                            key={cle}
                            type="button"
                            aria-pressed={type === cle}
                            className={`join-item btn btn-sm ${type === cle ? "btn-primary" : ""}`}
                            onClick={() => setType(cle)}
                        >
                            {cle === "tous" ? `Tous (${lieux.length})` : `${LIEUX[cle].pluriel} (${compte(cle)})`}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="table table-zebra table-sm">
                    <thead>
                        <tr>
                            <EnTete label="Lieu" cle={(lieu) => lieu.titre_actuel || lieu.title} tri={tri} trier={trier} droite={false} texte />
                            <EnTete label="Population" cle="population" tri={tri} trier={trier} />
                            <EnTete label="Avant" cle="population_declaree" tri={tri} trier={trier} title="Population affichée sur le site avant ce relevé" />
                            <EnTete label="Fréquentés" cle="lits_actifs" tri={tri} trier={trier} title="Lits situés dans un chunk où des joueurs ont passé du temps" />
                            <EnTete label="Superficie" cle="superficie" tri={tri} trier={trier} />
                            <EnTete label="Présence" cle="heures_presence" tri={tri} trier={trier} />
                            <EnTete label="Villageois" cle="villageois" tri={tri} trier={trier} />
                            <EnTete label="Résidents" cle="joueurs_residents" tri={tri} trier={trier} title="Joueurs dont le point de réapparition (lit) est dans le lieu ; entre parenthèses, les actifs" />
                            <EnTete label="Personnages" cle="personnages" tri={tri} trier={trier} title="Personnages RP domiciliés" />
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map((lieu) => {
                            const fiche = lienFiche(lieu);
                            const carte = lieu.x !== null && lieu.z !== null ? lienCarte(lieu.dimension_id, lieu.x, lieu.z) : null;
                            const ecart = lieu.population_precedente !== null && lieu.population_precedente !== undefined
                                ? (lieu.population ?? 0) - lieu.population_precedente : null;
                            return (
                                <tr key={`${lieu.entity_type}-${lieu.entity_id}`}>
                                    <td>
                                        <div className="flex flex-row items-center gap-2">
                                            <FontAwesomeIcon
                                                icon={LIEUX[lieu.entity_type]?.icon || "fa-solid fa-location-dot"}
                                                title={LIEUX[lieu.entity_type]?.label || lieu.entity_type}
                                                className="opacity-70"
                                            />
                                            {fiche ? (
                                                <Link to={fiche} className="font-semibold link link-hover">{lieu.titre_actuel || lieu.title}</Link>
                                            ) : (
                                                <span className="font-semibold">{lieu.titre_actuel || lieu.title}</span>
                                            )}
                                            {carte ? (
                                                <a href={carte} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100" title="Voir sur la carte" aria-label={`Voir ${lieu.titre_actuel || lieu.title} sur la carte`}>
                                                    <FontAwesomeIcon icon="fa-solid fa-map-location-dot" />
                                                </a>
                                            ) : null}
                                            {lieu.supprime ? <span className="badge badge-sm badge-ghost">supprimé</span> : null}
                                            {lieu.methode === "rayon" ? (
                                                <span className="badge badge-sm badge-warning tooltip" data-tip={`Aucune frontière tracée : mesure dans un rayon de ${lieu.rayon} blocs`}>
                                                    rayon
                                                </span>
                                            ) : null}
                                            {lieu.methode === "villes" ? (
                                                <span className="badge badge-sm badge-ghost tooltip" data-tip="Somme des mesures de ses villes">villes</span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="text-right tabular-nums whitespace-nowrap">
                                        <span className="font-bold">{nombre(lieu.population)}</span>
                                        {ecart ? <span className="ml-1"><Evolution valeur={ecart} /></span> : null}
                                    </td>
                                    <td className="text-right tabular-nums opacity-70">{nombre(lieu.population_declaree)}</td>
                                    <td className="text-right tabular-nums">{nombre(lieu.lits_actifs)}</td>
                                    <td className="text-right tabular-nums whitespace-nowrap">{hectares(lieu.superficie)}</td>
                                    <td className="text-right tabular-nums">{heures(lieu.heures_presence)}</td>
                                    <td className="text-right tabular-nums">{nombre(lieu.villageois)}</td>
                                    <td className="text-right tabular-nums whitespace-nowrap">
                                        {nombre(lieu.joueurs_residents)}
                                        {lieu.joueurs_residents_actifs !== null && lieu.joueurs_residents_actifs !== undefined && lieu.joueurs_residents
                                            ? <span className="opacity-60"> ({nombre(lieu.joueurs_residents_actifs)})</span> : null}
                                    </td>
                                    <td className="text-right tabular-nums">{nombre(lieu.personnages)}</td>
                                </tr>
                            );
                        })}
                        {!lignes.length ? (
                            <tr><td colSpan={9} className="text-center opacity-60">Aucun lieu ne correspond.</td></tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function SectionZones({ releve, zones, lienCarte }) {
    return (
        <section className="flex flex-col gap-2">
            <TitleH2 text="Zones les plus visitées" icon="fa-solid fa-fire" />
            <p className="text-sm opacity-70 px-1">
                Carrés de {nombre(releve.taille_tuile)} blocs, classés par temps passé sur place. Une zone très fréquentée
                loin de toute ville signale un lieu de vie qui n'est pas encore déclaré sur le site.
            </p>
            <div className="overflow-x-auto">
                <table className="table table-zebra table-sm">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Coordonnées</th>
                            <th className="text-right">Présence</th>
                            <th className="text-right">Lits</th>
                            <th className="text-right">Villageois</th>
                            <th className="text-right">Joueurs</th>
                            <th>Lieu le plus proche</th>
                        </tr>
                    </thead>
                    <tbody>
                        {zones.map((zone) => {
                            const lien = lienCarte(zone.dimension_id, zone.x + zone.taille / 2, zone.z + zone.taille / 2);
                            return (
                                <tr key={zone.id}>
                                    <td className="opacity-70">{zone.rang}</td>
                                    <td className="font-mono">
                                        {lien ? (
                                            <a href={lien} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                                {zone.x}, {zone.z}
                                                <FontAwesomeIcon icon="fa-solid fa-arrow-up-right-from-square" className="ml-1 text-xs" />
                                            </a>
                                        ) : (
                                            <span>{zone.x}, {zone.z}</span>
                                        )}
                                    </td>
                                    <td className="text-right tabular-nums font-semibold">{heures(zone.heures_presence)}</td>
                                    <td className="text-right tabular-nums">{nombre(zone.lits)}</td>
                                    <td className="text-right tabular-nums">{nombre(zone.villageois)}</td>
                                    <td className="text-right tabular-nums">{nombre(zone.joueurs)}</td>
                                    <td>
                                        {zone.lieu_title ? (
                                            <span className="flex flex-row items-center gap-2">
                                                <span>{zone.lieu_title}</span>
                                                <span className={`badge badge-sm ${zone.lieu_distance ? "badge-ghost" : "badge-success"}`}>
                                                    {zone.lieu_distance ? `${nombre(zone.lieu_distance)} blocs` : "sur place"}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="opacity-50">aucun</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function SectionJoueurs({ releve, joueurs, lienCarteDimension, onPseudos, pseudosEnCours }) {
    const [recherche, setRecherche] = useState("");
    const [actifsSeulement, setActifsSeulement] = useState(false);
    const actifs = joueurs.filter((joueur) => joueur.is_actif);
    const sansPseudo = joueurs.filter((joueur) => !joueur.pseudo);
    const filtres = useMemo(() => {
        const texte = normaliser(recherche);
        return joueurs.filter((joueur) => (!actifsSeulement || joueur.is_actif) && (!texte
            || normaliser(joueur.pseudo).includes(texte)
            || normaliser(joueur.uuid).includes(texte)
            || normaliser(joueur.utilisateur?.full_name || joueur.utilisateur?.username).includes(texte)
            || normaliser(joueur.lieu_title).includes(texte)));
    }, [joueurs, recherche, actifsSeulement]);
    const [lignes, tri, trier] = useTri(filtres, "heures_jeu");

    return (
        <section className="flex flex-col gap-2">
            <TitleH2 text="Joueurs" icon="fa-solid fa-users" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-1">
                <p className="text-sm opacity-70 flex-1">
                    Actif : au moins {nombre(releve.seuil_heures_actif)} h de jeu et une connexion dans les
                    {` ${nombre(releve.seuil_jours_actif)}`} derniers jours. {nombre(actifs.length)} joueur(s) actif(s)
                    sur {nombre(joueurs.length)}. La sauvegarde ne contient que des UUID : les pseudos viennent des
                    comptes Minecraft liés au site, du serveur, puis de playerdb.co.
                </p>
                {sansPseudo.length ? (
                    <button type="button" className="btn btn-sm rounded-2xl gap-2" onClick={onPseudos} disabled={pseudosEnCours}>
                        {pseudosEnCours ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon="fa-solid fa-address-card" />}
                        <span>Retrouver {nombre(sansPseudo.length)} pseudo(s)</span>
                    </button>
                ) : null}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-1">
                <Recherche valeur={recherche} onChange={setRecherche} placeholder="Pseudo, compte, résidence" />
                <label className="label cursor-pointer gap-2 text-sm">
                    <input type="checkbox" className="toggle toggle-sm toggle-primary" checked={actifsSeulement} onChange={(event) => setActifsSeulement(event.target.checked)} />
                    Actifs seulement
                </label>
            </div>
            <div className="overflow-x-auto">
                <table className="table table-zebra table-sm">
                    <thead>
                        <tr>
                            <EnTete label="Joueur" cle={(joueur) => joueur.pseudo || joueur.uuid} tri={tri} trier={trier} droite={false} texte />
                            <th>Compte du site</th>
                            <EnTete label="Temps de jeu" cle="heures_jeu" tri={tri} trier={trier} />
                            <EnTete label="Dernière connexion" cle={(joueur) => joueur.derniere_activite || ""} tri={tri} trier={trier} droite={false} />
                            <EnTete label="Résidence" cle={(joueur) => joueur.lieu_title || null} tri={tri} trier={trier} droite={false} texte />
                            <EnTete label="Sessions" cle="sessions" tri={tri} trier={trier} />
                            <EnTete label="Niveau" cle="niveau" tri={tri} trier={trier} />
                            <EnTete label="Morts" cle="morts" tri={tri} trier={trier} />
                            <EnTete label="Monstres" cle="monstres_tues" tri={tri} trier={trier} title="Monstres tués" />
                            <EnTete label="Blocs minés" cle="blocs_mines" tri={tri} trier={trier} />
                            <EnTete label="Échanges" cle="echanges_villageois" tri={tri} trier={trier} title="Échanges avec des villageois" />
                            <EnTete label="Distance" cle="distance_km" tri={tri} trier={trier} />
                        </tr>
                    </thead>
                    <tbody>
                        {lignes.map((joueur) => {
                            const lit = joueur.lit_x !== null && joueur.lit_x !== undefined
                                ? lienCarteDimension(joueur.lit_dimension, joueur.lit_x, joueur.lit_z) : null;
                            return (
                                <tr key={joueur.uuid}>
                                    <td>
                                        <div className="flex flex-row items-center gap-2">
                                            {joueur.avatar_url ? (
                                                <img src={joueur.avatar_url} alt="" width="24" height="24" className="rounded" loading="lazy" />
                                            ) : null}
                                            <span className={`font-semibold ${joueur.pseudo ? "" : "font-mono text-sm opacity-70"}`} title={joueur.uuid}>
                                                {joueur.pseudo || joueur.uuid.slice(0, 8)}
                                            </span>
                                            {joueur.is_actif ? <span className="badge badge-sm badge-success">actif</span> : null}
                                            {MODES_JEU[joueur.mode_jeu] ? <span className="badge badge-sm badge-ghost">{MODES_JEU[joueur.mode_jeu]}</span> : null}
                                        </div>
                                    </td>
                                    <td>
                                        {joueur.utilisateur ? (
                                            <a href={`/profil/${joueur.utilisateur.id}`} className="link link-primary">
                                                {joueur.utilisateur.full_name || joueur.utilisateur.username}
                                            </a>
                                        ) : (
                                            <span className="opacity-50">non lié</span>
                                        )}
                                    </td>
                                    <td className="text-right tabular-nums font-semibold">{heures(joueur.heures_jeu)}</td>
                                    <td className="whitespace-nowrap">{date(joueur.derniere_activite)}</td>
                                    <td>
                                        <span className="flex flex-row items-center gap-2">
                                            {joueur.lieu_title ? <span>{joueur.lieu_title}</span> : <span className="opacity-50">hors des lieux déclarés</span>}
                                            {lit ? (
                                                <a href={lit} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100" title={`Lit en ${joueur.lit_x}, ${joueur.lit_z}`} aria-label="Voir le lit sur la carte">
                                                    <FontAwesomeIcon icon="fa-solid fa-bed" />
                                                </a>
                                            ) : null}
                                        </span>
                                    </td>
                                    <td className="text-right tabular-nums">{nombre(joueur.sessions)}</td>
                                    <td className="text-right tabular-nums">{nombre(joueur.niveau)}</td>
                                    <td className="text-right tabular-nums">{nombre(joueur.morts)}</td>
                                    <td className="text-right tabular-nums">{nombre(joueur.monstres_tues)}</td>
                                    <td className="text-right tabular-nums">{nombre(joueur.blocs_mines)}</td>
                                    <td className="text-right tabular-nums">{nombre(joueur.echanges_villageois)}</td>
                                    <td className="text-right tabular-nums whitespace-nowrap">{nombre(joueur.distance_km)} km</td>
                                </tr>
                            );
                        })}
                        {!lignes.length ? (
                            <tr><td colSpan={12} className="text-center opacity-60">Aucun joueur ne correspond.</td></tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function SectionDimensions({ mesures }) {
    return (
        <section className="flex flex-col gap-2">
            <TitleH2 text="Dimensions" icon="fa-solid fa-earth-europe" />
            <div className="overflow-x-auto">
                <table className="table table-zebra table-sm">
                    <thead>
                        <tr>
                            <th>Dimension</th>
                            <th className="text-right">Chunks</th>
                            <th className="text-right">Visités</th>
                            <th className="text-right">Présence</th>
                            <th className="text-right">Lits</th>
                            <th className="text-right">Villageois</th>
                            <th className="text-right">Entités</th>
                            <th className="text-right">Régions</th>
                            <th className="text-right">Taille</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mesures.map((mesure) => (
                            <tr key={mesure.id}>
                                <td className="font-semibold">
                                    {mesure.title || "Overworld"}
                                    {mesure.chunks_illisibles ? (
                                        <span className="badge badge-sm badge-warning ml-2">{nombre(mesure.chunks_illisibles)} illisible(s)</span>
                                    ) : null}
                                </td>
                                <td className="text-right tabular-nums">{nombre(mesure.chunks)}</td>
                                <td className="text-right tabular-nums">{nombre(mesure.chunks_actifs)}</td>
                                <td className="text-right tabular-nums">{heures(mesure.heures_presence)}</td>
                                <td className="text-right tabular-nums">{nombre(mesure.lits)}</td>
                                <td className="text-right tabular-nums">{nombre(mesure.villageois)}</td>
                                <td className="text-right tabular-nums">{nombre(mesure.entites)}</td>
                                <td className="text-right tabular-nums">{nombre(mesure.regions)}</td>
                                <td className="text-right tabular-nums whitespace-nowrap">{mesure.taille_octets ? `${nombre(mesure.taille_octets / 1048576)} Mo` : "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------

export default function AdminMondePage() {
    const user = JSON.parse(localStorage.getItem("user"));
    const isAdmin = Boolean(user?.is_admin);
    const [resume, setResume] = useState(null);
    const [dimensions, setDimensions] = useState([]);
    const [releveId, setReleveId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pseudosEnCours, setPseudosEnCours] = useState(false);

    // Le chargement est signalé par le sélecteur de relevé, jamais depuis l'effet
    useEffect(() => {
        if (!isAdmin) return;
        getMondeResume(releveId)
            .then((data) => {
                setResume(data);
                setError(null);
            })
            .catch((err) => setError(err))
            .finally(() => setLoading(false));
    }, [isAdmin, releveId]);

    // Après une génération lancée depuis la page : le nouveau relevé (le plus récent) est affiché
    const rechargerDernierReleve = useCallback(() => {
        setReleveId(null);
        getMondeResume()
            .then((data) => {
                setResume(data);
                setError(null);
            })
            .catch((err) => setError(err));
    }, []);

    useEffect(() => {
        if (!isAdmin) return;
        getDimensions()
            .then((data) => setDimensions(Array.isArray(data) ? data : []))
            .catch(() => setDimensions([]));
    }, [isAdmin]);

    if (!user) {
        return <AccessMessage text="Vous devez être connecté pour accéder à cette page." link="/login" label="Se connecter" />;
    }
    if (!isAdmin) {
        return <AccessMessage text="Vous n'avez pas les droits nécessaires pour accéder à cette page." link="/" label="Retour à l'accueil" />;
    }

    const lienCarte = (dimensionId, x, z) => {
        const dimension = dimensions.find((dim) => dim.id === dimensionId);
        return dimension?.link ? `${MAPS_BASE_URL}/${dimension.link}-civilisations#x=${x}&z=${z}&zoom=0` : null;
    };

    // Position d'un joueur : sa dimension de jeu (minecraft:overworld…) retrouvée par le dossier mesuré
    const lienCarteDimension = (dimensionJeu, x, z) => {
        const dossiers = { "minecraft:overworld": [""], "minecraft:the_nether": ["DIM-1"], "minecraft:the_end": ["DIM1"] };
        const nom = dimensionJeu || "minecraft:overworld";
        const attendus = dossiers[nom] || [`dimensions/${nom.replace(":", "/")}`];
        const mesure = (resume?.dimensions || []).find((dim) =>
            attendus.includes(dim.source) || dim.source === `dimensions/${nom.replace(":", "/")}`);
        return mesure ? lienCarte(mesure.dimension_id, x, z) : null;
    };

    const changerReleve = (id) => {
        if (id === resume?.releve?.id) return;
        setLoading(true);
        setReleveId(id);
    };

    const supprimer = async (releve) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Supprimer ce relevé ?",
            text: `Le relevé du ${date(releve.releve_at || releve.created_at)} et son détail seront supprimés.`,
            showCancelButton: true,
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        });
        if (!confirm.isConfirmed) return;
        try {
            await deleteMondeReleve(releve.id);
            setReleveId(null);
            setResume(null);
            setLoading(true);
            const data = await getMondeResume();
            setResume(data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
            alerteErreur("Suppression du relevé impossible", err);
        }
    };

    // Les UUID de la sauvegarde sont convertis en pseudos par playerdb.co, à la demande
    const chercherPseudos = async () => {
        setPseudosEnCours(true);
        try {
            const resultat = await resoudreMondePseudos(resume?.releve?.id);
            const data = await getMondeResume(releveId);
            setResume(data);
            Swal.fire({
                icon: resultat.trouves ? "success" : "info",
                title: "Pseudos Minecraft",
                text: resultat.trouves
                    ? `${resultat.trouves} pseudo(s) retrouvé(s) sur ${resultat.cherches}.`
                    : "Aucun pseudo supplémentaire trouvé sur playerdb.co.",
            });
        } catch (err) {
            alerteErreur("Recherche des pseudos impossible", err);
        } finally {
            setPseudosEnCours(false);
        }
    };

    let content;
    if (loading) {
        content = (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    } else if (error || !resume) {
        const aucun = error?.message?.includes("relevé");
        content = (
            <div className={`alert ${aucun ? "alert-info" : "alert-error"}`}>
                <span>
                    {aucun
                        ? "Aucun relevé enregistré. Lancez la génération de la carte ci-dessus : le monde est lu puis envoyé ici."
                        : "Impossible de récupérer les statistiques du monde."}
                </span>
            </div>
        );
    } else {
        const { releve, evolution, dimensions: mesures, lieux, zones, joueurs, releves } = resume;
        const historique = resume.historique || [];
        const sansPseudo = joueurs.filter((joueur) => !joueur.pseudo);
        // Population : relevés antérieurs au total enregistré, recalculée à partir des villes
        const population = releve.population ?? lieux.filter((lieu) => lieu.entity_type === "ville").reduce((somme, lieu) => somme + (lieu.population || 0), 0);
        content = (
            <div className="flex flex-col gap-6">
                {/* Relevé affiché */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-base-200 rounded-2xl p-3 sm:p-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="font-bold text-lg">
                            {releve.world_name || "Monde"}
                            {releve.world_version ? <span className="badge badge-sm badge-neutral ml-2">{releve.world_version}</span> : null}
                        </span>
                        <span className="text-sm opacity-70">
                            Sauvegarde du {date(releve.releve_at)}, lue en {nombre(releve.duration_seconds, 1)} s
                            {releve.taille_octets ? ` (${nombre(releve.taille_octets / 1073741824, 1)} Go de régions)` : ""}
                        </span>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        <select
                            className="select select-bordered select-sm"
                            aria-label="Relevé affiché"
                            value={releve.id}
                            onChange={(event) => changerReleve(Number(event.target.value))}
                        >
                            {releves.map((entree) => (
                                <option key={entree.id} value={entree.id}>{date(entree.releve_at || entree.created_at)}</option>
                            ))}
                        </select>
                        <button type="button" className="btn btn-sm btn-ghost btn-circle text-error tooltip tooltip-left" data-tip="Supprimer ce relevé" aria-label="Supprimer ce relevé" onClick={() => supprimer(releve)}>
                            <FontAwesomeIcon icon="fa-solid fa-trash" />
                        </button>
                    </div>
                </div>

                <Alertes releve={releve} lieux={lieux} zones={zones} sansPseudo={sansPseudo} />

                {/* Chiffres clés */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <Stat icon="fa-solid fa-people-roof" label="Population des villes" value={nombre(population)} />
                    <Stat icon="fa-solid fa-hourglass-half" label="Présence des joueurs" value={heures(releve.heures_presence)} />
                    <Stat icon="fa-solid fa-gamepad" label="Temps de jeu cumulé" value={heures(releve.heures_jeu)} />
                    <Stat icon="fa-solid fa-users" label={`Joueurs (${nombre(releve.joueurs_actifs)} actifs)`} value={nombre(releve.joueurs)} />
                    <Stat icon="fa-solid fa-bed" label={`Lits (${nombre(releve.lits_actifs)} fréquentés)`} value={nombre(releve.lits)} />
                    <Stat icon="fa-solid fa-user-group" label="Villageois" value={nombre(releve.villageois)} />
                    <Stat icon="fa-solid fa-cubes" label={`Chunks (${nombre(releve.chunks_actifs)} visités)`} value={nombre(releve.chunks)} />
                    <Stat icon="fa-solid fa-paw" label="Entités" value={nombre(releve.entites)} />
                </div>
                {resume.precedent ? (
                    <p className="text-sm opacity-70 px-1 flex flex-row flex-wrap gap-3">
                        <span>Depuis le relevé du {date(resume.precedent.releve_at || resume.precedent.created_at)} :</span>
                        <span>population <Evolution valeur={evolution.population} /></span>
                        <span>présence <Evolution valeur={evolution.heures_presence} suffixe=" h" /></span>
                        <span>joueurs actifs <Evolution valeur={evolution.joueurs_actifs} /></span>
                        <span>lits <Evolution valeur={evolution.lits} /></span>
                        <span>chunks <Evolution valeur={evolution.chunks} /></span>
                    </p>
                ) : null}

                {historique.length > 1 ? (
                    <SectionEvolution historique={historique} releveId={releve.id} onSelect={changerReleve} />
                ) : null}

                <SectionLieux lieux={lieux} lienCarte={lienCarte} />
                <SectionZones releve={releve} zones={zones} lienCarte={lienCarte} />
                <SectionJoueurs releve={releve} joueurs={joueurs} lienCarteDimension={lienCarteDimension} onPseudos={chercherPseudos} pseudosEnCours={pseudosEnCours} />
                <SectionDimensions mesures={mesures} />
            </div>
        );
    }

    return (
        <>
            <Navbar active="admin-monde" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-4 w-full">
                    <TitleH1 text="Statistiques du monde" icon="fas fa-chart-simple" />
                    <p className="text-sm opacity-70 px-1">
                        Relevés dans la sauvegarde du serveur à chaque génération des cartes : population des villes,
                        temps passé par les joueurs, zones les plus vécues et activité de chaque joueur.
                    </p>
                    <GenerationCarte onTermine={rechargerDernierReleve} />
                    {content}
                </div>
            </main>
        </>
    );
}
