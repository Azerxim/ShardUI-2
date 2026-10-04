import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import TitleH2 from "@/components/ui/TitleH2";
import EtatVide from "@/components/ui/EtatVide";
import FormModal from "@/components/modals/FormModal";
import FoireCard from "@/components/commerces/FoireCard";

import { showModalID } from "@/utils/showModal";
import { requireLogin } from "@/utils/requireLogin";
import { isModerateur, managedEntities, runAction } from "@/utils/conflits";
import { getSessionUser } from "@/services/session";
import {
    FOIRE, JOURS_COURTS, ORGANISATEURS, TYPES_EVENEMENTS, debutDuMois, horaireEvenement, isoJour, isoMois, joursCouverts,
    moisVoisin, semainesDuMois, titreMois, typeEvenement, valeurDateHeure,
} from "@/config/calendrier";
import {
    annulerEvenement, createEvenement, desinscrireEvenement, getAlliances, getCalendrier, getCivilisations, getCommerces,
    getGuerres, getPersonnagesOfUser, getReligions, getVilles, inscrireEvenement, updateEvenement,
} from "@/services/api";

// ===== Calendrier des événements RP =====
// Batailles prévues, fêtes, couronnements… en heure réelle du serveur, avec l'inscription des participants. Chaque annonce
// est publiée sur Discord et reproduite en événement du serveur Discord (Shard-API crud_calendrier). Les foires des
// villes y figurent aussi, en lecture seule. Lien d'une annonce : /calendrier?mois=2026-10#evenement-12

const MODAL_ID = "evenement-modal";
const MAX_PUCES = 3;

const nom = (user) => user?.full_name || user?.username || "compte supprimé";

const champs = (evenement, { organisateurs, villes, guerres }) => [
    ...(evenement ? [] : [{
        name: "organisateur", label: "Au nom de", type: "select", required: true, options: organisateurs,
        help: "Vous-même, ou une civilisation, une religion, un commerce, une alliance que vous dirigez.",
    }]),
    { name: "title", label: "Nom", type: "text", required: true, placeholder: "Ex. Couronnement de la reine Ysolde" },
    { name: "type", label: "Type", type: "select", required: true, options: Object.entries(TYPES_EVENEMENTS).map(([value, { label }]) => ({ value, label })) },
    { name: "date_debut", label: "Début", type: "datetime-local", required: true, help: "Heure réelle du serveur." },
    { name: "date_fin", label: "Fin", type: "datetime-local", help: "Facultative : sur Discord, l'événement dure alors deux heures." },
    { name: "lieu", label: "Lieu", type: "text", placeholder: "Ex. Grande salle du château, plaine de Narva" },
    { name: "ville_id", label: "Ville", type: "select", placeholder: "Aucune", options: villes },
    {
        name: "guerre_id", label: "Guerre", type: "select", placeholder: "Aucune", options: guerres,
        empty: "Aucune guerre en cours dont vous menez un camp.", help: "Pour une bataille : la guerre en cours dont elle fait partie.",
    },
    { name: "places", label: "Places", type: "number", placeholder: "Sans limite", help: "Nombre maximal d'inscrits." },
    { name: "description", label: "Description", type: "textarea", placeholder: "Programme, tenue, conditions de participation…" },
];

const valeursInitiales = (evenement) => ({
    organisateur: "joueur",
    title: evenement?.title ?? "",
    type: evenement?.type ?? "",
    date_debut: valeurDateHeure(evenement?.date_debut),
    date_fin: valeurDateHeure(evenement?.date_fin),
    lieu: evenement?.lieu ?? "",
    ville_id: evenement?.ville?.id ?? "",
    guerre_id: evenement?.guerre?.id ?? "",
    places: evenement?.places != null ? String(evenement.places) : "",
    description: evenement?.description ?? "",
});

function Organisateur({ organisateur }) {
    const config = ORGANISATEURS[organisateur.type] ?? ORGANISATEURS.joueur;
    const contenu = (
        <>
            <FontAwesomeIcon icon={config.icon} className="opacity-70" />
            {organisateur.title}
        </>
    );
    return organisateur.deleted || organisateur.id == null
        ? <span className="flex items-center gap-1">{contenu}</span>
        : <a href={config.href(organisateur.id)} className="link link-hover flex items-center gap-1">{contenu}</a>;
}

