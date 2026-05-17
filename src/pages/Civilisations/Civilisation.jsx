import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { getData } from "../../components/Functions/getData";
import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Sections/Skeleton";
import TitleH1 from "../../components/Sections/TitleH1";
import TitleH2 from "../../components/Sections/TitleH2";
import UserButton from "../../components/Buttons/UserButton";
import DynamicModal from '../../components/Modals/DynamicModal';

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Civilisation } from '../../components/Modals/Config_Modal_Civilisation';

export default function CivilisationPage() {
    const { id } = useParams();
    const navigate = useNavigate()
    const [data, setData] = useState(null);
    const [civilisation, setCivilisation] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/civilisations/read/${id}`);

                if (!response.ok) {
                    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                // console.log('Data fetched:', data);
                setData(data);
                setCivilisation(data.civilisation ? data.civilisation : null);
            } catch (err) {
                console.error(err);
                setData(null);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const updateCivilisation = (data) => {
        // console.log("Civilisation mise à jour:", data);
        setCivilisation(data.civilisation ? data.civilisation : null);
    };

    const handleDelete = () => {
        navigate('/civilisations');
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-wrench", class: "bg-base-200 hover:bg-base-300", connected: true, function: () => showModal(Config_Modal_Civilisation, "edit") }
    ];

    const btnReturn = { text: 'Retour aux civilisations', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/civilisations' };

    let BodyHTML = (
        <>
            <TitleH1 text={civilisation ? civilisation.title : "Civilisation inconnue"} btn={btnReturn} />
            <TitleH2 text="Membres" />
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

            {civilisation && civilisation.description ? (
                <>
                    <TitleH2 text="Description" fonctions={FctModify} />
                    <p className="flex flex-row gap-4 w-full">{civilisation.description}</p>
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
                </div>
            </main>
        </>
    );
}
