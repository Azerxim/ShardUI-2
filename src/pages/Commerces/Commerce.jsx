import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import DynamicModal from "../../components/Modals/DynamicModal";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";
import MapEmbed from "../../components/Objects/MapEmbed";

import { showModal, showModalID } from "../../components/Functions/showModal";
import { checkMemberAuth } from "../../services/authorisation";
import TransferFounderModal from "../../components/Modals/TransferFounderModal";
import { Config_Modal_Commerce } from "../../components/Modals/Config_Modal_Commerce";
import { Config_Modal_Magasin } from "../../components/Modals/Config_Modal_Magasin";
import { Config_Modal_Commerce_Member, Config_Modal_Commerce_Member_Edit } from "../../components/Modals/Config_Modal_Member";
import MemberButton from "../../components/Buttons/MemberButton";
import { getCommerceById, getDimensions, getVilles, deleteMemberCommerce } from "../../services/api";
import Swal from "sweetalert2";

const ROLE_ORDER = { Fondateur: 0, Admin: 1 };
const TRANSFER_MODAL_ID = "commerce-transfer-founder-modal";

// Un commerce privé n'est visible que par ses membres et les administrateurs du site
const canSeeCommerce = (commerce, members, user) => Boolean(
    commerce.is_public || user?.is_admin || (members || []).some((member) => member.user_id === user?.id)
);