function EvenementCard({ evenement, user, gerer, inscrire, desinscrire }) {
    const type = typeEvenement(evenement.type);
    const annule = evenement.status === "annule";
    const ouvert = !annule && new Date(evenement.date_debut) > new Date();
    const inscription = user ? evenement.inscrits.find((inscrit) => inscrit.user?.id === user.id) : null;
    const inscrits = evenement.inscrits.length;
    return (
        <article id={`evenement-${evenement.id}`} className={`flex flex-col gap-2 bg-base-200 rounded-2xl p-3 scroll-mt-24 target:ring-2 target:ring-primary ${annule ? "opacity-70" : ""}`}>
            <div className="flex flex-row items-start gap-3">
                <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${type.puce}`}>
                    <FontAwesomeIcon icon={type.icon} />
                </span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                        <strong className={`break-words ${annule ? "line-through" : ""}`}>{evenement.title}</strong>
                        <span className={`badge badge-sm ${type.badge}`}>{type.label}</span>
                        {annule && <span className="badge badge-sm badge-ghost">Annulé</span>}
                        {!annule && evenement.termine && <span className="badge badge-sm badge-ghost">Terminé</span>}
                        {inscription && !annule && <span className="badge badge-sm badge-success">Inscrit</span>}
                    </span>
                    <span className="text-sm first-letter:uppercase">{horaireEvenement(evenement)}</span>
                    <span className="text-sm opacity-80 flex flex-wrap items-center gap-x-3">
                        <Organisateur organisateur={evenement.organisateur} />
                        {(evenement.lieu || evenement.ville) && (
                            <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon="fa-solid fa-location-dot" className="opacity-70" />
                                {evenement.lieu}
                                {evenement.lieu && evenement.ville ? ", " : ""}
                                {evenement.ville && <a href={`/civilisation/${evenement.ville.civilisation_id}/ville/${evenement.ville.id}`} className="link link-hover">{evenement.ville.title}</a>}
                            </span>
                        )}
                        {evenement.guerre && (
                            <a href={`/guerre/${evenement.guerre.id}`} className="link link-hover flex items-center gap-1">
                                <FontAwesomeIcon icon="fa-solid fa-shield-halved" className="opacity-70" />
                                {evenement.guerre.title}
                            </a>
                        )}
                    </span>
                    {evenement.description && <p className="text-sm opacity-80 break-words whitespace-pre-line">{evenement.description}</p>}
                    {annule && evenement.motif_annulation && <p className="text-sm italic">Motif de l'annulation : {evenement.motif_annulation}</p>}
                </div>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-2 text-sm">
                <details className="flex-1 min-w-48">
                    <summary className="cursor-pointer opacity-80">
                        <FontAwesomeIcon icon="fa-solid fa-users" className="mr-1" />
                        {inscrits} inscrit{inscrits > 1 ? "s" : ""}{evenement.places != null ? ` sur ${evenement.places} places` : ""}
                        {evenement.complet && !annule ? " · complet" : ""}
                    </summary>
                    {inscrits === 0 ? (
                        <p className="opacity-70 mt-1">Personne pour l'instant.</p>
                    ) : (
                        <ul className="flex flex-wrap gap-1 mt-1">
                            {evenement.inscrits.map((inscrit, index) => (
                                <li key={inscrit.user?.id ?? `supprime-${index}`} className="badge badge-ghost bg-base-100 gap-1">
                                    {inscrit.personnage ? <a href={`/personnage/${inscrit.personnage.id}`} className="link link-hover">{inscrit.personnage.name}</a> : nom(inscrit.user)}
                                    {inscrit.personnage && <span className="opacity-60">({nom(inscrit.user)})</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </details>
                {ouvert && (inscription ? (
                    <>
                        <span className="opacity-80">{inscription.personnage ? `Sous les traits de ${inscription.personnage.name}` : "Vous y serez"}</span>
                        <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={() => inscrire(evenement)}>Changer de personnage</button>
                        <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => desinscrire(evenement)}>Se désinscrire</button>
                    </>
                ) : (
                    <button type="button" className="btn btn-xs btn-primary" disabled={evenement.complet} onClick={() => inscrire(evenement)}>
                        <FontAwesomeIcon icon="fa-solid fa-hand" />
                        {evenement.complet ? "Complet" : "S'inscrire"}
                    </button>
                ))}
                {gerer}
            </div>
        </article>
    );
}

function GrilleMois({ debut, evenements, foires }) {
    // Puces par jour : événements, puis foires
    const parJour = {};
    const ajouter = (jour, puce) => { (parJour[jour] ??= []).push(puce); };
    for (const evenement of evenements) {
        const type = typeEvenement(evenement.type);
        for (const jour of joursCouverts(evenement.date_debut, evenement.date_fin, debut)) {
            ajouter(jour, { cle: `evenement-${evenement.id}`, titre: evenement.title, icon: type.icon, puce: type.puce, annule: evenement.status === "annule" });
        }
    }
    for (const foire of foires) {
        for (const jour of joursCouverts(foire.date_debut, foire.date_fin, debut)) {
            ajouter(jour, { cle: `foire-${foire.id}`, titre: foire.title, icon: FOIRE.icon, puce: FOIRE.puce });
        }
    }
    const aujourdhui = isoJour(new Date());
    return (
        <div role="grid" aria-label={`Calendrier de ${titreMois(debut)}`} className="w-full bg-base-200 rounded-2xl p-2">
            <div role="row" className="grid grid-cols-7 gap-1 text-xs text-center opacity-70 pb-1">
                {JOURS_COURTS.map((jour) => <span key={jour} role="columnheader">{jour}</span>)}
            </div>
            {semainesDuMois(debut).map((semaine, index) => (
                <div key={index} role="row" className="grid grid-cols-7 gap-1">
                    {semaine.map((date, colonne) => {
                        if (!date) return <span key={colonne} role="gridcell" className="min-h-14 sm:min-h-20"></span>;
                        const jour = isoJour(date);
                        const puces = parJour[jour] ?? [];
                        return (
                            <div key={jour} role="gridcell" aria-label={`${date.getDate()} ${titreMois(debut)} : ${puces.length} événement${puces.length > 1 ? "s" : ""}`}
                                className={`flex flex-col gap-0.5 min-h-14 sm:min-h-20 rounded-lg p-1 bg-base-100 min-w-0 ${jour === aujourdhui ? "ring-2 ring-primary" : ""}`}>
                                <span className={`text-xs ${jour === aujourdhui ? "font-bold text-primary" : "opacity-70"}`}>{date.getDate()}</span>
                                {puces.slice(0, MAX_PUCES).map((puce) => (
                                    <a key={puce.cle} href={`#${puce.cle}`} title={puce.titre}
                                        className={`flex items-center gap-1 rounded px-1 text-[0.65rem] leading-4 min-w-0 ${puce.puce} ${puce.annule ? "line-through opacity-60" : ""}`}>
                                        <FontAwesomeIcon icon={puce.icon} className="shrink-0" />
                                        <span className="truncate hidden sm:inline">{puce.titre}</span>
                                    </a>
                                ))}
                                {puces.length > MAX_PUCES && <span className="text-[0.65rem] opacity-70">+{puces.length - MAX_PUCES}</span>}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

