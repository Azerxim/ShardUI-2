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

import { showModalID } from "../../components/Functions/showModal";
import { religionColor, religionIcon } from "../../components/Functions/religionColor";
import {
    GUERRE_ISSUES, GUERRE_STATUTS, GUERRE_TYPES,
    entityHref, formatDate, isModerateur, managedEntities, runAction,
} from "../../components/Functions/conflits";
import { getSessionUser } from "../../services/session";
import { apiRequest, getAlliances, getCivilisations, getGuerreById, getReligions } from "../../services/api";

const CAMP_LABELS = { attaquant: { title: "Attaquants", icon: "fa-solid fa-khanda" }, defenseur: { title: "Défenseurs", icon: "fa-solid fa-shield-halved" } };
const MODAL_IDS = { edit: "guerre-edit-modal", valider: "guerre-valider-modal", refuser: "guerre-refuser-modal", terminer: "guerre-terminer-modal" };
const callModalId = (camp) => `guerre-appel-${camp}-modal`;

function EntityAvatar({ entite }) {
    if (entite.type === "religion") {
        return (
            <span className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-white" style={{ backgroundColor: religionColor(entite) }}>
                <FontAwesomeIcon icon={religionIcon(entite)} />
            </span>
        );
    }
    return (
        <span className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-base-300">
            <FontAwesomeIcon icon="fa-solid fa-flag" />
        </span>
    );
}

export default function GuerrePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [civilisations, setCivilisations] = useState([]);
    const [religions, setReligions] = useState([]);
    const [alliances, setAlliances] = useState([]);
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
    }, []);

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
                <a href={entityHref(b.entite)} className="flex flex-row items-center gap-3 flex-1 min-w-0">
                    <EntityAvatar entite={b.entite} />
                    <span className="flex flex-col min-w-0">
                        <span className="font-bold break-words link-hover">{b.entite.title}</span>
                        <span className="flex flex-row flex-wrap gap-1">
                            {b.is_leader ? <span className="badge badge-sm badge-primary">Chef de camp</span> : null}
                            {b.status === "appele" ? <span className="badge badge-sm badge-warning">Appel en attente</span> : null}
                            {b.alliance ? <span className="badge badge-sm badge-ghost">via {b.alliance.title}</span> : null}
                            {b.entite.type === "religion" ? <span className="badge badge-sm badge-ghost">Religion</span> : null}
                        </span>
                    </span>
                </a>
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

