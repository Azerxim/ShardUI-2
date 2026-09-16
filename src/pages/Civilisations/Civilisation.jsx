import { useState, useEffect } from "react";
import { usePageTitle } from "../../components/Functions/pageTitle";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import Stat from "../../components/Objects/Stat";
import InfoLine from "../../components/Objects/InfoLine";
import JoinHint from "../../components/Objects/JoinHint";
import ConflictsSection from "../../components/Objects/ConflictsSection";
import ResidentsSection from "../../components/Objects/ResidentsSection";
import MemberButton from "../../components/Buttons/MemberButton";
import TransferFounderModal from '../../components/Modals/TransferFounderModal';
import DynamicModal from '../../components/Modals/DynamicModal';
import EtagereLivres from "../../components/Objects/EtagereLivres";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";
import Ville from "../../components/Objects/Ville";

import { checkMemberAuth } from "../../services/authorisation";
import { showModal, showModalID } from '../../components/Functions/showModal';
import { plural } from "../../components/Functions/plural";
import { Config_Modal_Civilisation } from '../../components/Modals/Config_Modal_Civilisation';
import { Config_Modal_Gouvernement } from '../../components/Modals/Config_Modal_Gouvernement';
import { Config_Modal_Civilisation_Member } from '../../components/Modals/Config_Modal_Civilisation_Member';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { Config_Modal_Ville } from '../../components/Modals/Config_Modal_Ville';
import {
    getCivilisationById,
    getCivilisationDirigees,
    getDimensions,
    getLivresBycivilisationId,
    deleteMemberCivilisation
} from "../../services/api"
import { openMapEditor } from "../../services/mapEditor";

const ROLE_ORDER = { Fondateur: 0, Admin: 1 };
const TRANSFER_MODAL_ID = "civilisation-transfer-founder-modal";

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

// Capitale d'abord, puis ordre alphabétique
const sortVilles = (villes) => [...villes].sort((a, b) => Number(Boolean(b.is_capital)) - Number(Boolean(a.is_capital)) || a.title.localeCompare(b.title));

function GouvernementTile({ icon, label, value }) {
    return (
        <div className="flex flex-row items-center gap-3 bg-base-100 rounded-2xl p-3">
            <FontAwesomeIcon icon={icon} className="text-xl opacity-80" />
            <div className="flex flex-col min-w-0">
                <span className="text-sm opacity-70">{label}</span>
                <span className="font-semibold break-words">{value || "—"}</span>
            </div>
        </div>
    );
}

function VillesList({ villes, civilisationId, dimensions, auth = false }) {
    return (
        <div className="flex flex-col gap-2 w-full">
            {sortVilles(villes).map((ville) => (
                <a key={ville.id} href={`/civilisation/${civilisationId}/ville/${ville.id}`}>
                    <Ville info={ville} dimensions={dimensions} auth={auth} />
                </a>
            ))}
        </div>
    );
}

