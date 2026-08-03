import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { getData } from "../../components/Functions/getData";
import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Sections/Skeleton";
import TitleH1 from "../../components/Sections/TitleH1";
import TitleH2 from "../../components/Sections/TitleH2";
import TitleH3 from "../../components/Sections/TitleH3";
import UserButton from "../../components/Buttons/UserButton";
import DynamicModal from '../../components/Modals/DynamicModal';

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Civilisation } from '../../components/Modals/Config_Modal_Civilisation';
import { Config_Modal_Gouvernement } from '../../components/Modals/Config_Modal_Gouvernement';
import { Config_Modal_Civilisation_Member } from '../../components/Modals/Config_Modal_Civilisation_Member';
import { getApiURL } from "../../services/api"

export default function CivilisationPage() {
    const { id } = useParams();
    const navigate = useNavigate()
    const [data, setData] = useState(null);
    const [civilisation, setCivilisation] = useState(null);
    const [gouvernement, setGouvernement] = useState(null);
    const apiURL = getApiURL()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${apiURL}/civilisations/read/${id}`);

                if (!response.ok) {
                    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Data fetched:', data);
                setData(data);
                setCivilisation(data.civilisation ? data.civilisation : null);
                setGouvernement(data.gouvernement ? data.gouvernement : null);
            } catch (err) {
                console.error(err);
                setData(null);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, apiURL]);

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

    const updateCivilisationMember = (member) => {
        console.log("Membre de la civilisation mis à jour:", member);
    };

    const handleMemberDelete = () => {
        console.log("Membre de la civilisation supprimé");
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-wrench", class: "bg-base-200 hover:bg-base-300", connected: true, function: () => showModal(Config_Modal_Civilisation, "edit") }
    ];

    const FctGouvernement = [
        { id: 1, title: "Modifier", icon: "fas fa-wrench", class: "bg-base-200 hover:bg-base-300", connected: true, function: () => showModal(Config_Modal_Gouvernement, "edit") }
    ];

    const FctMembers = [
        // { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, function: () => showModal(Config_Modal_Civilisation_Member, "add") }
    ];

    const btnReturn = { text: 'Retour aux civilisations', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/civilisations' };

    let BodyHTML = (
        <>
            <TitleH1 text={civilisation ? civilisation.title : "Civilisation inconnue"} btn={btnReturn} fonctions={FctModify} />
            <TitleH2 text="Membres" icon="fas fa-users" fonctions={FctMembers} />
            <div className="flex flex-row gap-4 w-full">
                {data && data.members && data.members.length > 0 ? (
                    data.members.map((member) => {
                        if (member.role == "Admin") { return (""); } // Ignorer l'utilisateur avec le rôle "Admin"
                        if (member.role == "Fondateur") { return (<UserButton userid={member.user_id} />); }
                        return (<UserButton userid={member.user_id} />);
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
        </>
    );

    return (
        <>
            <Navbar active="civilisations" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {!data ? <Skeleton width="200px" height="32px" /> : BodyHTML}

                    <DynamicModal config={Config_Modal_Civilisation} mode="edit" onSubmit={(civilisation) => { updateCivilisation(civilisation) }} onDelete={handleDelete} />
                    {/* <DynamicModal config={Config_Modal_Civilisation_Member} mode="add" onSubmit={(member) => { updateCivilisationMember(member) }} onDelete={handleMemberDelete} /> */}
                    <DynamicModal config={Config_Modal_Gouvernement} mode="edit" onSubmit={(gouvernement) => { updateGouvernement(gouvernement) }} onDelete={handleGouvernementDelete} />
                </div>
            </main>
        </>
    );
}
