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
import ReligionButton from "../../components/Buttons/ReligionButton";
import DynamicModal from '../../components/Modals/DynamicModal';
import VilleReligionAddModal from '../../components/Modals/VilleReligionAddModal';
import EtagereLivres from "../../components/Objects/EtagereLivres";
import Ville from "../../components/Objects/Ville";
import MapEmbed from "../../components/Objects/MapEmbed";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";

import { showModal, showModalID } from '../../components/Functions/showModal';
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
    const [religions, setReligions] = useState([]);
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
                setReligions(data.villes && data.villes.find(v => v.id === parseInt(id)) ? data.villes.find(v => v.id === parseInt(id)).religions : []);
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
                setData(null);
                setCivilisation(null);
                setVille(null);
                setReligions([]);
                setDimensions(null);
            });
    }, []);

    const updateVille = (data) => {
        // console.log("Ville mise à jour:", data);
        setVille(data.ville ? data.ville : null);
    };

    const addReligion = (data) => {
        console.log("Religion ajoutée:", data);
        setReligions([...religions, data.religion]);
        setVille({
            ...ville,
            religions: [...religions, data.religion]
        });
    };

    const updateReligion = (data) => {
        console.log("Religion mise à jour:", data);
        setReligions(religions.map(religion => religion.id === data.religion.id ? data.religion : religion));
        setVille({
            ...ville,
            religions: religions.map(religion => religion.id === data.religion.id ? data.religion : religion)
        });
    };

    const deleteReligion = (data) => {
        console.log("Religion supprimée:", data);
        setReligions(religions.filter(religion => religion.id !== data.id));
        setVille({
            ...ville,
            religions: religions.filter(religion => religion.id !== data.id)
        });
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
                    <div className="flex flex-row gap-2 w-full justify-between items-center">
                        <div className="flex-1">
                            <TitleH2 text="Religions" icon="fas fa-praying-hands" />
                        </div>
                        <span className="flex flex-row items-center flex-1 gap-2">
                            {auth && (
                                <button className="btn btn-sm btn-primary rounded-3xl tooltip tooltip-left" data-tip="Ajouter une religion" onClick={() => { showModalID("ville-religion-add-modal") }}>
                                    <FontAwesomeIcon icon="fas fa-plus" />
                                </button>
                            )}
                            {religions.length > 0 ? religions.map(religion => <ReligionButton key={religion.id} religion={religion} ville={ville} auth={auth} onModify={(data) => { updateReligion(data) }} onDelete={(data) => { deleteReligion(data) }} />) : 'Aucune religion'}
                        </span>
                    </div>
                    <TitleH3 text="Description" icon="fas fa-info-circle" />
                    <MarkdownTextEditor value={ville.description ? ville.description : 'Aucune description'} />
                </div>
            </div>
        </div>
    ) : (
        <p>Ville non trouvée.</p>
    );

    // console.log(ville)

    return (
        <>
            <Navbar active="civilisations" />
            <main className="container mx-auto p-4">
                <div className="flex items-center justify-center gap-2">
                    {!ville ? null : BodyHTML}

                    <DynamicModal config={Config_Modal_Ville} mode="edit" onSubmit={(ville) => { updateVille(ville) }} onDelete={handleDelete} />
                    <VilleReligionAddModal id="ville-religion-add-modal" ville_id={id} onSubmit={(data) => { addReligion(data) }} />
                    
                </div>
            </main>
        </>
    );
}