export default function CivilisationPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    const [civilisation, setCivilisation] = useState(null);
    const [members, setMembers] = useState([]);
    const [gouvernement, setGouvernement] = useState(null);
    const [villes, setVilles] = useState([]);
    const [livres, setLivres] = useState([]);
    const [dimensions, setDimensions] = useState(null);
    const [dirigeante, setDirigeante] = useState(null);
    const [dirigees, setDirigees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [auth, setAuth] = useState(false);

    usePageTitle(civilisation?.title);

    useEffect(() => {
        getCivilisationById(id)
            .then((data) => {
                setCivilisation(data.civilisation ?? null);
                setMembers(data.members ?? []);
                setGouvernement(data.gouvernement ?? null);
                setVilles(data.villes ?? []);
                checkMemberAuth(data.members ?? [], setAuth);
            })
            .catch((error) => {
                console.error('Error fetching civilisation:', error);
                setCivilisation(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    // Données complémentaires : leur échec n'empêche pas l'affichage de la page
    useEffect(() => {
        getDimensions()
            .then(setDimensions)
            .catch((error) => console.error('Error fetching dimensions:', error));
        getLivresBycivilisationId(id)
            .then(setLivres)
            .catch((error) => console.error('Error fetching livres:', error));
    }, [id]);

    // Civilisation dirigeante (titre et lien)
    const dirigeanteId = civilisation && civilisation.is_civilisation_dirigeante === false && civilisation.dirigeante_civilisation_id !== parseInt(id)
        ? civilisation.dirigeante_civilisation_id
        : null;

    useEffect(() => {
        if (!dirigeanteId) return;
        let cancelled = false;

        getCivilisationById(dirigeanteId)
            .then((data) => {
                if (!cancelled) setDirigeante(data.civilisation ?? null);
            })
            .catch((error) => console.error('Error fetching civilisation dirigeante:', error));

        return () => {
            cancelled = true;
        };
    }, [dirigeanteId]);

    // Civilisations dirigées : l'endpoint ne renvoie que les civilisations,
    // leurs villes sont chargées via la fiche de chaque civilisation
    useEffect(() => {
        let cancelled = false;

        getCivilisationDirigees(id)
            .then((list) => Promise.all(
                (Array.isArray(list) ? list : [])
                    .filter((dirigee) => dirigee.id !== parseInt(id))
                    .map((dirigee) => getCivilisationById(dirigee.id)
                        .then((infos) => ({ civilisation: dirigee, villes: infos.villes || [] }))
                        .catch((error) => {
                            console.error(`Error fetching villes of civilisation ${dirigee.id}:`, error);
                            return { civilisation: dirigee, villes: [] };
                        }))
            ))
            .then((groupes) => {
                if (!cancelled) setDirigees(groupes.sort((a, b) => a.civilisation.title.localeCompare(b.civilisation.title)));
            })
            .catch((error) => console.error('Error fetching civilisations dirigées:', error));

        return () => {
            cancelled = true;
        };
    }, [id]);

    const updateCivilisation = (data) => {
        if (data.civilisation) setCivilisation(data.civilisation);
    };

    const updateGouvernement = (data) => {
        setGouvernement(data.gouvernement ?? null);
    };

    const updateMembers = (newMembers) => {
        setMembers(newMembers);
        checkMemberAuth(newMembers, setAuth);
    };

    const addMember = (data) => {
        if (data.member) updateMembers([...members, data.member]);
    };

    const handleMemberModify = (data) => {
        const updatedMember = data.member;
        if (!updatedMember) return;
        updateMembers(members.map((member) => member.user_id === updatedMember.user_id ? updatedMember : member));
    };

    const handleMemberDelete = async (member) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Êtes-vous sûr ?",
            text: "Ce membre sera retiré de la civilisation.",
            showCancelButton: true,
            confirmButtonText: "Supprimer",
            cancelButtonText: "Annuler",
        });
        if (!result.isConfirmed) return;

        try {
            await deleteMemberCivilisation(id, member.user_id);
            updateMembers(members.filter((m) => m.user_id !== member.user_id));
            Swal.fire({ icon: "success", title: "Succès", text: "Membre retiré de la civilisation avec succès." });
        } catch (error) {
            console.error("Erreur lors de la suppression du membre:", error);
            Swal.fire({ icon: "error", title: "Oops...", text: error.message });
        }
    };

    const openMarqueursEditor = () => {
        // Carte centrée sur la capitale (ou la première ville) de la civilisation
        const ville = villes.find((v) => v.is_capital) || villes[0];
        const dimension = dimensions?.find((dim) => dim.id === ville?.dimension_id) || dimensions?.[0];
        if (!dimension) {
            Swal.fire({ icon: "error", title: "Oops...", text: "Aucune dimension disponible pour la carte." });
            return;
        }
        openMapEditor({ dimension, type: "civilisation", id: civilisation.id, x: ville?.x, z: ville?.z });
    };

    const FctModify = [
        { id: 1, title: "Marqueurs", icon: "fas fa-map-location-dot", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: openMarqueursEditor },
        { id: 2, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Civilisation, "edit") }
    ];

    const FctGouvernement = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Gouvernement, "edit") }
    ];

    const FctMembers = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Civilisation_Member, "add") }
    ];

    const FctVilles = [
        { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Ville, "add") }
    ];

    const FctLivres = [
        { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Livre, "add") }
    ];

    const btnReturn = { text: 'Retour aux civilisations', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/civilisations' };

    const dateFounded = formatDate(civilisation?.date_founded);
    const capitale = villes.find((ville) => ville.is_capital);
    const population = villes.reduce((total, ville) => total + (Number(ville.population) || 0), 0);
    const sortedMembers = [...members].sort((a, b) => (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2));

    const BodyHTML = civilisation ? (
        <>
            <TitleH1 text={civilisation.title} icon="fas fa-flag" btn={btnReturn} fonctions={FctModify} />

            {/* En-tête : identité, chiffres clés et description */}
            <div className="flex flex-col gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="flex items-center justify-center w-16 h-16 rounded-full text-2xl shrink-0 bg-base-300 shadow-md">
                        <FontAwesomeIcon icon="fa-solid fa-flag" />
                    </span>
                    <div className="flex flex-col gap-1 min-w-0">
                        <InfoLine icon="fa-solid fa-calendar">
                            {dateFounded ? `Fondée le ${dateFounded}` : "Date de fondation inconnue"}
                        </InfoLine>
                        {dirigeanteId && dirigeante ? (
                            <InfoLine icon="fa-solid fa-crown">
                                Dirigée par <a href={`/civilisation/${dirigeante.id}`} className="link link-hover">{dirigeante.title}</a>
                            </InfoLine>
                        ) : null}
                        {capitale ? (
                            <InfoLine icon="fa-solid fa-archway">
                                Capitale : <a href={`/civilisation/${civilisation.id}/ville/${capitale.id}`} className="link link-hover">{capitale.title}</a>
                            </InfoLine>
                        ) : null}
                        <InfoLine icon={civilisation.is_public ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}>
                            {civilisation.is_public ? "Civilisation publique" : "Civilisation privée"}
                        </InfoLine>
                    </div>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                    <Stat icon="fa-solid fa-users" label={members.length > 1 ? "Membres" : "Membre"} value={members.length} />
                    <Stat icon="fa-solid fa-city" label={villes.length > 1 ? "Villes" : "Ville"} value={villes.length} />
                    <Stat icon="fa-solid fa-people-group" label="Population" value={population.toLocaleString('fr-FR')} />
                    <Stat icon="fa-solid fa-book" label={livres.length > 1 ? "Livres" : "Livre"} value={livres.length} />
                </div>

                <div className="flex flex-col gap-2">
                    <span className="flex flex-row items-center gap-2 font-bold">
                        <FontAwesomeIcon icon="fas fa-pen-nib" />
                        <span>Description</span>
                    </span>
                    <MarkdownTextEditor value={civilisation.description || 'Aucune description'} />
                </div>
            </div>

            <TitleH2 text={gouvernement?.title || "Gouvernement"} icon="fas fa-landmark" fonctions={gouvernement ? FctGouvernement : []} />
            {gouvernement ? (
                <div className="flex flex-col gap-3 w-full bg-base-200 rounded-3xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <GouvernementTile icon="fa-solid fa-scale-balanced" label="Régime" value={gouvernement.type} />
                        <GouvernementTile icon="fa-solid fa-quote-left" label="Devise" value={gouvernement.devise} />
                        <GouvernementTile icon="fa-solid fa-music" label="Hymne" value={gouvernement.hymne} />
                    </div>
                    {gouvernement.description ? <p className="px-1 break-words">{gouvernement.description}</p> : null}
                </div>
            ) : (
                <i className="w-full">Cette civilisation n'a pas de gouvernement.</i>
            )}

            <TitleH2 text="Membres" icon="fas fa-users" fonctions={FctMembers} />
            <div className="flex flex-row flex-wrap gap-2 w-full">
                {sortedMembers.length > 0 ? (
                    sortedMembers.map((member) => (
                        <MemberButton
                            key={member.user_id}
                            member={member}
                            // Fondateur : transfert par lui-même ou un administrateur du site ; autres membres : Fondateur / Admin
                            auth={member.role === "Fondateur" ? (member.user_id === user?.id || Boolean(user?.is_admin)) : auth}
                            onDelete={handleMemberDelete}
                            onModifyMember={handleMemberModify}
                            onTransfer={() => showModalID(TRANSFER_MODAL_ID)}
                        />
                    ))
                ) : (
                    <i>Aucun membre pour cette civilisation.</i>
                )}
            </div>
            <JoinHint members={members} entity="cette civilisation" />

            <ConflictsSection entityType="civilisation" entityId={civilisation.id} />

            <ResidentsSection type="civilisation" id={civilisation.id} />

            <TitleH2 text="Villes" icon="fas fa-city" fonctions={FctVilles} />
            {villes.length === 0 ? (
                <i className="w-full">Cette civilisation n'a encore aucune ville.</i>
            ) : (
                <VillesList villes={villes} civilisationId={civilisation.id} dimensions={dimensions} auth={auth} />
            )}

            {dirigees.length > 0 ? (
                <>
                    <TitleH2 text="Civilisations dirigées" icon="fas fa-flag-checkered" />
                    <div className="flex flex-col gap-4 w-full">
                        {dirigees.map(({ civilisation: dirigee, villes: villesDirigee }) => (
                            <div key={dirigee.id} className="flex flex-col gap-2 w-full">
                                <a href={`/civilisation/${dirigee.id}`} className="flex flex-row flex-wrap items-center gap-2 px-2 font-bold hover:underline">
                                    <FontAwesomeIcon icon="fa-solid fa-flag" />
                                    <span>{dirigee.title}</span>
                                    <span className="font-normal text-sm opacity-70">· {plural(villesDirigee.length, "ville")}</span>
                                </a>
                                {villesDirigee.length === 0 ? (
                                    <i className="px-2 text-sm opacity-70">Aucune ville.</i>
                                ) : (
                                    <VillesList villes={villesDirigee} civilisationId={dirigee.id} dimensions={dimensions} />
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : null}

            <TitleH2 text="Livres" icon="fas fa-book" fonctions={FctLivres} />
            {livres.length === 0 ? (
                <i className="w-full">Aucun livre disponible.</i>
            ) : <EtagereLivres books={livres} text='livre(s)' />}
        </>
    ) : null;

    return (
        <>
            <Navbar active="civilisations" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !civilisation ? (
                        <>
                            <TitleH1 text="Civilisation introuvable" icon="fas fa-flag" btn={btnReturn} />
                            <p>Cette civilisation n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    <DynamicModal config={Config_Modal_Civilisation} mode="edit" onSubmit={updateCivilisation} onDelete={() => navigate('/civilisations')} />
                    <DynamicModal config={Config_Modal_Civilisation_Member} mode="add" onSubmit={addMember} />
                    <TransferFounderModal id={TRANSFER_MODAL_ID} entity="civilisation" entityId={id} members={members} onTransfer={updateMembers} />
                    <DynamicModal config={Config_Modal_Gouvernement} mode="edit" onSubmit={updateGouvernement} onDelete={() => setGouvernement(null)} />

                    <DynamicModal config={Config_Modal_Livre} mode="add" onSubmit={(livre) => setLivres((prev) => [...prev, livre])} />
                    <DynamicModal config={Config_Modal_Ville} mode="add" onSubmit={(ville) => setVilles((prev) => [...prev, ville])} />
                </div>
            </main>
        </>
    );
}
