import { useState, useEffect } from "react";
import { checkMemberAuth } from "../../services/authorisation";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { getData } from "../../components/Functions/getData";
import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import TitleH3 from "../../components/Objects/TitleH3";
import UserButton from "../../components/Buttons/UserButton";
import MemberButton from "../../components/Buttons/MemberButton";
import DynamicModal from '../../components/Modals/DynamicModal';
import EtagereLivres from "../../components/Objects/EtagereLivres";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Civilisation } from '../../components/Modals/Config_Modal_Civilisation';
import { Config_Modal_Gouvernement } from '../../components/Modals/Config_Modal_Gouvernement';
import { Config_Modal_Civilisation_Member } from '../../components/Modals/Config_Modal_Civilisation_Member';
import { Config_Modal_Civilisation_Member_Edit } from '../../components/Modals/Config_Modal_Civilisation_Member_Edit';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { getApiURL } from "../../services/api"
import Swal from "sweetalert2";

export default function CivilisationPage() {
    const { id } = useParams();
    const navigate = useNavigate()
    const [data, setData] = useState(null);
    const [civilisation, setCivilisation] = useState(null);
    const [gouvernement, setGouvernement] = useState(null);
    const [livres, setLivres] = useState([]);
    const [auth, setAuth] = useState(false);
    const apiURL = getApiURL()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${apiURL}/civilisations/read/${id}`);

                if (!response.ok) {
                    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                // console.log('Data fetched:', data);
                setData(data);
                setCivilisation(data.civilisation ? data.civilisation : null);
                setGouvernement(data.gouvernement ? data.gouvernement : null);
                checkMemberAuth(data ? data.members : [], setAuth);
            } catch (err) {
                console.error(err);
                setData(null);
            }
        };

        if (id) {
            fetchData();
        }

    }, [id, apiURL, auth]);

    useEffect(() => {
        fetch(`${apiURL}/bibliotheque/livres/civilisation/${id}/list`)
            .then((response) => response.json())
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

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${apiURL}/civilisations/members/${id}/remove?member_id=${member.user_id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            setData((prevData) => ({
                ...prevData,
                members: prevData.members.filter((m) => m.user_id !== member.user_id),
            }));

            Swal.fire({
                icon: "success",
                title: "Succès",
                text: "Membre supprimé de la civilisation avec succès.",
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Erreur lors de la suppression du membre.",
            });
        }
    };

    const updateLivre = (livre) => {
        setLivres((prevLivres) => [...prevLivres, livre]);
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

    const btnReturn = { text: 'Retour aux civilisations', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/civilisations' };

    let BodyHTML = (
        <>
            <TitleH1 text={civilisation ? civilisation.title : "Civilisation inconnue"} btn={btnReturn} fonctions={FctModify} />
            <TitleH2 text="Membres" icon="fas fa-users" fonctions={FctMembers} />
            <div className="flex flex-row gap-4 w-full">
                {data && data.members && data.members.length > 0 ? (
                    data.members.map((member) => {
                        return (<MemberButton key={member.user_id} member={member} auth={auth} onDelete={handleMemberDelete} onModifyMember={handleMemberModify} />);
                    })
                ) : data && data.members ? (
                    <p>Aucun membre trouvé pour cette civilisation.</p>
                ) : (
                    <p>Impossible de charger les membres de cette civilisation.</p>
                )}
            </div>

            {civilisation && civilisation.date_founded ? (
                <>
                    <TitleH2 text="Date de fondation" icon="fas fa-calendar" />
                    <div className="flex flex-col gap-2 w-full bg-base-100 p-4 rounded-2xl">
                        <p className="flex flex-row gap-4 w-full">{civilisation.date_founded}</p>
                    </div>
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

                    <DynamicModal config={Config_Modal_Livre} mode="add" onSubmit={(livre) => { updateLivre(livre) }} />
                </div>
            </main>
        </>
    );
}