const formatDate =(date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

function MagasinCard({ magasin, dimension, ville, auth }) {
    const opened = formatDate(magasin.founded_date);

    return (
        <div className="flex flex-col lg:flex-row gap-4 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-row items-start gap-3">
                    <FontAwesomeIcon icon={magasin.is_siege ? "fa-solid fa-building" : "fa-solid fa-store"} className="text-xl mt-1" />
                    <span className="flex flex-row flex-wrap items-center gap-2 flex-1 min-w-0 font-bold text-lg">
                        <span className="break-words">{magasin.title}</span>
                        {magasin.is_siege ? <span className="badge badge-sm badge-primary">Siège</span> : null}
                        {!magasin.is_public ? <span className="badge badge-sm badge-warning">Privé</span> : null}
                    </span>
                    {auth ? (
                        <button type="button" className="btn btn-sm btn-ghost btn-circle tooltip tooltip-left" data-tip="Modifier le magasin" onClick={() => showModal(Config_Modal_Magasin, "edit", { id: magasin.id })}>
                            <FontAwesomeIcon icon="fa-solid fa-pen" />
                        </button>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1 text-sm">
                    {ville ? (
                        <a href={`/civilisation/${ville.civilisation_id}/ville/${ville.id}`} className="flex flex-row items-center gap-2 link link-hover">
                            <FontAwesomeIcon icon={`fa-solid fa-${ville.is_capital ? 'archway' : 'city'}`} className="opacity-70 w-4" />
                            <span>{ville.title}</span>
                        </a>
                    ) : null}
                    {magasin.dimension_id ? (
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-location-dot" className="opacity-70 w-4" />
                            <span className="tabular-nums">{dimension ? `${dimension.title} · ` : ""}X {magasin.x ?? 0} · Z {magasin.z ?? 0}</span>
                        </span>
                    ) : null}
                    {opened ? (
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-calendar" className="opacity-70 w-4" />
                            <span>Ouvert le {opened}</span>
                        </span>
                    ) : null}
                </div>

                {magasin.description ? <p className="break-words">{magasin.description}</p> : null}
            </div>

            {dimension ? (
                <div className="w-full h-48 lg:w-[400px] shrink-0">
                    <MapEmbed
                        dimension={dimension}
                        width="100%"
                        height="100%"
                        embed="commerces"
                        x={magasin.x}
                        z={magasin.z}
                        zoom={0}
                        title={`Carte de ${magasin.title}`}
                    />
                </div>
            ) : null}
        </div>
    );
}

export default function CommercePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [commerce, setCommerce] = useState(null);
    const [members, setMembers] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [dirigeant, setDirigeant] = useState(null);
    const [diriges, setDiriges] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [villes, setVilles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        getCommerceById(id)
            .then((data) => {
                setCommerce(data.commerce ?? null);
                setMembers(data.members ?? []);
                setMagasins(data.magasins ?? []);
                setDirigeant(data.dirigeant ?? null);
                setDiriges(data.diriges ?? []);
            })
            .catch((error) => {
                console.error("Error fetching commerce:", error);
                setCommerce(null);
            })
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    // Données complémentaires : leur échec n'empêche pas l'affichage de la page
    useEffect(() => {
        getDimensions()
            .then(setDimensions)
            .catch((error) => console.error("Error fetching dimensions:", error));
        getVilles()
            .then(setVilles)
            .catch((error) => console.error("Error fetching villes:", error));
    }, []);

    // Recharger après un ajout / une modification / une suppression de magasin (le siège peut changer)
    const reload = () => setReloadKey((key) => key + 1);

    // Fondateur, Admin du commerce ou administrateur du site (même règle que l'API)
    const auth = checkMemberAuth(members);
    const hidden = commerce && !canSeeCommerce(commerce, members, user);

    const addMember = (data) => {
        if (data.member) setMembers((prevMembers) => [...prevMembers, data.member]);
    };

    const handleMemberModify = (data) => {
        const updatedMember = data.member;
        if (!updatedMember) return;
        setMembers((prevMembers) => prevMembers.map((member) => member.user_id === updatedMember.user_id ? updatedMember : member));
    };

    const handleMemberDelete = async (member) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Êtes-vous sûr ?",
            text: "Ce membre sera retiré du commerce.",
            showCancelButton: true,
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        });
        if (!result.isConfirmed) return;

        try {
            await deleteMemberCommerce(id, member.user_id);
            setMembers((prevMembers) => prevMembers.filter((m) => m.user_id !== member.user_id));
            Swal.fire({ icon: "success", title: "Succès", text: "Membre retiré du commerce avec succès." });
        } catch (error) {
            console.error("Erreur lors de la suppression du membre:", error);
            Swal.fire({ icon: "error", title: "Oops...", text: error.message });
        }
    };

    const FctMembers = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Commerce_Member, "add") }
    ];

    // Les rôles de plusieurs membres changent : on recharge la fiche
    const handleFounderTransfer = () => reload();

    const sortedMembers = [...members].sort((a, b) => (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2));

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Commerce, "edit") }
    ];

    const FctMagasins = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Magasin, "add") }
    ];

    const btnReturn = { text: 'Retour aux commerces', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/commerces' };

    // Les magasins privés ne sont visibles que par le Fondateur, les Admins et les administrateurs du site
    const visibleMagasins = magasins.filter((magasin) => magasin.is_public || auth);
    const siege = visibleMagasins.find((magasin) => magasin.is_siege);
    const villeSiege = siege ? villes.find((ville) => ville.id === siege.ville_id) : null;
    const visibleDiriges = diriges.filter(({ commerce: dirige, members: dirigeMembers }) => canSeeCommerce(dirige, dirigeMembers, user));

    const BodyHTML = commerce ? (
        <>
            <TitleH1 text={commerce.title} icon="fas fa-shop" btn={btnReturn} fonctions={FctModify} />

            <div className="flex flex-col gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="flex items-center justify-center w-16 h-16 rounded-full text-2xl shrink-0 bg-base-300 shadow-md">
                        <FontAwesomeIcon icon="fa-solid fa-shop" />
                    </span>
                    <div className="flex flex-col gap-1 min-w-0">
                        {dirigeant ? (
                            <span className="flex flex-row items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-crown" className="opacity-70 w-4" />
                                <span>Dirigé par <a href={`/commerce/${dirigeant.id}`} className="link link-hover">{dirigeant.title}</a></span>
                            </span>
                        ) : null}
                        {commerce.date_founded ? (
                            <span className="flex flex-row items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-calendar" className="opacity-70 w-4" />
                                <span>Fondé le {formatDate(commerce.date_founded)}</span>
                            </span>
                        ) : null}
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon={commerce.is_public ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} className="opacity-70 w-4" />
                            <span>{commerce.is_public ? "Commerce public" : "Commerce privé"}</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-row items-center gap-3 bg-base-100 rounded-2xl p-3">
                        <FontAwesomeIcon icon="fa-solid fa-store" className="text-xl" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl font-bold tabular-nums">{visibleMagasins.length}</span>
                            <span className="text-sm opacity-70">{visibleMagasins.length > 1 ? "Magasins" : "Magasin"}</span>
                        </div>
                    </div>
                    <div className="flex flex-row items-center gap-3 bg-base-100 rounded-2xl p-3">
                        <FontAwesomeIcon icon="fa-solid fa-building" className="text-xl" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl font-bold truncate">{siege ? siege.title : "—"}</span>
                            <span className="text-sm opacity-70 truncate">{villeSiege ? `Siège · ${villeSiege.title}` : "Siège"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="flex flex-row items-center gap-2 font-bold">
                        <FontAwesomeIcon icon="fas fa-pen-nib" />
                        <span>Description</span>
                    </span>
                    <MarkdownTextEditor value={commerce.description ? commerce.description : 'Aucune description'} />
                </div>
            </div>

            <TitleH2 text="Membres" icon="fas fa-users" fonctions={FctMembers} />
            <div className="flex flex-row flex-wrap gap-2 w-full">
                {sortedMembers.length > 0 ? (
                    sortedMembers.map((member) => (
                        <MemberButton
                            key={member.user_id}
                            member={member}
                            editConfig={Config_Modal_Commerce_Member_Edit}
                            // Fondateur : transfert par lui-même ou un administrateur du site ; autres membres : Fondateur / Admin
                            auth={member.role === "Fondateur" ? (member.user_id === user?.id || Boolean(user?.is_admin)) : auth}
                            onDelete={handleMemberDelete}
                            onModifyMember={handleMemberModify}
                            onTransfer={() => showModalID(TRANSFER_MODAL_ID)}
                        />
                    ))
                ) : (
                    <i>Aucun membre pour ce commerce.</i>
                )}
            </div>

            <TitleH2 text="Magasins" icon="fas fa-store" fonctions={FctMagasins} />
            {visibleMagasins.length === 0 ? (
                <div className="w-full">
                    <i>Ce commerce n'a encore aucun magasin.</i>
                </div>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    {visibleMagasins.map((magasin) => (
                        <MagasinCard
                            key={magasin.id}
                            magasin={magasin}
                            dimension={dimensions.find((dimension) => dimension.id === magasin.dimension_id)}
                            ville={villes.find((ville) => ville.id === magasin.ville_id)}
                            auth={auth}
                        />
                    ))}
                </div>
            )}

            {visibleDiriges.length > 0 ? (
                <>
                    <TitleH2 text="Commerces dirigés" icon="fas fa-crown" />
                    <div className="flex flex-col gap-4 w-full">
                        {visibleDiriges.map(({ commerce: dirige, fondateur: dirigeFondateur, members: dirigeMembers, magasins: dirigeMagasins }) => {
                            const dirigeAuth = checkMemberAuth(dirigeMembers || []);
                            const dirigeVisibleMagasins = (dirigeMagasins || []).filter((magasin) => magasin.is_public || dirigeAuth);
                            return (
                                <div key={dirige.id} className="flex flex-col gap-2 w-full">
                                    <a href={`/commerce/${dirige.id}`} className="flex flex-row flex-wrap items-center gap-2 px-2 font-bold hover:underline">
                                        <FontAwesomeIcon icon="fa-solid fa-shop" />
                                        <span>{dirige.title}</span>
                                        {dirigeFondateur ? <span className="font-normal text-sm opacity-70">· {dirigeFondateur.full_name || dirigeFondateur.username}</span> : null}
                                    </a>
                                    {dirigeVisibleMagasins.length === 0 ? (
                                        <i className="px-2 text-sm opacity-70">Aucun magasin.</i>
                                    ) : dirigeVisibleMagasins.map((magasin) => (
                                        <MagasinCard
                                            key={magasin.id}
                                            magasin={magasin}
                                            dimension={dimensions.find((dimension) => dimension.id === magasin.dimension_id)}
                                            ville={villes.find((ville) => ville.id === magasin.ville_id)}
                                            auth={false}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : null}
        </>
    ) : null;

    return (
        <>
            <Navbar active="commerces" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !commerce || hidden ? (
                        <>
                            <TitleH1 text="Commerce introuvable" icon="fas fa-shop" btn={btnReturn} />
                            <p>Ce commerce n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    {auth ? (
                        <>
                            <DynamicModal config={Config_Modal_Commerce} mode="edit" onSubmit={(data) => setCommerce(data.commerce ?? commerce)} onDelete={() => navigate('/commerces')} />
                            <DynamicModal config={Config_Modal_Commerce_Member} mode="add" onSubmit={addMember} />
                            <TransferFounderModal id={TRANSFER_MODAL_ID} entity="commerce" entityId={id} members={members} onTransfer={handleFounderTransfer} />
                            <DynamicModal config={Config_Modal_Magasin} mode="add" onSubmit={reload} />
                            {magasins.map((magasin) => (
                                <DynamicModal key={magasin.id} config={Config_Modal_Magasin} mode="edit" local={{ id: magasin.id }} onSubmit={reload} onDelete={reload} />
                            ))}
                        </>
                    ) : null}
                </div>
            </main>
        </>
    );
}
