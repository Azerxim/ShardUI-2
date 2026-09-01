import { useState, useEffect } from "react";
import { checkMemberAuth } from "../../services/authorisation";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import UserButton from "../../components/Buttons/UserButton";
import DynamicModal from "../../components/Modals/DynamicModal";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Religion } from '../../components/Modals/Config_Modal_Religion';
import {
    getReligionById
} from "../../services/api"

export default function ReligionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [religion, setReligion] = useState(null);
    const [members, setMembers] = useState([]);
    const [villes, setVilles] = useState([]);
    const [quartiers, setQuartiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [auth, setAuth] = useState(false);

    useEffect(() => {
        getReligionById(id)
            .then((data) => {
                // console.log('Religion fetched:', data);
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
    }, [id]);

    const updateReligion = (data) => {
        // console.log("Religion mise à jour:", data);
        setReligion(data.religion ? data.religion : null);
    };

    const handleDelete = () => {
        navigate('/religions');
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Religion, "edit") }
    ];

    const btnReturn = { text: 'Retour aux religions', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/religions' };

    const date_founded = religion && religion.date_founded ? `: ${new Date(religion.date_founded).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}` : '';

    const influence = (lien) => lien && lien.influence != null ? `${lien.influence}%` : 'Influence inconnue';

    const BodyHTML = (
        <>
            <TitleH1 text={religion ? religion.title : "Religion inconnue"} icon="fa-solid fa-place-of-worship" btn={btnReturn} fonctions={FctModify} />

            <TitleH2 text="Membres" icon="fas fa-users" />
            <div className="flex flex-row flex-wrap gap-4 w-full">
                {members.length > 0 ? (
                    members.map((member) => (
                        <div key={member.user_id} className="tooltip tooltip-bottom w-min" data-tip={member.role}>
                            <UserButton userid={member.user_id} />
                        </div>
                    ))
                ) : (
                    <i>Aucun membre pour cette religion.</i>
                )}
            </div>

            {religion && religion.date_founded ? (
                <TitleH2 text={`Date de fondation ${date_founded}`} icon="fas fa-calendar" />
            ) : null}

            <TitleH2 text="Description" icon="fas fa-pen-nib" />
            <MarkdownTextEditor value={religion && religion.description ? religion.description : 'Aucune description'} />

            <TitleH2 text="Villes" icon="fas fa-city" />
            {villes.length === 0 ? (
                <div style={{ width: '100%' }}>
                    <i>Cette religion n'est présente dans aucune ville.</i>
                </div>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    {villes.map(({ ville, villes_religions }) => (
                        <a
                            key={ville.id}
                            href={ville.civilisation_id ? `/civilisation/${ville.civilisation_id}/ville/${ville.id}` : undefined}
                            className="flex flex-row gap-2 w-full justify-between items-center bg-base-200 p-4 rounded-2xl"
                        >
                            <div className="flex flex-row gap-2 items-center font-bold">
                                <FontAwesomeIcon icon={`fa-solid fa-${ville.is_capital ? 'archway' : 'city'}`} />
                                <span>{ville.title}</span>
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <FontAwesomeIcon icon="fa-solid fa-hands-praying" />
                                <span>{influence(villes_religions)}</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}

            {quartiers.length > 0 ? (
                <>
                    <TitleH2 text="Quartiers" icon="fas fa-map-location-dot" />
                    <div className="flex flex-col gap-2 w-full">
                        {quartiers.map(({ quartier, quartiers_religions }) => (
                            <div key={quartier.id} className="flex flex-row gap-2 w-full justify-between items-center bg-base-200 p-4 rounded-2xl">
                                <div className="flex flex-row gap-2 items-center font-bold">
                                    <FontAwesomeIcon icon="fa-solid fa-map-location-dot" />
                                    <span>{quartier.title}</span>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <FontAwesomeIcon icon="fa-solid fa-hands-praying" />
                                    <span>{influence(quartiers_religions)}</span>
                                </div>
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
                </div>
            </main>
        </>
    );
}
