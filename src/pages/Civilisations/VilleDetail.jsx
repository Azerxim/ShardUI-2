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
import VilleReligions from "../../components/Objects/VilleReligions";
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
import { openMapEditor } from "../../services/mapEditor";
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

    const openFrontieresEditor = () => {
        if (!dimension) {
            Swal.fire({ icon: "error", title: "Oops...", text: "La dimension de cette ville est inconnue." });
            return;
        }
        openMapEditor({ dimension, type: "ville", id: ville.id, x: ville.x, z: ville.z });
    };

    const FctModify = [
        { id: 1, title: "Frontières", icon: "fas fa-draw-polygon", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: openFrontieresEditor },
        { id: 2, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Ville, "edit") }
    ];

    const FctReligions = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModalID("ville-religion-add-modal") }
    ];

    const btnReturn = { text: 'Retour à la civilisation', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: `/civilisation/${civ_id}` };

    const infos = ville ? [
        { label: "Civilisation", icon: "fas fa-flag", value: civilisation ? civilisation.title : 'Inconnue' },
        {
            label: "Fondation", icon: "fas fa-calendar", value: ville.founded_date ? new Date(ville.founded_date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Inconnue'
        },
        { label: "Type", icon: "fas fa-star", value: ville.is_capital ? 'Capitale' : 'Ville ou Village' },
        { label: "Population", icon: "fas fa-users", value: ville.population }
    ] : [];

    const BodyHTML = ville ? (
        <div className="flex flex-col gap-4 w-full">
            <TitleH1 text={ville.title} icon={`fas fa-${ville?.is_capital ? 'archway' : 'city'}`} btn={btnReturn} fonctions={FctModify} />
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-2 w-full">
                {/* Carte : pleine largeur sous le titre sur mobile, colonne fixe à gauche sur grand écran */}
                <div className="w-full h-72 sm:h-96 lg:w-[400px] lg:h-[600px] shrink-0 lg:sticky lg:top-4">
                    <MapEmbed
                        dimension={dimension}
                        width="100%"
                        height="100%"
                        embed="civilisations"
                        x={ville.x}
                        z={ville.z}
                        zoom={0}
                        title={`Carte de ${ville.title}`}
                    />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {infos.map((info) => (
                        <div key={info.label} className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:items-center">
                            <div className="sm:flex-1">
                                <TitleH2 text={info.label} icon={info.icon} />
                            </div>
                            <span className="sm:flex-1 px-4 sm:px-0 break-words">{info.value}</span>
                        </div>
                    ))}
                    <TitleH2 text="Religions" icon="fas fa-praying-hands" fonctions={FctReligions} />
                    <VilleReligions
                        religions={religions}
                        ville={ville}
                        auth={auth}
                        onModify={(data) => { updateReligion(data) }}
                        onDelete={(data) => { deleteReligion(data) }}
                    />
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
                    <VilleReligionAddModal id="ville-religion-add-modal" ville_id={id} ville_religion_list={religions} onSubmit={(data) => { addReligion(data) }} />
                    
                </div>
            </main>
        </>
    );
}
