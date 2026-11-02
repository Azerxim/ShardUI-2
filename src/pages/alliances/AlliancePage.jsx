import { useState, useEffect } from "react";
import { usePageTitle } from "@/utils/pageTitle";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import TitleH1 from "@/components/ui/TitleH1";
import EnTeteFiche from "@/components/ui/EnTeteFiche";
import Medaillon from "@/components/ui/Medaillon";
import SommaireFiche from "@/components/ui/SommaireFiche";
import TitleH2 from "@/components/ui/TitleH2";
import Stat from "@/components/ui/Stat";
import InfoLine from "@/components/ui/InfoLine";
import MarkdownTextEditor from "@/components/ui/MarkdownTextEditor";
import DescriptionLongue from "@/components/ui/DescriptionLongue";
import FormModal from "@/components/modals/FormModal";

import { showModalID } from "@/utils/showModal";
import {
    ALLIANCE_ROLE_BADGES, ALLIANCE_TYPES, GUERRE_STATUTS, GUERRE_TYPES,
    allianceBody, allianceFormFields, formatDate, managedEntities, runAction, toOptions,
} from "@/utils/conflits";
import { getSessionUser } from "@/services/session";
import { couleurFiche, metalSur } from "@/utils/couleurFiche";
import { apiRequest, getAllianceById, getCivilisations } from "@/services/api";
import LivresLiesSection from "@/components/bibliotheque/LivresLiesSection";
import ElectionsSection from "@/components/elections/ElectionsSection";

const EDIT_MODAL_ID = "alliance-edit-modal";
const INVITE_MODAL_ID = "alliance-invite-modal";
const JOIN_MODAL_ID = "alliance-join-modal";

