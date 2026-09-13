import { useState, useEffect } from "react";
import { checkMemberAuth } from "../../services/authorisation";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import Stat from "../../components/Objects/Stat";
import MemberButton from "../../components/Buttons/MemberButton";
import TransferFounderModal from "../../components/Modals/TransferFounderModal";
import DynamicModal from "../../components/Modals/DynamicModal";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";
import VilleReligions from "../../components/Objects/VilleReligions";

import { showModal, showModalID } from '../../components/Functions/showModal';
import { religionColor, religionIcon, formatInfluence } from '../../components/Functions/religionColor';
import { Config_Modal_Religion } from '../../components/Modals/Config_Modal_Religion';
import { Config_Modal_Religion_Member, Config_Modal_Religion_Member_Edit } from '../../components/Modals/Config_Modal_Member';
import {
    getReligionById,
    getReligions,
    getCivilisations,
    deleteMemberReligion
} from "../../services/api"
import Swal from "sweetalert2";

const ROLE_ORDER = { Fondateur: 0, Admin: 1 };
const TRANSFER_MODAL_ID = "religion-transfer-founder-modal";

const influenceOf = (lien) => Math.max(0, Number(lien?.influence) || 0);

function InfluenceBar({ influence, color }) {
    return (
        <div className="w-full h-2 rounded-full bg-base-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, influence)}%`, backgroundColor: color }}></div>
        </div>
    );
}

