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
import Ville from "../../components/Objects/Ville";
import MapEmbed from "../../components/Objects/MapEmbed";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Civilisation } from '../../components/Modals/Config_Modal_Civilisation';
import { Config_Modal_Gouvernement } from '../../components/Modals/Config_Modal_Gouvernement';
import { Config_Modal_Civilisation_Member } from '../../components/Modals/Config_Modal_Civilisation_Member';
import { Config_Modal_Civilisation_Member_Edit } from '../../components/Modals/Config_Modal_Civilisation_Member_Edit';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { Config_Modal_Ville } from '../../components/Modals/Config_Modal_Ville';
import {
    getCivilisationById,
    getDimensions
} from "../../services/api"
import Swal from "sweetalert2";

export default function VilleDetailPage() {
    const { civ_id, id } = useParams();
    const navigate = useNavigate()
    const [dimensions, setDimensions] = useState(null);
    const [data, setData] = useState(null);
    const [ville, setVille] = useState(null);
    const [civilisation, setCivilisation] = useState(null);
    const [auth, setAuth] = useState(false);

    const dimension = dimensions ? dimensions.find(dim => dim.id === ville?.dimension_id) : null;

    useEffect(() => {
        getCivilisationById(civ_id)
            .then((data) => {
                // console.log('Civilisations fetched:', data);
                // Ajouter les liens pour redirection vers la page de détail
                setData(data);
                setCivilisation(data.civilisation ? data.civilisation : null);
                setVille(data.villes ? data.villes.find(v => v.id === parseInt(id)) : null);
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
                console.error('Error fetching civilisations:', error);
                setCivilisation(null);
                setVille(null);
            });
    }, []);

    const updateVille = (data) => {
        // console.log("Ville mise à jour:", data);
        setVille(data.ville ? data.ville : null);
    };

    const handleDelete = () => {
        navigate(`/civilisation/${civ_id}`);
    };

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Ville, "edit") }
    ];

    const btnReturn = { text: 'Retour à la civilisation', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: `/civilisation/${civ_id}` };

    const BodyHTML = ville ? (
        <div className="flex flex-col gap-4 w-full">
            <TitleH1 text={ville.title} icon={`fas fa-${ville?.is_capital ? 'archway' : 'city'}`} btn={btnReturn} fonctions={FctModify} />
            <div className="flex flex-row gap-2 w-full">
                <div className="hidden lg:flex">
                    <MapEmbed
                        dimension={dimension}
                        width={400}
                        height={600}
                        embed="civilisations"
                        x={ville.x}
                        z={ville.z}
                        zoom={0}
                        title={`Carte de ${ville.title}`}
                    />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex flex-row gap-2 w-full justify-between items-center">
                        <div className="flex-1">
                            <TitleH2 text="Civilisation" icon="fas fa-flag" />
                        </div>
                        <span className="flex-1">{civilisation ? civilisation.title : 'Inconnue'}</span>
                    </div>
                    <div className="flex flex-row gap-2 w-full justify-between items-center">
                        <div className="flex-1">
                            <TitleH2 text="Fondation" icon="fas fa-calendar" />
                        </div>
                        <span className="flex-1">
                            {ville.founded_date ? new Date(ville.founded_date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : 'Inconnue'}
                        </span>
                    </div>
                    <div className="flex flex-row gap-2 w-full justify-between items-center">
                        <div className="flex-1">
                            <TitleH2 text="Type" icon="fas fa-star" />
                        </div>
                        <span className="flex-1">{ville.is_capital ? 'Capitale' : 'Ville ou Village'}</span>
                    </div>
                    <div className="flex flex-row gap-2 w-full justify-between items-center">
                        <div className="flex-1">
                            <TitleH2 text="Population" icon="fas fa-users" />
                        </div>
                        <span className="flex-1">{ville.population}</span>
                    </div>
                    <TitleH3 text="Description" icon="fas fa-info-circle" />
                    <MarkdownTextEditor value={ville.description ? ville.description : 'Aucune description'} />
                </div>
            </div>
        </div>
    ) : (
        <p>Ville non trouvée.</p>
    );

    return (
        <>
            <Navbar active="civilisations" />
            <main className="container mx-auto p-4">
                <div className="flex items-center justify-center gap-2">
                    {!ville ? null : BodyHTML}

                    <DynamicModal config={Config_Modal_Ville} mode="edit" onSubmit={(ville) => { updateVille(ville) }} onDelete={handleDelete} />
                </div>
            </main>
        </>
    );
}
