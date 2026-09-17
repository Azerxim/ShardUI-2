import { useState, useEffect } from "react";
import { usePageTitle } from "@/utils/pageTitle";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import TitleH1 from "@/components/ui/TitleH1";
import TitleH2 from "@/components/ui/TitleH2";
import Stat from "@/components/ui/Stat";
import InfoLine from "@/components/ui/InfoLine";
import MarkdownTextEditor from "@/components/ui/MarkdownTextEditor";
import PersonnageAvatar from "@/components/personnages/PersonnageAvatar";
import FormModal from "@/components/modals/FormModal";

import { showModalID } from "@/utils/showModal";
import { formatDate, runAction } from "@/utils/conflits";
import { EMPTY_LIEUX, EMPTY_REFERENTIEL, PERSONNAGE_STATUTS, loadLieux, loadReferentiel, minecraftBody, personnageFormFields, personnageInitialValues, villeHref } from "@/utils/personnages";
import { getSessionUser } from "@/services/session";
import { apiRequest, getPersonnageById } from "@/services/api";

const EDIT_MODAL_ID = "personnage-edit-modal";

export default function PersonnagePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = getSessionUser();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [lieux, setLieux] = useState(EMPTY_LIEUX);
    const [referentiel, setReferentiel] = useState(EMPTY_REFERENTIEL);

    usePageTitle(data?.personnage?.name);

    useEffect(() => {
        getPersonnageById(id)
            .then(setData)
            .catch((error) => {
                console.error("Error fetching personnage:", error);
                setData(null);
            })
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    const personnage = data?.personnage;
    const canManage = Boolean(user && personnage && (user.is_admin || user.id === personnage.user_id));

    // Lieux, espèces et classes du formulaire : seulement pour qui peut modifier
    useEffect(() => {
        if (!canManage) return;
        loadLieux().then(setLieux);
        loadReferentiel().then(setReferentiel);
    }, [canManage]);

    const reload = () => setReloadKey((key) => key + 1);

    const messages = data?.messages ?? [];
    const journaux = new Set(messages.map((message) => message.journal?.id).filter(Boolean));
    const statut = PERSONNAGE_STATUTS[personnage?.status] ?? PERSONNAGE_STATUTS.vivant;
    const { joueur, civilisation, ville, quartier, espece, classe } = data ?? {};

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: canManage, function: () => showModalID(EDIT_MODAL_ID) },
        {
            id: 2, title: "Supprimer", icon: "fas fa-trash", class: "bg-base-200 hover:bg-base-300 text-error", connected: true, authorisation: canManage,
            function: async () => {
                const result = await runAction(() => apiRequest("DELETE", `/personnages/delete/${id}`), {
                    confirm: { title: "Supprimer ce personnage ?", text: "Sa fiche disparaît et ses messages de journaux ne seront plus signés de son nom. Les messages eux-mêmes restent dans les journaux.", button: "Supprimer" },
                });
                if (result) navigate("/personnages");
            },
        },
    ];

    const unlink = async (message) => {
        const result = await runAction(() => apiRequest("DELETE", `/personnages/messages/${message.id}`), {
            confirm: { title: "Retirer ce message ?", text: `Il restera dans le journal, mais ne sera plus signé par ${personnage.name}.`, button: "Retirer" },
        });
        if (result) reload();
    };

    const saveEdit = async (values) => {
        const result = await apiRequest("PUT", `/personnages/update/${id}`, values);
        Swal.fire({ icon: "success", title: "Succès", text: result?.text ?? "Le personnage a été mis à jour" });
        reload();
    };

    const btnReturn = { text: "Retour aux personnages", icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: "/personnages" };

    const naissance = formatDate(personnage?.date_naissance);
    const deces = formatDate(personnage?.date_deces);

    const BodyHTML = personnage ? (
        <>
            <TitleH1 text={personnage.name} icon="fas fa-masks-theater" btn={btnReturn} fonctions={FctModify} />

            <div className="flex flex-col gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <PersonnageAvatar personnage={personnage} size="xl" />
                    <div className="flex flex-col gap-1 min-w-0">
                        <InfoLine icon={statut.icon}>
                            <span className={`badge badge-sm ${statut.badge}`}>{statut.label}</span>
                        </InfoLine>
                        {personnage.grade ? <InfoLine icon="fa-solid fa-medal"><span className="font-semibold">{personnage.grade}</span></InfoLine> : null}
                        <InfoLine icon="fa-solid fa-dna">
                            Espèce : {espece?.title ?? "non précisée"} · Classe : {classe?.title ?? "non précisée"}
                        </InfoLine>
                        <InfoLine icon="fa-solid fa-user">
                            {joueur ? <>Joué par <a href={`/profil/${joueur.id}`} className="link link-hover font-semibold">{joueur.full_name || joueur.username}</a></> : "Joueur inconnu"}
                        </InfoLine>
                        <InfoLine icon="fa-solid fa-cake-candles">
                            {naissance ? `Né le ${naissance}` : "Date de naissance inconnue"}
                            {deces && personnage.status !== "vivant" ? ` · Mort le ${deces}` : ""}
                        </InfoLine>
                        <InfoLine icon="fa-solid fa-house">
                            {civilisation || ville || quartier ? (
                                <>
                                    Réside à{" "}
                                    {quartier ? <><a href={`/quartier/${quartier.id}`} className="link link-hover">{quartier.title}</a>, </> : null}
                                    {ville ? <a href={villeHref(ville)} className="link link-hover">{ville.title}</a> : null}
                                    {civilisation ? <>{ville ? " (" : ""}<a href={`/civilisation/${civilisation.id}`} className="link link-hover">{civilisation.title}</a>{ville ? ")" : ""}</> : null}
                                </>
                            ) : "Sans résidence connue"}
                        </InfoLine>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Stat icon="fa-solid fa-feather" label={messages.length > 1 ? "Messages signés" : "Message signé"} value={messages.length} />
                    <Stat icon="fa-solid fa-newspaper" label={journaux.size > 1 ? "Journaux" : "Journal"} value={journaux.size} />
                </div>

                <div className="flex flex-col gap-2">
                    <span className="flex flex-row items-center gap-2 font-bold">
                        <FontAwesomeIcon icon="fas fa-pen-nib" />
                        <span>Histoire</span>
                    </span>
                    <MarkdownTextEditor value={personnage.description || "Aucune histoire n'a encore été écrite."} />
                </div>

                {personnage.minecraft_uuid || personnage.skin_url ? (
                    <div className="flex flex-col gap-2">
                        <span className="flex flex-row items-center gap-2 font-bold">
                            <FontAwesomeIcon icon="fas fa-shirt" />
                            <span>Skin</span>
                        </span>
                        <div className="flex flex-row flex-wrap items-end gap-4">
                            {personnage.minecraft_uuid ? (
                                <img src={minecraftBody(personnage.minecraft_uuid, 120)} alt={`Skin Minecraft de ${personnage.name}`} loading="lazy" className="h-48 w-auto" style={{ imageRendering: "pixelated" }} />
                            ) : null}
                            {personnage.skin_url ? (
                                <a href={personnage.skin_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 link link-hover">
                                    <img src={personnage.skin_url} alt={`Fichier de skin de ${personnage.name}`} loading="lazy" className="w-32 h-32 bg-base-100 rounded-xl object-contain" style={{ imageRendering: "pixelated" }} />
                                    <span className="text-sm">Ouvrir le fichier de skin</span>
                                </a>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </div>

            <TitleH2 text="Messages de journaux" icon="fas fa-feather" />
            {messages.length === 0 ? (
                <div role="note" className="flex flex-row items-start gap-3 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
                    <FontAwesomeIcon icon="fa-solid fa-circle-info" className="text-info text-xl shrink-0 mt-0.5" />
                    <p className="flex-1">
                        {canManage
                            ? "Dans un journal, utilisez « Associer à un personnage » sous vos messages pour les signer du nom de ce personnage. Votre compte Discord doit être lié depuis votre profil."
                            : "Aucun message de journal n'est encore signé par ce personnage."}
                    </p>
                </div>
            ) : (
                <ul className="flex flex-col gap-2 w-full">
                    {messages.map((message) => (
                        <li key={message.id} className="flex flex-col gap-2 bg-base-200 rounded-2xl p-3 sm:p-4">
                            <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1">
                                {message.journal ? (
                                    <a href={`/bibliotheque/journal/${message.journal.id}`} className="flex flex-row items-center gap-2 font-bold link link-hover min-w-0">
                                        <FontAwesomeIcon icon="fa-solid fa-newspaper" className="opacity-70" />
                                        <span className="break-words">{message.journal.title}</span>
                                    </a>
                                ) : <span className="font-bold opacity-70">Journal supprimé</span>}
                                {message.message_timestamp ? <span className="text-sm opacity-60">{formatDate(message.message_timestamp)}</span> : null}
                                {canManage ? (
                                    <button type="button" className="btn btn-xs btn-ghost bg-base-100 text-error ml-auto" onClick={() => unlink(message)}>Retirer</button>
                                ) : null}
                            </div>
                            {message.excerpt ? <p className="whitespace-pre-wrap break-words leading-relaxed">{message.excerpt}</p> : null}
                        </li>
                    ))}
                </ul>
            )}
        </>
    ) : null;

    return (
        <>
            <Navbar active="personnages" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !personnage ? (
                        <>
                            <TitleH1 text="Personnage introuvable" icon="fas fa-masks-theater" btn={btnReturn} />
                            <p>Ce personnage n'existe pas ou a été supprimé.</p>
                        </>
                    ) : BodyHTML}

                    {personnage && canManage ? (
                        <FormModal
                            key={`edit-${personnage.id}-${reloadKey}`}
                            id={EDIT_MODAL_ID}
                            title="Modifier le personnage"
                            fields={personnageFormFields(lieux, referentiel)}
                            initialValues={personnageInitialValues(personnage)}
                            submitLabel="Enregistrer"
                            onSubmit={saveEdit}
                        />
                    ) : null}
                </div>
            </main>
        </>
    );
}