export default function ReligionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [religion, setReligion] = useState(null);
    const [members, setMembers] = useState([]);
    const [villes, setVilles] = useState([]);
    const [quartiers, setQuartiers] = useState([]);
    const [religionsByVille, setReligionsByVille] = useState({});
    const [civilisations, setCivilisations] = useState({});
    const [loading, setLoading] = useState(true);
    const [auth, setAuth] = useState(false);
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

    useEffect(() => {
        getReligionById(id)
            .then((data) => {
                setReligion(data.religion ? data.religion : null);
                setMembers(data.members ? data.members : []);
                setVilles(data.villes ? data.villes : []);
                setQuartiers(data.quartiers ? data.quartiers : []);
                checkMemberAuth(data.members ? data.members : [], setAuth);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching religion:', error);
                setReligion(null);
                setMembers([]);
                setVilles([]);
                setQuartiers([]);
                setLoading(false);
            });

        // Données complémentaires : leur échec n'empêche pas l'affichage de la page
        getReligions()
            .then((data) => {
                const byVille = {};
                data.forEach(({ religion: other, villes: otherVilles }) => {
                    (otherVilles || []).forEach(({ ville, villes_religions }) => {
                        (byVille[ville.id] ??= []).push({ ...other, influence: villes_religions.influence });
                    });
                });
                setReligionsByVille(byVille);
            })
            .catch((error) => console.error('Error fetching religions:', error));

        getCivilisations()
            .then((data) => setCivilisations(Object.fromEntries(data.map(({ civilisation }) => [civilisation.id, civilisation]))))
            .catch((error) => console.error('Error fetching civilisations:', error));
    }, [id]);

    const updateReligion = (data) => {
        setReligion(data.religion ? data.religion : null);
    };

    const handleDelete = () => {
        navigate('/religions');
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Religion, "edit") }
    ];

    const btnReturn = { text: 'Retour aux religions', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/religions' };

    const color = religionColor(religion);
    const icon = religionIcon(religion);

    const dateFounded = religion?.date_founded ? new Date(religion.date_founded).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : null;

    // Villes triées par influence, avec la répartition de toutes les religions de la ville
    const presences = villes
        .map(({ ville, villes_religions }) => {
            const others = religionsByVille[ville.id] || [];
            const influence = influenceOf(villes_religions);
            const dominant = others.every((other) => other.id === religion?.id || influenceOf(other) < influence);
            return { ville, influence, others, dominant: influence > 0 && dominant };
        })
        .sort((a, b) => b.influence - a.influence);

    const dominantCount = presences.filter((presence) => presence.dominant).length;
    const averageInfluence = presences.length > 0 ? presences.reduce((sum, presence) => sum + presence.influence, 0) / presences.length : null;

    const handleFounderTransfer = (newMembers) => {
        setMembers(newMembers);
        checkMemberAuth(newMembers, setAuth);
    };

    const addMember = (data) => {
        if (data.member) setMembers((prevMembers) => [...prevMembers, data.member]);
    };

    const handleMemberModify = (data) => {
        const updatedMember = data.member;
        if (!updatedMember) return;
        const newMembers = members.map((member) => member.user_id === updatedMember.user_id ? updatedMember : member);
        setMembers(newMembers);
        checkMemberAuth(newMembers, setAuth);
    };

    const handleMemberDelete = async (member) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Êtes-vous sûr ?",
            text: "Ce membre sera retiré de la religion.",
            showCancelButton: true,
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        });
        if (!result.isConfirmed) return;

        try {
            await deleteMemberReligion(id, member.user_id);
            const newMembers = members.filter((m) => m.user_id !== member.user_id);
            setMembers(newMembers);
            checkMemberAuth(newMembers, setAuth);
            Swal.fire({ icon: "success", title: "Succès", text: "Membre retiré de la religion avec succès." });
        } catch (error) {
            console.error("Erreur lors de la suppression du membre:", error);
            Swal.fire({ icon: "error", title: "Oops...", text: error.message });
        }
    };

    const FctMembers = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Religion_Member, "add") }
    ];

    const sortedMembers = [...members].sort((a, b) => (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2));

    const BodyHTML = (
        <>
            <TitleH1 text={religion ? religion.title : "Religion inconnue"} icon={icon} btn={btnReturn} fonctions={FctModify} />

            {/* En-tête : identité, chiffres clés, description et carte */}
            <div className="flex flex-col lg:flex-row gap-4 w-full bg-base-200 rounded-3xl p-4 border-l-8" style={{ borderLeftColor: color }}>
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="flex flex-row items-center gap-4">
                        <span className="flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl shrink-0 shadow-md" style={{ backgroundColor: color }}>
                            <FontAwesomeIcon icon={icon} />
                        </span>
                        <div className="flex flex-col gap-1">
                            <span className="flex flex-row items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-calendar" className="opacity-70" />
                                <span>{dateFounded ? `Fondée le ${dateFounded}` : "Date de fondation inconnue"}</span>
                            </span>
                            <span className="flex flex-row items-center gap-2">
                                <FontAwesomeIcon icon={religion?.is_public ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} className="opacity-70" />
                                <span>{religion?.is_public ? "Religion publique" : "Religion privée"}</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                        <Stat icon="fa-solid fa-users" label={members.length > 1 ? "Membres" : "Membre"} value={members.length} color={color} />
                        <Stat icon="fa-solid fa-city" label={villes.length > 1 ? "Villes" : "Ville"} value={villes.length} color={color} />
                        <Stat icon="fa-solid fa-crown" label="Majoritaire" value={`${dominantCount} ville${dominantCount > 1 ? "s" : ""}`} color={color} />
                        <Stat icon="fa-solid fa-hands-praying" label="Influence moyenne" value={averageInfluence == null ? "—" : formatInfluence(averageInfluence)} color={color} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="flex flex-row items-center gap-2 font-bold">
                            <FontAwesomeIcon icon="fas fa-pen-nib" />
                            <span>Description</span>
                        </span>
                        <MarkdownTextEditor value={religion?.description ? religion.description : 'Aucune description'} />
                    </div>
                </div>
            </div>

            <TitleH2 text="Membres" icon="fas fa-users" fonctions={FctMembers} />
            <div className="flex flex-row flex-wrap gap-2 w-full">
                {sortedMembers.length > 0 ? (
                    sortedMembers.map((member) => (
                        <MemberButton
                            key={member.user_id}
                            member={member}
                            roleColor={color}
                            editConfig={Config_Modal_Religion_Member_Edit}
                            // Fondateur : transfert par lui-même ou un administrateur du site ; autres membres : Fondateur / Admin
                            auth={member.role === "Fondateur" ? (member.user_id === user?.id || Boolean(user?.is_admin)) : auth}
                            onDelete={handleMemberDelete}
                            onModifyMember={handleMemberModify}
                            onTransfer={() => showModalID(TRANSFER_MODAL_ID)}
                        />
                    ))
                ) : (
                    <i>Aucun membre pour cette religion.</i>
                )}
            </div>

            <TitleH2 text="Présence dans les villes" icon="fas fa-city" />
            {presences.length === 0 ? (
                <div className="w-full">
                    <i>Cette religion n'est présente dans aucune ville.</i>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                    {presences.map(({ ville, influence, others, dominant }) => (
                        <a
                            key={ville.id}
                            href={ville.civilisation_id ? `/civilisation/${ville.civilisation_id}/ville/${ville.id}` : undefined}
                            className="flex flex-col gap-3 w-full bg-base-200 hover:bg-base-300 transition-colors p-4 rounded-2xl"
                        >
                            <div className="flex flex-row items-center gap-3">
                                <FontAwesomeIcon icon={`fa-solid fa-${ville.is_capital ? 'archway' : 'city'}`} className="text-xl" />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="flex flex-row items-center gap-2 font-bold">
                                        <span className="truncate">{ville.title}</span>
                                        {dominant ? <span className="badge badge-sm badge-neutral">Majoritaire</span> : null}
                                    </span>
                                    <span className="text-sm opacity-70 truncate">
                                        {civilisations[ville.civilisation_id]?.title ?? "Civilisation inconnue"}
                                        {ville.is_capital ? " · Capitale" : ""}
                                    </span>
                                </div>
                                <span className="text-lg font-semibold tabular-nums">{formatInfluence(influence)}</span>
                            </div>
                            <InfluenceBar influence={influence} color={color} />
                            {others.length > 1 ? (
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm opacity-70">Religions de la ville</span>
                                    <VilleReligions religions={others} compact />
                                </div>
                            ) : null}
                        </a>
                    ))}
                </div>
            )}

            {quartiers.length > 0 ? (
                <>
                    <TitleH2 text="Présence dans les quartiers" icon="fas fa-map-location-dot" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                        {[...quartiers].sort((a, b) => influenceOf(b.quartiers_religions) - influenceOf(a.quartiers_religions)).map(({ quartier, quartiers_religions }) => (
                            <div key={quartier.id} className="flex flex-col gap-3 w-full bg-base-200 p-4 rounded-2xl">
                                <div className="flex flex-row items-center gap-3">
                                    <FontAwesomeIcon icon="fa-solid fa-map-location-dot" className="text-xl" />
                                    <span className="flex-1 font-bold truncate">{quartier.title}</span>
                                    <span className="text-lg font-semibold tabular-nums">{formatInfluence(quartiers_religions?.influence)}</span>
                                </div>
                                <InfluenceBar influence={influenceOf(quartiers_religions)} color={color} />
                            </div>
                        ))}
                    </div>
                </>
            ) : null}
        </>
    );

    return (
        <>
            <Navbar active="religions" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !religion ? (
                        <>
                            <TitleH1 text="Religion introuvable" icon="fa-solid fa-place-of-worship" btn={btnReturn} />
                            <p>Cette religion n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    <DynamicModal config={Config_Modal_Religion} mode="edit" onSubmit={(religion) => { updateReligion(religion) }} onDelete={handleDelete} />
                    <DynamicModal config={Config_Modal_Religion_Member} mode="add" onSubmit={addMember} />
                    <TransferFounderModal id={TRANSFER_MODAL_ID} entity="religion" entityId={id} members={members} onTransfer={handleFounderTransfer} />
                </div>
            </main>
        </>
    );
}