export default function AlliancePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [civilisations, setCivilisations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    usePageTitle(data?.alliance?.title);

    useEffect(() => {
        getAllianceById(id)
            .then(setData)
            .catch((error) => {
                console.error("Error fetching alliance:", error);
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    useEffect(() => {
        getCivilisations()
            .then((list) => setCivilisations(Array.isArray(list) ? list : []))
            .catch((error) => console.error("Error fetching civilisations:", error));
    }, []);

    const reload = () => setReloadKey((key) => key + 1);

    const alliance = data?.alliance;
    const membres = data?.membres ?? [];
    const invitations = data?.invitations ?? [];
    const guerres = data?.guerres ?? [];
    const chef = data?.chef_de_file;
    const type = ALLIANCE_TYPES[alliance?.type] ?? ALLIANCE_TYPES.Militaire;

    const managed = managedEntities(civilisations, "civilisation");
    const managedIds = new Set(managed.map((civilisation) => civilisation.id));
    const memberIds = new Set(membres.map((membre) => membre.civilisation.id));
    const pendingIds = new Set(invitations.map((invitation) => invitation.civilisation.id));
    const isChef = Boolean(chef && managedIds.has(chef.id));
    const isMember = membres.some((membre) => managedIds.has(membre.civilisation.id));
    const hidden = alliance && alliance.is_public === false && !isMember && !user?.is_admin;

    const invitables = civilisations
        .map((item) => item.civilisation)
        .filter((civilisation) => !memberIds.has(civilisation.id) && !pendingIds.has(civilisation.id) && (civilisation.is_public !== false || managedIds.has(civilisation.id)));
    const joinables = managed.filter((civilisation) => !memberIds.has(civilisation.id) && !pendingIds.has(civilisation.id));

    const act = async (request, options) => {
        const result = await runAction(request, options);
        if (result) reload();
        return result;
    };

    const submitAndReload = async (request, successText) => {
        const result = await request();
        Swal.fire({ icon: "success", title: "Succès", text: successText ?? result?.text ?? "C'est fait." });
        reload();
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: isChef, function: () => showModalID(EDIT_MODAL_ID) },
        {
            id: 2, title: "Dissoudre", icon: "fas fa-link-slash", class: "bg-base-200 hover:bg-base-300 text-error", connected: true, authorisation: isChef,
            function: async () => {
                const result = await runAction(() => apiRequest("DELETE", `/alliances/delete/${id}`), {
                    confirm: { title: "Dissoudre l'alliance ?", text: "Les civilisations membres redeviennent indépendantes. Les guerres passées restent archivées.", button: "Dissoudre" },
                });
                if (result) navigate("/alliances");
            },
        },
    ];

    const FctMembres = [
        { id: 1, title: "Inviter", icon: "fas fa-envelope", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: isChef, tooltip: { text: "Inviter une civilisation", position: "bottom" }, function: () => showModalID(INVITE_MODAL_ID) }
    ];

    const couleur = couleurFiche(alliance?.color, alliance?.id);
    const btnReturn = { text: "Retour aux alliances", icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: "/alliances" };

    const guerresEnCours = guerres.filter(({ guerre }) => guerre.status === "en_cours");

    const BodyHTML = alliance ? (
        <>
            <EnTeteFiche
                couleur={couleur}
                embleme={<Medaillon fond={metalSur(couleur)} encre={couleur} icon={alliance.icon || type.icon} iconFallback={type.icon} titre={`Emblème de ${alliance.title}`} />}
                surtitre={[type.label, alliance.is_public === false ? "privée, sur invitation" : null, alliance.date_founded ? `scellée le ${formatDate(alliance.date_founded)}` : null].filter(Boolean).join(" · ")}
                titre={alliance.title}
                infos={
                    <InfoLine icon="fa-solid fa-crown">
                        Chef de file : {chef ? <a href={`/civilisation/${chef.id}`} className="link link-hover">{chef.title}</a> : "aucun"}
                    </InfoLine>
                }
                fonctions={FctModify}
                ariane={[{ label: "Alliances", href: "/alliances" }, { label: alliance.title }]}
            />
            <SommaireFiche />

            {/* Corps en deux colonnes (charte « Chancellerie ») : le contenu à gauche, les chiffres clés et les informations
                courtes à droite. Sur téléphone, la colonne de droite passe au-dessus du contenu. */}
            <div className="fiche grid grid-cols-1 lg:grid-cols-3 gap-x-10 w-full items-start">
                <div className="lg:col-span-2 flex flex-col gap-2 min-w-0">
                    <TitleH2 text="Présentation" icon="fas fa-pen-nib" />
                    <MarkdownTextEditor value={alliance.description || "Aucune description"} />

                    <DescriptionLongue type="alliance" id={alliance.id} auth={isChef} />

                    <TitleH2 text="Civilisations membres" icon="fas fa-flag" fonctions={FctMembres} />
                    <ul className="flex flex-col w-full">
                        {membres.map(({ civilisation, role }) => {
                            const canLeave = managedIds.has(civilisation.id) && role !== "Chef de file";
                            return (
                                <li key={civilisation.id} className="flex flex-col sm:flex-row sm:items-center gap-2 ligne-fiche">
                                    <a href={`/civilisation/${civilisation.id}`} className="flex flex-row items-center gap-3 flex-1 min-w-0 link link-hover">
                                        <FontAwesomeIcon icon={role === "Chef de file" ? "fa-solid fa-crown" : "fa-solid fa-flag"} className="opacity-80" />
                                        <span className="font-bold break-words">{civilisation.title}</span>
                                        <span className={`badge badge-sm ${ALLIANCE_ROLE_BADGES[role] ?? "badge-ghost"}`}>{role}</span>
                                    </a>
                                    <div className="flex flex-row flex-wrap gap-1">
                                        {isChef && role !== "Chef de file" ? (
                                            <>
                                                <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={() => act(() => apiRequest("PUT", `/alliances/${id}/membres/${civilisation.id}`, { role: role === "Observateur" ? "Membre" : "Observateur" }))}>
                                                    {role === "Observateur" ? "Passer membre" : "Passer observateur"}
                                                </button>
                                                <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={() => act(() => apiRequest("PUT", `/alliances/${id}/transfert`, { civilisation_id: civilisation.id }), { confirm: { title: "Transférer la direction ?", text: `${civilisation.title} deviendra chef de file et gérera l'alliance.`, button: "Transférer" } })}>
                                                    Nommer chef de file
                                                </button>
                                                <button type="button" className="btn btn-xs btn-ghost bg-base-100 text-error" onClick={() => act(() => apiRequest("DELETE", `/alliances/${id}/membres/${civilisation.id}`), { confirm: { title: "Exclure cette civilisation ?", text: `${civilisation.title} quittera l'alliance.`, button: "Exclure" } })}>
                                                    Exclure
                                                </button>
                                            </>
                                        ) : null}
                                        {canLeave && !isChef ? (
                                            <button type="button" className="btn btn-xs btn-ghost bg-base-100 text-error" onClick={() => act(() => apiRequest("DELETE", `/alliances/${id}/membres/${civilisation.id}`), { confirm: { title: "Quitter l'alliance ?", text: `${civilisation.title} ne fera plus partie de ${alliance.title}.`, button: "Quitter" } })}>
                                                Quitter l'alliance
                                            </button>
                                        ) : null}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Rejoindre : demande au nom d'une civilisation dirigée, ou explication pour les autres */}
                    {!isMember ? (
                        <div role="note" className="flex flex-col sm:flex-row sm:items-center gap-3 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
                            <FontAwesomeIcon icon="fa-solid fa-circle-info" className="text-info text-xl shrink-0" />
                            <p className="flex-1">
                                {alliance.is_public === false
                                    ? "Cette alliance recrute uniquement sur invitation de son chef de file."
                                    : joinables.length > 0
                                        ? "Une civilisation que vous dirigez peut demander à rejoindre cette alliance : son chef de file devra accepter."
                                        : "Pour rejoindre cette alliance, le fondateur ou un admin d'une civilisation doit en faire la demande, puis le chef de file l'accepter."}
                            </p>
                            {alliance.is_public !== false && joinables.length > 0 ? (
                                <button type="button" className="btn btn-sm btn-primary" onClick={() => showModalID(JOIN_MODAL_ID)}>Demander à rejoindre</button>
                            ) : null}
                        </div>
                    ) : null}

                    <ElectionsSection entityType="alliance" entityId={alliance.id} peutOrganiser={isChef} />

                    <TitleH2 text="Guerres des membres" icon="fas fa-shield-halved" aide="alliance" />
                    {guerres.length === 0 ? (
                        <i className="w-full">Aucun membre de cette alliance n'est engagé dans une guerre.</i>
                    ) : (
                        <ul className="flex flex-col w-full">
                            {guerres.map(({ guerre }) => (
                                <li key={guerre.id}>
                                    <a href={`/guerre/${guerre.id}`} className="flex flex-row flex-wrap items-center gap-2 ligne-fiche">
                                        <FontAwesomeIcon icon={(GUERRE_TYPES[guerre.type] ?? GUERRE_TYPES.Militaire).icon} className="opacity-80" />
                                        <span className="font-bold flex-1 min-w-0 break-words">{guerre.title}</span>
                                        <span className={`badge badge-sm ${GUERRE_STATUTS[guerre.status]?.badge ?? "badge-ghost"}`}>{GUERRE_STATUTS[guerre.status]?.label ?? guerre.status}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}

                    <LivresLiesSection type="alliance" id={alliance.id} />
                    <LivresLiesSection type="alliance" id={alliance.id} support="journal" />
                </div>
                <aside className="flex flex-col gap-2 min-w-0 order-first lg:order-none">
                    <div className="flex flex-col gap-2 mt-4 lg:mt-7">
                        <div className="grid grid-cols-2 gap-2 bg-base-200 rounded-3xl p-2">
                            <Stat icon="fa-solid fa-flag" label={membres.length > 1 ? "Civilisations" : "Civilisation"} value={membres.length} color={alliance.color || undefined} />
                            <Stat icon="fa-solid fa-shield-halved" label={guerresEnCours.length > 1 ? "Guerres en cours" : "Guerre en cours"} value={guerresEnCours.length} color={alliance.color || undefined} />
                        </div>
                    </div>

                    {invitations.length > 0 ? (
                        <>
                            <TitleH2 text="Invitations et demandes en attente" icon="fas fa-envelope-open-text" />
                            <ul className="flex flex-col w-full">
                                {invitations.map((invitation) => {
                                    const civManaged = managedIds.has(invitation.civilisation.id);
                                    const canAnswer = invitation.direction === "invitation" ? civManaged : isChef;
                                    const canCancel = invitation.direction === "invitation" ? isChef : civManaged;
                                    return (
                                        <li key={invitation.id} className="flex flex-col sm:flex-row sm:items-center gap-2 ligne-fiche">
                                            <span className="flex flex-row flex-wrap items-center gap-2 flex-1 min-w-0">
                                                <FontAwesomeIcon icon={invitation.direction === "invitation" ? "fa-solid fa-envelope" : "fa-solid fa-hand"} className="opacity-70" />
                                                <a href={`/civilisation/${invitation.civilisation.id}`} className="font-bold link link-hover">{invitation.civilisation.title}</a>
                                                <span className="text-sm opacity-70">{invitation.direction === "invitation" ? "est invitée à rejoindre l'alliance" : "demande à rejoindre l'alliance"}</span>
                                            </span>
                                            <div className="flex flex-row flex-wrap gap-1">
                                                {canAnswer ? (
                                                    <>
                                                        <button type="button" className="btn btn-xs btn-success" onClick={() => act(() => apiRequest("PUT", `/alliances/invitations/${invitation.id}/repondre`, { accepter: true }))}>Accepter</button>
                                                        <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={() => act(() => apiRequest("PUT", `/alliances/invitations/${invitation.id}/repondre`, { accepter: false }))}>Refuser</button>
                                                    </>
                                                ) : null}
                                                {canCancel ? (
                                                    <button type="button" className="btn btn-xs btn-ghost bg-base-100 text-error" onClick={() => act(() => apiRequest("DELETE", `/alliances/invitations/${invitation.id}`))}>Annuler</button>
                                                ) : null}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    ) : null}
                </aside>
            </div>
        </>
    ) : null;

    return (
        <>
            <Navbar active="alliances" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !alliance || hidden ? (
                        <>
                            <TitleH1 text="Alliance introuvable" icon="fas fa-handshake" btn={btnReturn} />
                            <p>Cette alliance n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    {alliance && isChef ? (
                        <>
                            <FormModal
                                key={`edit-${alliance.id}-${reloadKey}`}
                                id={EDIT_MODAL_ID}
                                title="Modifier l'alliance"
                                fields={allianceFormFields()}
                                initialValues={{
                                    title: alliance.title, type: alliance.type, description: alliance.description ?? "", color: alliance.color || "#b3263a",
                                    icon: alliance.icon || type.icon, date_founded: alliance.date_founded ?? "", is_public: String(alliance.is_public !== false),
                                }}
                                submitLabel="Enregistrer"
                                onSubmit={(values) => submitAndReload(() => apiRequest("PUT", `/alliances/update/${id}`, allianceBody(values)))}
                            />
                            <FormModal
                                key={`invite-${alliance.id}-${reloadKey}`}
                                id={INVITE_MODAL_ID}
                                title="Inviter une civilisation"
                                intro="La civilisation invitée devra accepter pour rejoindre l'alliance."
                                fields={[{ name: "civilisation_id", label: "Civilisation", type: "select", required: true, options: toOptions(invitables), empty: "Toutes les civilisations sont déjà membres ou invitées." }]}
                                submitLabel="Inviter"
                                submitIcon="fas fa-envelope"
                                onSubmit={(values) => submitAndReload(() => apiRequest("POST", `/alliances/${id}/invitations`, { civilisation_id: Number(values.civilisation_id) }))}
                            />
                        </>
                    ) : null}
                    {alliance && joinables.length > 0 ? (
                        <FormModal
                            key={`join-${alliance.id}-${reloadKey}`}
                            id={JOIN_MODAL_ID}
                            title="Demander à rejoindre"
                            intro="Le chef de file de l'alliance recevra votre demande et pourra l'accepter."
                            fields={[{ name: "civilisation_id", label: "Au nom de", type: "select", required: true, options: toOptions(joinables) }]}
                            initialValues={{ civilisation_id: joinables.length === 1 ? String(joinables[0].id) : "" }}
                            submitLabel="Envoyer la demande"
                            submitIcon="fas fa-hand"
                            onSubmit={(values) => submitAndReload(() => apiRequest("POST", `/alliances/${id}/demandes`, { civilisation_id: Number(values.civilisation_id) }))}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