export default function CalendrierPage() {
    const user = getSessionUser();
    const moderateur = isModerateur(user);
    const [searchParams, setSearchParams] = useSearchParams();
    const debut = debutDuMois(searchParams.get("mois"));
    const mois = isoMois(debut);
    // Données du mois chargé : { mois, evenements, foires } ; un autre mois affiché est en cours de chargement
    const [charge, setCharge] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [edition, setEdition] = useState(null); // { evenement (null : nouveau), count }
    const [options, setOptions] = useState({ organisateurs: [{ value: "joueur", label: "Moi-même" }], villes: [], guerres: [], gerables: new Set() });
    const [personnages, setPersonnages] = useState([]);

    useEffect(() => {
        getCalendrier(isoJour(debut), isoJour(new Date(debut.getFullYear(), debut.getMonth() + 1, 0)))
            .then((data) => setCharge({ mois, ...data }))
            .catch(() => setCharge({ mois, evenements: [], foires: [] }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mois, reloadKey]);
    const donnees = charge?.mois === mois ? charge : null;

    // Au nom de qui organiser, dans quelle ville, pour quelle guerre ; sous quels traits s'inscrire
    useEffect(() => {
        getVilles()
            .then((liste) => setOptions((prev) => ({
                ...prev,
                villes: (Array.isArray(liste) ? liste : []).filter((ville) => ville.is_public !== false).map((ville) => ({ value: ville.id, label: ville.title })).sort((a, b) => a.label.localeCompare(b.label)),
            })))
            .catch(() => { });
        if (!user) return;
        getPersonnagesOfUser(user.id)
            .then((liste) => setPersonnages((Array.isArray(liste) ? liste : []).map((item) => item.personnage).filter((personnage) => personnage.status !== "mort")))
            .catch(() => { });
        Promise.all([
            getCivilisations().catch(() => []), getReligions().catch(() => []), getCommerces().catch(() => []),
            getAlliances().catch(() => []), getGuerres().catch(() => []),
        ]).then(([civilisations, religions, commerces, alliances, guerres]) => {
            const civs = managedEntities(civilisations, "civilisation");
            const rels = managedEntities(religions, "religion");
            const coms = managedEntities(commerces, "commerce");
            const idsCivs = new Set(civs.map((civ) => civ.id));
            const allis = (Array.isArray(alliances) ? alliances : []).filter((item) => user.is_admin || idsCivs.has(item.chef_de_file?.id)).map((item) => item.alliance);
            // Guerres en cours dont on mène un camp (chef de camp géré), toutes pour un modérateur RP
            const gere = (entite) => (entite.type === "religion" ? rels : civs).some((e) => e.id === entite.id);
            const enCours = (Array.isArray(guerres) ? guerres : []).filter(({ guerre, camps }) => guerre.status === "en_cours"
                && (moderateur || Object.values(camps ?? {}).flat().some((b) => b.is_leader && gere(b.entite))));
            const parTitre = (a, b) => a.label.localeCompare(b.label);
            setOptions((prev) => ({
                ...prev,
                organisateurs: [
                    { value: "joueur", label: `Moi-même (${nom(user)})` },
                    ...civs.map((c) => ({ value: `civilisation:${c.id}`, label: `Civilisation · ${c.title}` })).sort(parTitre),
                    ...rels.map((r) => ({ value: `religion:${r.id}`, label: `Religion · ${r.title}` })).sort(parTitre),
                    ...coms.map((c) => ({ value: `commerce:${c.id}`, label: `Commerce · ${c.title}` })).sort(parTitre),
                    ...allis.map((a) => ({ value: `alliance:${a.id}`, label: `Alliance · ${a.title}` })).sort(parTitre),
                ],
                guerres: enCours.map(({ guerre }) => ({ value: guerre.id, label: guerre.title })).sort(parTitre),
                // Organisateurs dont on peut gérer les événements (en plus des siens)
                gerables: new Set([
                    ...civs.map((c) => `civilisation:${c.id}`), ...rels.map((r) => `religion:${r.id}`),
                    ...coms.map((c) => `commerce:${c.id}`), ...allis.map((a) => `alliance:${a.id}`),
                ]),
            }));
        });
        // moderateur : le rôle peut arriver après le premier rendu (profil resynchronisé par la barre de navigation)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moderateur]);

    useEffect(() => { if (edition) showModalID(MODAL_ID); }, [edition]);

    // Lien d'une annonce Discord (#evenement-12) : on descend jusqu'à l'événement une fois la liste affichée
    useEffect(() => {
        const cible = decodeURIComponent(window.location.hash.slice(1));
        if (cible && donnees) requestAnimationFrame(() => document.getElementById(cible)?.scrollIntoView({ block: "start" }));
    }, [donnees]);

    const reload = () => setReloadKey((key) => key + 1);
    const changerMois = (sens) => setSearchParams({ mois: isoMois(moisVoisin(debut, sens)) });
    const ouvrir = (evenement = null) => setEdition((prev) => ({ evenement, count: (prev?.count ?? 0) + 1 }));
    const annoncer = () => requireLogin(() => ouvrir(), "annoncer un événement");

    const peutGerer = (evenement) => Boolean(user) && (moderateur || evenement.created_by?.id === user.id
        || options.gerables.has(`${evenement.organisateur.type}:${evenement.organisateur.id}`));

    const enregistrer = async (values) => {
        const corps = {
            title: values.title,
            type: values.type,
            date_debut: values.date_debut,
            date_fin: values.date_fin || null,
            lieu: values.lieu || null,
            ville_id: values.ville_id ? Number(values.ville_id) : null,
            guerre_id: values.guerre_id ? Number(values.guerre_id) : null,
            places: values.places === "" || values.places == null ? null : Number.parseInt(values.places, 10),
            description: values.description || null,
        };
        if (corps.places != null && !Number.isInteger(corps.places)) throw new Error("Le nombre de places est un nombre entier.");
        let data;
        if (edition.evenement) {
            data = await updateEvenement(edition.evenement.id, corps);
        } else {
            const [organisateur_type, organisateur_id] = String(values.organisateur || "joueur").split(":");
            data = await createEvenement({ ...corps, organisateur_type, organisateur_id: organisateur_id ? Number(organisateur_id) : null });
        }
        const moisEvenement = isoMois(new Date(data.evenement.date_debut));
        await Swal.fire({ icon: "success", title: data.text, text: "Il est annoncé sur Discord, où il apparaît aussi parmi les événements du serveur." });
        if (moisEvenement !== mois) setSearchParams({ mois: moisEvenement });
        else reload();
    };

    const inscrire = async (evenement) => {
        if (!user) {
            requireLogin(() => { }, "vous inscrire");
            return;
        }
        let personnageId = null;
        if (personnages.length > 0) {
            const answer = await Swal.fire({
                icon: "question",
                title: `S'inscrire à « ${evenement.title} »`,
                text: "Sous quels traits y participez-vous ?",
                input: "select",
                // Map : un objet rangerait les identifiants numériques avant « Moi-même »
                inputOptions: new Map([["", `Moi-même (${nom(user)})`], ...personnages.map((p) => [String(p.id), p.name])]),
                inputValue: String(evenement.inscrits.find((inscrit) => inscrit.user?.id === user.id)?.personnage?.id ?? ""),
                showCancelButton: true,
                confirmButtonText: "M'inscrire",
                cancelButtonText: "Annuler",
            });
            if (!answer.isConfirmed) return;
            personnageId = answer.value ? Number(answer.value) : null;
        }
        if (await runAction(() => inscrireEvenement(evenement.id, personnageId))) reload();
    };

    const desinscrire = async (evenement) => {
        if (await runAction(() => desinscrireEvenement(evenement.id), { confirm: { title: `Se désinscrire de « ${evenement.title} » ?`, button: "Se désinscrire" } })) reload();
    };

    const annuler = async (evenement) => {
        const answer = await Swal.fire({
            icon: "warning",
            title: `Annuler « ${evenement.title} » ?`,
            text: "L'annulation est annoncée sur Discord et l'événement y est retiré. Les inscrits le verront annulé ici.",
            input: "text",
            inputPlaceholder: "Motif (facultatif)",
            showCancelButton: true,
            confirmButtonText: "Annuler l'événement",
            cancelButtonText: "Garder",
        });
        if (!answer.isConfirmed) return;
        if (await runAction(() => annulerEvenement(evenement.id, answer.value || null))) reload();
    };

    const actionsGestion = (evenement) => (peutGerer(evenement) && evenement.status !== "annule" && !evenement.termine ? (
        <>
            <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={() => ouvrir(evenement)}>
                <FontAwesomeIcon icon="fa-solid fa-pen" />
                Modifier
            </button>
            <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => annuler(evenement)}>
                <FontAwesomeIcon icon="fa-solid fa-ban" />
                Annuler
            </button>
        </>
    ) : null);

    const evenements = donnees?.evenements ?? [];
    const foires = donnees?.foires ?? [];
    // Programme du mois : événements et foires, par date de début
    const programme = [
        ...evenements.map((evenement) => ({ cle: `evenement-${evenement.id}`, debut: evenement.date_debut, evenement })),
        ...foires.map((foire) => ({ cle: `foire-${foire.id}`, debut: `${foire.date_debut}T00:00:00`, foire })),
    ].sort((a, b) => a.debut.localeCompare(b.debut));

    const navigation = (
        <div className="flex flex-row items-center justify-between gap-2 w-full">
            <button type="button" className="btn btn-sm btn-ghost bg-base-200" onClick={() => changerMois(-1)} aria-label="Mois précédent">
                <FontAwesomeIcon icon="fa-solid fa-chevron-left" />
                <span className="hidden sm:inline">{titreMois(moisVoisin(debut, -1))}</span>
            </button>
            <h2 className="text-xl font-semibold first-letter:uppercase">{titreMois(debut)}</h2>
            <button type="button" className="btn btn-sm btn-ghost bg-base-200" onClick={() => changerMois(1)} aria-label="Mois suivant">
                <span className="hidden sm:inline">{titreMois(moisVoisin(debut, 1))}</span>
                <FontAwesomeIcon icon="fa-solid fa-chevron-right" />
            </button>
        </div>
    );

    return (
        <>
            <Navbar active="calendrier" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    <GrimoireHero
                        icon="fa-solid fa-calendar-days"
                        title="Le calendrier de Tetrago"
                        description="Batailles prévues, fêtes, couronnements : annoncez vos événements, inscrivez-vous à ceux des autres. Tout est annoncé sur Discord."
                        topRight={
                            <button onClick={annoncer} className="flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left" data-tip="Annoncer un événement" style={{ padding: "0.75rem 0.75rem 0.75rem 1.25rem", cursor: "pointer" }}>
                                <span className="flex">Événement</span>
                                <FontAwesomeIcon icon="fas fa-plus" />
                            </button>
                        }
                    />

                    {navigation}
                    {donnees === null ? (
                        <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>
                    ) : (
                        <>
                            <GrilleMois debut={debut} evenements={evenements} foires={foires} />
                            <section id="programme" className="flex flex-col gap-2 w-full mt-2">
                                <TitleH2
                                    text={`Au programme en ${titreMois(debut)}`}
                                    icon="fas fa-list"
                                    fonctions={[{ id: 1, title: "Annoncer", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => ouvrir() }]}
                                />
                                {programme.length === 0 ? (
                                    <EtatVide
                                        icon="fa-solid fa-calendar-xmark"
                                        texte={`Rien n'est encore prévu en ${titreMois(debut)}.`}
                                        aide="Une fête, un tournoi, une bataille annoncée : donnez rendez-vous aux autres joueurs."
                                        action={{ label: "Annoncer un événement", icon: "fa-solid fa-plus", onClick: annoncer }}
                                    />
                                ) : programme.map((item) => (item.evenement ? (
                                    <EvenementCard key={item.cle} evenement={item.evenement} user={user} gerer={actionsGestion(item.evenement)} inscrire={inscrire} desinscrire={desinscrire} />
                                ) : (
                                    <FoireCard key={item.cle} foire={item.foire} afficherVille />
                                )))}
                            </section>
                        </>
                    )}

                    {user && edition ? (
                        <FormModal
                            key={`${MODAL_ID}-${edition.count}`}
                            id={MODAL_ID}
                            title={edition.evenement ? `Modifier « ${edition.evenement.title} »` : "Annoncer un événement"}
                            intro={edition.evenement ? "Un changement de date est annoncé sur Discord." : null}
                            fields={champs(edition.evenement, options)}
                            initialValues={valeursInitiales(edition.evenement)}
                            submitLabel={edition.evenement ? "Enregistrer" : "Annoncer"}
                            onSubmit={enregistrer}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
