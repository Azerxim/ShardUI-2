import { useState, useEffect } from "react";
import { checkMemberAuth } from "../../services/authorisation";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import TitleH3 from "../../components/Objects/TitleH3";
import UserButton from "../../components/Buttons/UserButton";
import MemberButton from "../../components/Buttons/MemberButton";
import DynamicModal from '../../components/Modals/DynamicModal';
import EtagereLivres from "../../components/Objects/EtagereLivres";
import Ville from "../../components/Objects/Ville";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Civilisation } from '../../components/Modals/Config_Modal_Civilisation';
import { Config_Modal_Gouvernement } from '../../components/Modals/Config_Modal_Gouvernement';
import { Config_Modal_Civilisation_Member } from '../../components/Modals/Config_Modal_Civilisation_Member';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { Config_Modal_Ville } from '../../components/Modals/Config_Modal_Ville';
import {
    getCivilisationById,
    getDimensions,
    getLivresBycivilisationId,
    deleteMemberCivilisation
} from "../../services/api"
import Swal from "sweetalert2";

export default function CivilisationPage() {
    const { id } = useParams();
    const navigate = useNavigate()
    const [dimensions, setDimensions] = useState(null);
    const [data, setData] = useState(null);
    const [civilisation, setCivilisation] = useState(null);
    const [gouvernement, setGouvernement] = useState(null);
    const [livres, setLivres] = useState([]);
    const [villes, setVilles] = useState([]);
    const [auth, setAuth] = useState(false);
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

    useEffect(() => {
        getCivilisationById(id)
            .then((data) => {
                // console.log('Civilisation fetched:', data);
                setData(data);
                setCivilisation(data.civilisation ? data.civilisation : null);
                setGouvernement(data.gouvernement ? data.gouvernement : null);
                setVilles(data.villes ? data.villes : []);
                checkMemberAuth(data ? data.members : [], setAuth);
                getDimensions()
                    .then((dimensions) => {
                        // console.log('Dimensions fetched:', dimensions);
                        setDimensions(dimensions);
                    })
                    .catch((error) => {
                        console.error('Error fetching dimensions:', error);
                        setDimensions(null);
                    });
            })
            .catch((error) => {
                console.error('Error fetching civilisation:', error);
                setData(null);
                setCivilisation(null);
                setGouvernement(null);
                setVilles([]);
            });
    }, [id, auth]);

    useEffect(() => {
        getLivresBycivilisationId(id)
            .then((data) => {
                // console.log('Livres fetched:', data);
                setLivres(data);
            })
            .catch((error) => {
                console.error('Error fetching livres:', error);
                setLivres([]);
            });
    }, []);

    const updateCivilisation = (data) => {
        // console.log("Civilisation mise à jour:", data);
        setCivilisation(data.civilisation ? data.civilisation : null);
    };

    const handleDelete = () => {
        navigate('/civilisations');
    };

    const updateGouvernement = (data) => {
        // console.log("Gouvernement mis à jour:", data);
        setGouvernement(data.gouvernement ? data.gouvernement : null);
    };

    const handleGouvernementDelete = () => {
        setGouvernement(null);
    };

    const addCivilisationMember = (data) => {
        console.log("Membre de la civilisation ajouté:", data);
        const member = data.member ? data.member : null;
        setData((prevData) => ({
            ...prevData,
            members: [...prevData.members, member],
        }));
    };

    const handleMemberModify = (data) => {
        console.log("Membre de la civilisation modifié:", data);
        const updatedMember = data.member ? data.member : null;
        setData((prevData) => ({
            ...prevData,
            members: prevData.members.map((member) =>
                member.user_id === updatedMember.user_id ? updatedMember : member
            ),
        }));
        checkMemberAuth(data ? data.members : [], setAuth);
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

        await deleteMemberCivilisation(id, member.user_id)
            .then((response) => {
                // console.log("Membre supprimé de la civilisation:", response);
                setData((prevData) => ({
                    ...prevData,
                    members: prevData.members.filter((m) => m.user_id !== member.user_id),
                }));

                Swal.fire({
                    icon: "success",
                    title: "Succès",
                    text: "Membre supprimé de la civilisation avec succès.",
                });
            })
            .catch((error) => {
                console.error("Erreur lors de la suppression du membre:", error);
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Erreur lors de la suppression du membre.",
                });
                throw error;
            });
    };

    const updateLivres = (livre) => {
        setLivres((prevLivres) => [...prevLivres, livre]);
    };

    const updateVilles = (ville) => {
        setVilles((prevVilles) => [...prevVilles, ville]);
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Civilisation, "edit") }
    ];

    const FctGouvernement = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Gouvernement, "edit") }
    ];

    const FctMembers = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Civilisation_Member, "add") }
    ];

    const livres_fonctions = [
        { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Livre, "add") }
    ];

    const villes_fonctions = [
        { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Ville, "add") }
    ];

    const btnReturn = { text: 'Retour aux civilisations', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/civilisations' };

    const date_founded = civilisation && civilisation.date_founded ? `: ${new Date(civilisation.date_founded).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}` : '';

    let BodyHTML = (
        <>
            <TitleH1 text={civilisation ? civilisation.title : "Civilisation inconnue"} btn={btnReturn} fonctions={FctModify} />
            <TitleH2 text="Membres" icon="fas fa-users" fonctions={FctMembers} />
            <div className="flex flex-row gap-4 w-full">
                {data && data.members && data.members.length > 0 ? (
                    data.members.map((member) => {
                        return member.role == "Fondateur" ? (
                            <MemberButton key={member.user_id} member={member} auth={(member.user_id == user?.id) ? true : false} onDelete={handleMemberDelete} onModifyMember={handleMemberModify} />
                        ) : (
                            <MemberButton key={member.user_id} member={member} auth={auth} onDelete={handleMemberDelete} onModifyMember={handleMemberModify} />
                        )
                    })
                ) : data && data.members ? (
                    <p>Aucun membre trouvé pour cette civilisation.</p>
                ) : (
                    <p>Impossible de charger les membres de cette civilisation.</p>
                )}
            </div>

            {civilisation && civilisation.date_founded ? (
                <>
                    <TitleH2 text={`Date de fondation ${date_founded}`} icon="fas fa-calendar" />
                </>
            ) : null}

            {civilisation && civilisation.description ? (
                <>
                    <TitleH2 text="Description" icon="fas fa-pen-nib" />
                    <div className="flex flex-col gap-2 w-full bg-base-100 p-4 rounded-2xl">
                        <p className="flex flex-row gap-4 w-full">{civilisation.description}</p>
                    </div>
                </>
            ) : null}

            {gouvernement ? (
                <>
                    <TitleH2 text={`${gouvernement.title ? gouvernement.title : "Gouvernement"}`} icon="fas fa-landmark" fonctions={FctGouvernement} />
                    {gouvernement.type ? (
                        <div className="flex flex-col gap-2 w-full bg-base-100 p-4 rounded-2xl">
                            {gouvernement.type ? (
                                <p className="flex flex-row gap-4 w-full">Type: {gouvernement.type}</p>
                            ) : null}
                            {gouvernement.description ? (
                                <p className="flex flex-row gap-4 w-full">Description: {gouvernement.description}</p>
                            ) : null}
                            {gouvernement.devise ? (
                                <p className="flex flex-row gap-4 w-full">Devise: {gouvernement.devise}</p>
                            ) : null}
                            {gouvernement.hymne ? (
                                <p className="flex flex-row gap-4 w-full">Hymne: {gouvernement.hymne}</p>
                            ) : null}
                        </div>
                    ) : null}
                </>
            ) : null}

            <TitleH2 text="Villes" fonctions={villes_fonctions} icon="fas fa-city" />
            {villes.length === 0 ? (
                <div style={{ width: '100%' }}>
                    <i>Aucune ville disponible.</i>
                </div>
            ) : (
                <div className="flex flex-col gap-2 w-full bg-base-100 rounded-2xl">
                    {villes.map((ville) => (
                        <a href={`/civilisation/${civilisation.id}/ville/${ville.id}`}>
                            <Ville key={ville.id} info={ville} dimensions={dimensions} auth={auth} />
                        </a>
                    ))}
                </div>
            )}

            <TitleH2 text="Livres" fonctions={livres_fonctions} icon="fas fa-book" />
            {livres.length === 0 ? (
                <div style={{ width: '100%' }}>
                    <i>Aucun livre disponible.</i>
                </div>
            ) : <EtagereLivres books={livres} text='livre(s)' />}
        </>
    );

    return (
        <>
            <Navbar active="civilisations" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {!data ? <Skeleton width="200px" height="32px" /> : BodyHTML}

                    <DynamicModal config={Config_Modal_Civilisation} mode="edit" onSubmit={(civilisation) => { updateCivilisation(civilisation) }} onDelete={handleDelete} />
                    <DynamicModal config={Config_Modal_Civilisation_Member} mode="add" onSubmit={(member) => { addCivilisationMember(member) }} />
                    <DynamicModal config={Config_Modal_Gouvernement} mode="edit" onSubmit={(gouvernement) => { updateGouvernement(gouvernement) }} onDelete={handleGouvernementDelete} />

                    <DynamicModal config={Config_Modal_Livre} mode="add" onSubmit={(livre) => { updateLivres(livre) }} />
                    <DynamicModal config={Config_Modal_Ville} mode="add" onSubmit={(ville) => { updateVilles(ville) }} />
                </div>
            </main>
        </>
    );
}
