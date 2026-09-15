import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import Stat from "../../components/Objects/Stat";
import InfoLine from "../../components/Objects/InfoLine";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";
import FormModal from "../../components/Modals/FormModal";
import MapEmbed from "../../components/Objects/MapEmbed";

import { showModalID } from "../../components/Functions/showModal";
import { plural } from "../../components/Functions/plural";
import { openMapEditor } from "../../services/mapEditor";
import { DEFAULT_RELIGION_ICON, religionColor, religionIcon } from "../../components/Functions/religionColor";
import DynamicIcon from "../../components/Objects/DynamicIcon";
import {
    GUERRE_ISSUES, GUERRE_STATUTS, GUERRE_TYPES,
    entityHref, formatDate, isModerateur, managedEntities, runAction,
} from "../../components/Functions/conflits";
import { getSessionUser } from "../../services/session";
import { apiRequest, getAlliances, getCivilisations, getDimensions, getGuerreById, getReligions, getZonesOfGuerre } from "../../services/api";

const CAMP_LABELS = { attaquant: { title: "Attaquants", icon: "fa-solid fa-khanda" }, defenseur: { title: "Défenseurs", icon: "fa-solid fa-shield-halved" } };
const MODAL_IDS = {
    edit: "guerre-edit-modal", valider: "guerre-valider-modal", refuser: "guerre-refuser-modal", terminer: "guerre-terminer-modal",
    evenement: "guerre-evenement-modal", zones: "guerre-zones-modal",
};
const callModalId = (camp) => `guerre-appel-${camp}-modal`;

// Chronologie : les six premiers types sont inscrits automatiquement par l'API, les autres sont racontés
const EVENEMENT_TYPES = {
    declaration: { label: "Déclaration", icon: "fa-solid fa-scroll" },
    validation: { label: "Début", icon: "fa-solid fa-gavel" },
    refus: { label: "Refus", icon: "fa-solid fa-ban" },
    ralliement: { label: "Ralliement", icon: "fa-solid fa-handshake-angle" },
    retrait: { label: "Retrait", icon: "fa-solid fa-person-walking-arrow-right" },
    fin: { label: "Fin", icon: "fa-solid fa-flag-checkered" },
    bataille: { label: "Bataille", icon: "fa-solid fa-khanda" },
    siege: { label: "Siège", icon: "fa-solid fa-chess-rook" },
    traite: { label: "Traité", icon: "fa-solid fa-file-signature" },
    autre: { label: "Événement", icon: "fa-solid fa-feather" },
};
const EVENEMENTS_RACONTES = ["bataille", "siege", "traite", "autre"];

// Premier point d'une zone (coordonnées Leaflet [-z, x]) : centre de la carte intégrée et de l'éditeur
const zoneCenter = (zone) => {
    try {
        const coords = JSON.parse(zone.coordinates);
        const [lat, lng] = Array.isArray(coords[0]) ? coords[0] : coords;
        return { x: Math.round(lng), z: Math.round(-lat) };
    } catch {
        return { x: 0, z: 0 };
    }
};

function EntityAvatar({ entite }) {
    if (entite.type === "religion") {
        return (
            <span className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-white" style={{ backgroundColor: religionColor(entite) }}>
                <DynamicIcon icon={religionIcon(entite)} fallback={DEFAULT_RELIGION_ICON} />
            </span>
        );
    }
    return (
        <span className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-base-300">
            <FontAwesomeIcon icon="fa-solid fa-flag" />
        </span>
    );
}

// Lien vers la civilisation ou la religion, texte simple si elle a été supprimée
function EntityLink({ entite, children }) {
    const className = "flex flex-row items-center gap-3 flex-1 min-w-0";
    return entite.deleted
        ? <span className={`${className} opacity-70`}>{children}</span>
        : <a href={entityHref(entite)} className={className}>{children}</a>;
}

export default function GuerrePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [civilisations, setCivilisations] = useState([]);
    const [religions, setReligions] = useState([]);
    const [alliances, setAlliances] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        getGuerreById(id)
            .then(setData)
            .catch((error) => {
                console.error("Error fetching guerre:", error);
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    useEffect(() => {
        getCivilisations().then((list) => setCivilisations(Array.isArray(list) ? list : [])).catch((error) => console.error(error));
        getReligions().then((list) => setReligions(Array.isArray(list) ? list : [])).catch((error) => console.error(error));
        getAlliances().then((list) => setAlliances(Array.isArray(list) ? list : [])).catch((error) => console.error(error));
        getDimensions().then((list) => setDimensions(Array.isArray(list) ? list : [])).catch((error) => console.error(error));
    }, []);

    useEffect(() => {
        getZonesOfGuerre(id).then((list) => setZones(Array.isArray(list) ? list : [])).catch((error) => console.error(error));
    }, [id, reloadKey]);

    const reload = () => setReloadKey((key) => key + 1);

    const guerre = data?.guerre;
    const camps = { attaquant: data?.camps?.attaquant ?? [], defenseur: data?.camps?.defenseur ?? [] };
    const type = GUERRE_TYPES[guerre?.type] ?? GUERRE_TYPES.Militaire;
    const statut = GUERRE_STATUTS[guerre?.status] ?? { label: guerre?.status, badge: "badge-ghost" };
    const ouverte = ["en_attente", "en_cours"].includes(guerre?.status);

    const managedCivIds = new Set(managedEntities(civilisations, "civilisation").map((item) => item.id));
    const managedReligionIds = new Set(managedEntities(religions, "religion").map((item) => item.id));
    const manages = (entite) => (entite?.type === "religion" ? managedReligionIds : managedCivIds).has(entite?.id);
    const moderateur = isModerateur(user);
    const leaderOf = (camp) => camps[camp].find((b) => b.is_leader);
    const managesCamp = (camp) => Boolean(leaderOf(camp) && manages(leaderOf(camp).entite));

    const engagedCivIds = new Set([...camps.attaquant, ...camps.defenseur].filter((b) => b.entite.type === "civilisation").map((b) => b.entite.id));

    // Chronologie et zones : chefs de camp pendant la guerre, modérateurs RP (récit aussi après la fin)
    const evenements = data?.evenements ?? [];
    const publique = ["en_cours", "terminee"].includes(guerre?.status);
    const managesAnyCamp = managesCamp("attaquant") || managesCamp("defenseur");
    const canRaconter = Boolean(user) && ((moderateur && publique) || (guerre?.status === "en_cours" && managesAnyCamp));
    const canEditZones = Boolean(user) && guerre?.status === "en_cours" && (moderateur || managesAnyCamp);
    const canRemoveEvenement = (evenement) => !evenement.is_auto && Boolean(user) && (moderateur || (evenement.created_by === user.id && guerre?.status === "en_cours"));
    const zoneDimension = dimensions.find((dimension) => dimension.id === zones[0]?.dimension_id);

    const act = async (request, options) => {
        const result = await runAction(request, options);
        if (result) reload();
        return result;
    };

    const submitAndReload = async (request) => {
        const result = await request();
        Swal.fire({ icon: "success", title: "Succès", text: result?.text ?? "C'est fait." });
        reload();
    };

    const openZonesEditor = (dimension) => {
        const zone = zones.find((item) => item.dimension_id === dimension.id);
        const { x, z } = zone ? zoneCenter(zone) : { x: 0, z: 0 };
        if (!openMapEditor({ dimension, type: "guerre", id, x, z })) {
            Swal.fire({ icon: "warning", title: "Fenêtre bloquée", text: "Autorisez les fenêtres surgissantes pour ouvrir l'éditeur de carte." });
        }
    };

    const FctChronologie = [
        { id: 1, title: "Raconter", icon: "fas fa-feather", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: canRaconter, tooltip: { text: "Ajouter une bataille, un siège, un traité…", position: "bottom" }, function: () => showModalID(MODAL_IDS.evenement) },
    ];

    const FctZones = [
        {
            id: 1, title: "Tracer", icon: "fas fa-draw-polygon", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: canEditZones,
            tooltip: { text: "Tracer les zones de conflit sur la carte", position: "bottom" },
            function: () => {
                if (dimensions.length === 1) openZonesEditor(dimensions[0]);
                else if (dimensions.length > 1) showModalID(MODAL_IDS.zones);
                else Swal.fire({ icon: "info", title: "Carte indisponible", text: "Aucune dimension n'est encore configurée." });
            },
        },
    ];

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: moderateur || (guerre?.status === "en_attente" && managesCamp("attaquant")), function: () => showModalID(MODAL_IDS.edit) },
        {
            id: 2, title: "Retirer", icon: "fas fa-trash", class: "bg-base-200 hover:bg-base-300 text-error", connected: true,
            authorisation: ["en_attente", "refusee"].includes(guerre?.status) && (moderateur || managesCamp("attaquant")),
            tooltip: { text: "Retirer la déclaration", position: "bottom" },
            function: async () => {
                const result = await runAction(() => apiRequest("DELETE", `/guerres/delete/${id}`), {
                    confirm: { title: "Retirer la déclaration ?", text: "Elle sera supprimée : aucune guerre n'aura eu lieu.", button: "Retirer" },
                });
                if (result) navigate("/guerres");
            },
        },
    ];

    const btnReturn = { text: "Retour aux guerres", icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: "/guerres" };

    // Appel aux armes : civilisations non engagées, ou toute une alliance dont le chef de camp (civilisation) est membre
    const callOptions = (camp) => {
        const leader = leaderOf(camp)?.entite;
        const civOptions = civilisations
            .map((item) => item.civilisation)
            .filter((civ) => !engagedCivIds.has(civ.id) && civ.is_public !== false)
            .map((civ) => ({ value: `civilisation:${civ.id}`, label: civ.title }))
            .sort((a, b) => a.label.localeCompare(b.label));
        const allianceOptions = leader?.type === "civilisation"
            ? alliances
                .filter(({ membres }) => membres.some((membre) => membre.civilisation.id === leader.id))
                .map(({ alliance }) => ({ value: `alliance:${alliance.id}`, label: `Toute l'alliance « ${alliance.title} »` }))
            : [];
        return [...allianceOptions, ...civOptions];
    };

    const call = (camp) => async (values) => {
        const [kind, value] = String(values.cible).split(":");
        const body = kind === "alliance" ? { camp, alliance_id: Number(value) } : { camp, civilisation_id: Number(value) };
        await submitAndReload(() => apiRequest("POST", `/guerres/${id}/appels`, body));
    };

    const renderBelligerant = (b) => {
        const managed = manages(b.entite);
        const canAnswer = b.status === "appele" && managed && ouverte;
        const canRemove = !b.is_leader && guerre.status !== "terminee" && (managed || managesCamp(b.camp));
        return (
            <li key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-base-100 rounded-2xl p-3">
                {/* Entité supprimée : son nom reste dans les archives, sans lien */}
                <EntityLink entite={b.entite}>
                    <EntityAvatar entite={b.entite} />
                    <span className="flex flex-col min-w-0">
                        <span className="font-bold break-words link-hover">{b.entite.title}</span>
                        <span className="flex flex-row flex-wrap gap-1">
                            {b.entite.deleted ? <span className="badge badge-sm badge-neutral">Disparue</span> : null}
                            {b.is_leader ? <span className="badge badge-sm badge-primary">Chef de camp</span> : null}
                            {b.status === "appele" ? <span className="badge badge-sm badge-warning">Appel en attente</span> : null}
                            {b.alliance ? <span className="badge badge-sm badge-ghost">via {b.alliance.title}</span> : null}
                            {b.entite.type === "religion" ? <span className="badge badge-sm badge-ghost">Religion</span> : null}
                        </span>
                    </span>
                </EntityLink>
                {canAnswer || canRemove ? (
                    <div className="flex flex-row flex-wrap gap-1">
                        {canAnswer ? (
                            <>
                                <button type="button" className="btn btn-xs btn-error" onClick={() => act(() => apiRequest("PUT", `/guerres/${id}/appels/${b.id}/repondre`, { accepter: true }))}>Rejoindre</button>
                                <button type="button" className="btn btn-xs btn-ghost bg-base-200" onClick={() => act(() => apiRequest("PUT", `/guerres/${id}/appels/${b.id}/repondre`, { accepter: false }))}>Décliner</button>
                            </>
                        ) : null}
                        {canRemove && !canAnswer ? (
                            <button
                                type="button"
                                className="btn btn-xs btn-ghost bg-base-200 text-error"
                                onClick={() => act(() => apiRequest("DELETE", `/guerres/${id}/belligerants/${b.id}`), {
                                    confirm: b.status === "appele"
                                        ? { title: "Annuler l'appel aux armes ?", text: `${b.entite.title} ne sera plus appelée.`, button: "Annuler l'appel" }
                                        : { title: "Quitter la guerre ?", text: `${b.entite.title} se retirera du camp ${b.camp === "attaquant" ? "attaquant" : "défenseur"}.`, button: "Se retirer" },
                                })}
                            >
                                {b.status === "appele" ? "Annuler l'appel" : "Se retirer"}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </li>
        );
    };

    const BodyHTML = guerre ? (
        <>
            <TitleH1 text={guerre.title} icon={type.icon} btn={btnReturn} fonctions={FctModify} />

            {moderateur && ouverte ? (
                <div role="region" aria-label="Modération" className="flex flex-col sm:flex-row sm:items-center gap-3 w-full bg-warning/15 border border-warning/40 rounded-2xl p-3 sm:p-4">
                    <FontAwesomeIcon icon="fa-solid fa-gavel" className="text-warning text-xl shrink-0" />
                    <p className="flex-1">
                        {guerre.status === "en_attente"
                            ? "Modération RP : cette déclaration attend votre décision. Une fois validée, la guerre devient publique."
                            : "Modération RP : clôturez la guerre lorsque son issue a été jouée."}
                    </p>
                    <div className="flex flex-row flex-wrap gap-2">
                        {guerre.status === "en_attente" ? (
                            <>
                                <button type="button" className="btn btn-sm btn-success" onClick={() => showModalID(MODAL_IDS.valider)}>Valider</button>
                                <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => showModalID(MODAL_IDS.refuser)}>Refuser</button>
                            </>
                        ) : (
                            <button type="button" className="btn btn-sm btn-neutral" onClick={() => showModalID(MODAL_IDS.terminer)}>Terminer la guerre</button>
                        )}
                    </div>
                </div>
            ) : null}

            {guerre.status === "en_attente" && !moderateur ? (
                <div role="note" className="alert alert-warning alert-soft w-full">
                    <FontAwesomeIcon icon="fa-solid fa-hourglass-half" />
                    <span>Cette déclaration n'est visible que des camps concernés. Elle deviendra publique après validation par un modérateur RP.</span>
                </div>
            ) : null}
            {guerre.status === "refusee" ? (
                <div role="note" className="alert alert-error alert-soft w-full">
                    <FontAwesomeIcon icon="fa-solid fa-ban" />
                    <span>Déclaration refusée par la modération{guerre.moderation_note ? ` : ${guerre.moderation_note}` : "."}</span>
                </div>
            ) : null}

            <div className="flex flex-col gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className={`flex items-center justify-center w-16 h-16 rounded-full text-2xl shrink-0 shadow-md ${guerre.status === "en_cours" ? "bg-error text-error-content" : "bg-base-300"}`}>
                        <FontAwesomeIcon icon={type.icon} />
                    </span>
                    <div className="flex flex-col gap-1 min-w-0">
                        <InfoLine icon={type.icon}>
                            {type.label} <span className={`badge badge-sm ml-1 align-middle ${statut.badge}`}>{statut.label}</span>
                        </InfoLine>
                        <InfoLine icon="fa-solid fa-scroll">
                            Déclarée le {formatDate(guerre.declared_at)}{data.declarant ? ` par ${data.declarant.full_name || data.declarant.username}` : ""}
                        </InfoLine>
                        {guerre.date_debut ? (
                            <InfoLine icon="fa-solid fa-calendar">
                                {guerre.status === "terminee" ? `Du ${formatDate(guerre.date_debut)} au ${formatDate(guerre.date_fin)}` : `Débutée le ${formatDate(guerre.date_debut)}`}
                            </InfoLine>
                        ) : null}
                        {data.moderateur ? <InfoLine icon="fa-solid fa-gavel">Encadrée par {data.moderateur.full_name || data.moderateur.username}</InfoLine> : null}
                        {guerre.status === "terminee" && guerre.issue ? (
                            <InfoLine icon="fa-solid fa-flag-checkered"><strong>Issue : {guerre.issue}</strong></InfoLine>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Stat icon={CAMP_LABELS.attaquant.icon} label="Camp attaquant" value={camps.attaquant.filter((b) => b.status === "engage").length} />
                    <Stat icon={CAMP_LABELS.defenseur.icon} label="Camp défenseur" value={camps.defenseur.filter((b) => b.status === "engage").length} />
                </div>

                {guerre.casus_belli ? (
                    <div className="flex flex-col gap-2">
                        <span className="flex flex-row items-center gap-2 font-bold">
                            <FontAwesomeIcon icon="fa-solid fa-fire" />
                            <span>Casus belli</span>
                        </span>
                        <MarkdownTextEditor value={guerre.casus_belli} />
                    </div>
                ) : null}
                {guerre.description ? (
                    <div className="flex flex-col gap-2">
                        <span className="flex flex-row items-center gap-2 font-bold">
                            <FontAwesomeIcon icon="fas fa-pen-nib" />
                            <span>Description</span>
                        </span>
                        <MarkdownTextEditor value={guerre.description} />
                    </div>
                ) : null}
            </div>

            <TitleH2 text="Camps en présence" icon="fas fa-people-group" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                {["attaquant", "defenseur"].map((camp) => (
                    <section key={camp} aria-label={CAMP_LABELS[camp].title} className="flex flex-col gap-3 bg-base-200 rounded-3xl p-4">
                        <div className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon={CAMP_LABELS[camp].icon} className={camp === "attaquant" ? "text-error" : "text-info"} />
                            <h2 className="text-xl font-bold flex-1">{CAMP_LABELS[camp].title}</h2>
                            {managesCamp(camp) && ouverte ? (
                                <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => showModalID(callModalId(camp))}>
                                    <FontAwesomeIcon icon="fa-solid fa-bullhorn" />
                                    Appeler un allié
                                </button>
                            ) : null}
                        </div>
                        <ul className="flex flex-col gap-2">{camps[camp].map(renderBelligerant)}</ul>
                    </section>
                ))}
            </div>

            <TitleH2 text="Chronologie" icon="fas fa-timeline" fonctions={FctChronologie} />
            {evenements.length === 0 ? (
                <i className="w-full">Aucun événement n'a encore été inscrit.</i>
            ) : (
                <ol aria-label="Chronologie" className="flex flex-col gap-3 w-full border-l-2 border-base-300 ml-4 pl-5">
                    {evenements.map((evenement) => {
                        const kind = EVENEMENT_TYPES[evenement.type] ?? EVENEMENT_TYPES.autre;
                        return (
                            <li key={evenement.id} className="relative flex flex-col gap-1 bg-base-200 rounded-2xl p-3">
                                <span className="absolute -left-9 top-3 flex items-center justify-center w-7 h-7 rounded-full bg-base-100 border-2 border-base-300 text-xs" aria-hidden="true">
                                    <FontAwesomeIcon icon={kind.icon} />
                                </span>
                                <div className="flex flex-row flex-wrap items-center gap-2">
                                    <span className="font-bold break-words flex-1 min-w-0">{evenement.title}</span>
                                    <span className="badge badge-sm badge-ghost">{kind.label}</span>
                                    {evenement.camp ? <span className={`badge badge-sm ${evenement.camp === "attaquant" ? "badge-error" : "badge-info"}`}>{CAMP_LABELS[evenement.camp]?.title}</span> : null}
                                    {canRemoveEvenement(evenement) ? (
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-ghost text-error"
                                            aria-label={`Retirer « ${evenement.title} »`}
                                            onClick={() => act(() => apiRequest("DELETE", `/guerres/${id}/evenements/${evenement.id}`), {
                                                confirm: { title: "Retirer cet événement ?", text: `« ${evenement.title} » disparaîtra de la chronologie.`, button: "Retirer" },
                                            })}
                                        >
                                            <FontAwesomeIcon icon="fa-solid fa-trash" />
                                        </button>
                                    ) : null}
                                </div>
                                <span className="text-xs opacity-70">
                                    {evenement.date_rp ? `${formatDate(evenement.date_rp)} (RP)` : formatDate(evenement.created_at)}
                                    {evenement.auteur ? ` · ${evenement.auteur.full_name || evenement.auteur.username}` : ""}
                                </span>
                                {evenement.description ? <p className="whitespace-pre-wrap break-words">{evenement.description}</p> : null}
                            </li>
                        );
                    })}
                </ol>
            )}

            {publique ? (
                <>
                    <TitleH2 text="Zones de conflit" icon="fas fa-map-location-dot" fonctions={FctZones} />
                    {zones.length === 0 ? (
                        <i className="w-full">
                            {canEditZones ? "Aucune zone n'est tracée : utilisez « Tracer » pour marquer les fronts et les territoires disputés." : "Aucune zone de conflit n'a été tracée."}
                        </i>
                    ) : (
                        <div className="flex flex-col gap-2 w-full">
                            <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden">
                                <MapEmbed dimension={zoneDimension} embed="guerres" {...zoneCenter(zones[0])} zoom={0} width="100%" height="100%" title={`Zones de conflit de ${guerre.title}`} />
                            </div>
                            <span className="text-sm opacity-70">{plural(zones.length, "zone de conflit tracée", "zones de conflit tracées")}</span>
                        </div>
                    )}
                </>
            ) : null}
        </>
    ) : null;

    return (
        <>
            <Navbar active="guerres" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !guerre ? (
                        <>
                            <TitleH1 text="Guerre introuvable" icon="fas fa-shield-halved" btn={btnReturn} />
                            <p>Cette guerre n'existe pas, ou sa déclaration n'est pas encore publique.</p>
                        </>
                    ) : BodyHTML}

                    {guerre ? (
                        <>
                            <FormModal
                                key={`edit-${reloadKey}`}
                                id={MODAL_IDS.edit}
                                title="Modifier la déclaration"
                                fields={[
                                    { name: "title", label: "Nom de la guerre", type: "text", required: true },
                                    { name: "casus_belli", label: "Casus belli", type: "textarea" },
                                    { name: "description", label: "Description", type: "textarea" },
                                ]}
                                initialValues={{ title: guerre.title, casus_belli: guerre.casus_belli ?? "", description: guerre.description ?? "" }}
                                submitLabel="Enregistrer"
                                onSubmit={(values) => submitAndReload(() => apiRequest("PUT", `/guerres/update/${id}`, values))}
                            />
                            {moderateur ? (
                                <>
                                    <FormModal
                                        id={MODAL_IDS.valider}
                                        title="Valider la guerre"
                                        intro="La guerre devient publique et commence à la date RP indiquée."
                                        fields={[
                                            { name: "date_debut", label: "Début dans le RP", type: "date", help: "Aujourd'hui si laissé vide." },
                                            { name: "note", label: "Note de modération", type: "textarea", placeholder: "Cadre, enjeux, règles particulières…" },
                                        ]}
                                        submitLabel="Valider"
                                        submitClass="btn-success"
                                        onSubmit={(values) => submitAndReload(() => apiRequest("PUT", `/guerres/${id}/valider`, values))}
                                    />
                                    <FormModal
                                        id={MODAL_IDS.refuser}
                                        title="Refuser la déclaration"
                                        fields={[{ name: "note", label: "Motif", type: "textarea", required: true, placeholder: "Expliquez aux camps ce qu'il faut préparer." }]}
                                        submitLabel="Refuser"
                                        submitIcon="fas fa-ban"
                                        submitClass="btn-error"
                                        onSubmit={(values) => submitAndReload(() => apiRequest("PUT", `/guerres/${id}/refuser`, values))}
                                    />
                                    <FormModal
                                        id={MODAL_IDS.terminer}
                                        title="Terminer la guerre"
                                        intro="La guerre sera archivée : ses camps ne pourront plus changer."
                                        fields={[
                                            { name: "issue", label: "Issue", type: "select", required: true, options: GUERRE_ISSUES.map((issue) => ({ value: issue, label: issue })) },
                                            { name: "precisions", label: "Précisions", type: "textarea", placeholder: "Clauses du traité, territoires cédés…" },
                                            { name: "date_fin", label: "Fin dans le RP", type: "date", help: "Aujourd'hui si laissé vide." },
                                        ]}
                                        submitLabel="Terminer"
                                        submitIcon="fas fa-flag-checkered"
                                        submitClass="btn-neutral"
                                        onSubmit={(values) => submitAndReload(() => apiRequest("PUT", `/guerres/${id}/terminer`, {
                                            issue: values.precisions?.trim() ? `${values.issue} — ${values.precisions.trim()}` : values.issue,
                                            date_fin: values.date_fin,
                                        }))}
                                    />
                                </>
                            ) : null}
                            {canRaconter ? (
                                <FormModal
                                    key={`evenement-${reloadKey}`}
                                    id={MODAL_IDS.evenement}
                                    title="Raconter un événement"
                                    intro="Il s'ajoute à la chronologie publique de la guerre ; les batailles, sièges et traités sont aussi annoncés sur Discord."
                                    fields={[
                                        { name: "type", label: "Type", type: "radio", required: true, options: EVENEMENTS_RACONTES.map((value) => ({ value, label: EVENEMENT_TYPES[value].label })) },
                                        { name: "title", label: "Titre", type: "text", required: true, placeholder: "Bataille du Gué, siège de Val…" },
                                        { name: "date_rp", label: "Date dans le RP", type: "date" },
                                        { name: "camp", label: "Camp concerné", type: "select", placeholder: "Les deux camps", options: [{ value: "attaquant", label: "Attaquants" }, { value: "defenseur", label: "Défenseurs" }] },
                                        { name: "description", label: "Récit", type: "textarea", placeholder: "Déroulé, pertes, conséquences…" },
                                    ]}
                                    initialValues={{ type: "bataille" }}
                                    submitLabel="Ajouter à la chronologie"
                                    submitIcon="fas fa-feather"
                                    onSubmit={(values) => submitAndReload(() => apiRequest("POST", `/guerres/${id}/evenements`, values))}
                                />
                            ) : null}
                            {canEditZones && dimensions.length > 1 ? (
                                <FormModal
                                    id={MODAL_IDS.zones}
                                    title="Tracer les zones de conflit"
                                    intro="L'éditeur de carte s'ouvre dans un nouvel onglet : enregistrez vos tracés avant de revenir."
                                    fields={[{ name: "dimension_id", label: "Monde", type: "select", required: true, options: dimensions.map((dimension) => ({ value: dimension.id, label: dimension.title })) }]}
                                    submitLabel="Ouvrir l'éditeur"
                                    submitIcon="fas fa-draw-polygon"
                                    onSubmit={async (values) => {
                                        const dimension = dimensions.find((item) => String(item.id) === String(values.dimension_id));
                                        if (dimension) openZonesEditor(dimension);
                                    }}
                                />
                            ) : null}
                            {["attaquant", "defenseur"].filter((camp) => managesCamp(camp) && ouverte).map((camp) => (
                                <FormModal
                                    key={`${camp}-${reloadKey}-${civilisations.length}-${alliances.length}`}
                                    id={callModalId(camp)}
                                    title={`Appeler un allié (${CAMP_LABELS[camp].title.toLowerCase()})`}
                                    intro="Chaque civilisation appelée devra accepter pour rejoindre le camp."
                                    fields={[{ name: "cible", label: "Allié", type: "select", required: true, options: callOptions(camp), empty: "Aucune civilisation ou alliance disponible." }]}
                                    submitLabel="Appeler aux armes"
                                    submitIcon="fas fa-bullhorn"
                                    onSubmit={call(camp)}
                                />
                            ))}
                        </>
                    ) : null}
                </div>
            </main>
        </>
    );
}

