import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import Stat from "../../components/Objects/Stat";
import InfoLine from "../../components/Objects/InfoLine";
import VilleReligions from "../../components/Objects/VilleReligions";
import ResidentsSection from "../../components/Objects/ResidentsSection";
import MapEmbed from "../../components/Objects/MapEmbed";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";
import DynamicModal from '../../components/Modals/DynamicModal';
import VilleReligionAddModal from '../../components/Modals/VilleReligionAddModal';

import { checkMemberAuth } from "../../services/authorisation";
import { getSessionUser } from "../../services/session";
import { showModal, showModalID } from '../../components/Functions/showModal';
import { Config_Modal_Quartier } from '../../components/Modals/Config_Modal_Quartier';
import {
    getCivilisationById,
    getDimensions,
    getQuartierById,
    getQuartiersByVille
} from "../../services/api"
import { openMapEditor } from "../../services/mapEditor";

const RELIGION_ADD_MODAL_ID = "quartier-religion-add-modal";

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

export default function QuartierDetailPage() {
    const { id } = useParams();
    const quartierId = parseInt(id);
    const navigate = useNavigate();
    const user = getSessionUser();
    const [quartier, setQuartier] = useState(null);
    const [ville, setVille] = useState(null);
    const [civilisation, setCivilisation] = useState(null);
    const [members, setMembers] = useState([]);
    const [religions, setReligions] = useState([]);
    const [voisins, setVoisins] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Quartier, ville et religions ; puis la civilisation (droits) et les autres quartiers de la ville
    useEffect(() => {
        let cancelled = false;

        getQuartierById(quartierId)
            .then(async (data) => {
                if (cancelled) return;
                setQuartier(data.quartier ?? null);
                setVille(data.ville ?? null);
                setReligions(data.religions ?? []);

                const [civ, list] = await Promise.all([
                    data.ville?.civilisation_id ? getCivilisationById(data.ville.civilisation_id).catch(() => null) : null,
                    data.quartier?.ville_id ? getQuartiersByVille(data.quartier.ville_id).catch(() => []) : [],
                ]);
                if (cancelled) return;
                setCivilisation(civ?.civilisation ?? null);
                setMembers(civ?.members ?? []);
                setVoisins(Array.isArray(list) ? list : []);
            })
            .catch((error) => {
                console.error('Error fetching quartier:', error);
                if (!cancelled) setQuartier(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [quartierId]);

    useEffect(() => {
        getDimensions()
            .then((list) => setDimensions(Array.isArray(list) ? list : []))
            .catch((error) => console.error('Error fetching dimensions:', error));
    }, []);

    // Mêmes droits que sur la ville : Fondateur / Admin de la civilisation, ou administrateur du site
    const auth = checkMemberAuth(members);
    const isMember = Boolean(user && members.some((member) => member.user_id === user.id));
    const canSeePrivate = auth || isMember;
    const hidden = quartier && (quartier.is_public === false || ville?.is_public === false) && !canSeePrivate;
    const dimension = dimensions.find((item) => item.id === ville?.dimension_id);

    const villeUrl = ville ? `/civilisation/${ville.civilisation_id}/ville/${ville.id}` : "/civilisations";

    const updateQuartier = (data) => {
        const updated = data?.quartier ?? (data?.id ? data : null);
        if (!updated) return;
        setQuartier((prev) => ({ ...prev, ...updated }));
        setVoisins((prev) => prev.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    };

    const addReligion = (data) => {
        if (data?.religion) setReligions((prev) => [...prev, data.religion]);
    };

    const updateReligion = (data) => {
        if (data?.religion) setReligions((prev) => prev.map((religion) => religion.id === data.religion.id ? data.religion : religion));
    };

    const deleteReligion = (religion) => {
        setReligions((prev) => prev.filter((item) => item.id !== religion.id));
    };

    const openFrontieresEditor = () => {
        if (!dimension) {
            Swal.fire({ icon: "error", title: "Carte indisponible", text: "La dimension de la ville de ce quartier est inconnue." });
            return;
        }
        openMapEditor({ dimension, type: "quartier", id: quartier.id, x: quartier.x ?? ville.x, z: quartier.z ?? ville.z });
    };

    const FctModify = [
        { id: 1, title: "Frontières", icon: "fas fa-draw-polygon", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: openFrontieresEditor },
        { id: 2, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Quartier, "edit") }
    ];

    const FctReligions = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModalID(RELIGION_ADD_MODAL_ID) }
    ];

    const btnReturn = { text: 'Retour à la ville', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: villeUrl };

    const founded = formatDate(quartier?.founded_date);
    const autresQuartiers = voisins
        .filter((item) => item.id !== quartierId && (item.is_public !== false || canSeePrivate))
        .sort((a, b) => a.title.localeCompare(b.title));

    const BodyHTML = quartier ? (
        <>
            <TitleH1 text={quartier.title} icon="fas fa-map-location-dot" btn={btnReturn} fonctions={FctModify} />

            {/* En-tête : identité, chiffres clés, description et carte */}
            <div className="flex flex-col lg:flex-row gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <span className="flex items-center justify-center w-16 h-16 rounded-full text-2xl shrink-0 bg-base-300 shadow-md">
                            <FontAwesomeIcon icon="fa-solid fa-map-location-dot" />
                        </span>
                        <div className="flex flex-col gap-1 min-w-0">
                            <InfoLine icon={`fa-solid fa-${ville?.is_capital ? 'archway' : 'city'}`}>
                                Ville : {ville ? <a href={villeUrl} className="link link-hover">{ville.title}</a> : "inconnue"}
                            </InfoLine>
                            <InfoLine icon="fa-solid fa-flag">
                                Civilisation : {civilisation ? <a href={`/civilisation/${civilisation.id}`} className="link link-hover">{civilisation.title}</a> : "inconnue"}
                            </InfoLine>
                            <InfoLine icon="fa-solid fa-calendar">
                                {founded ? `Fondé le ${founded}` : "Date de fondation inconnue"}
                            </InfoLine>
                            <InfoLine icon="fa-solid fa-location-dot">
                                <span className="tabular-nums">{dimension ? `${dimension.title} · ` : ""}X {quartier.x ?? 0} · Z {quartier.z ?? 0}</span>
                            </InfoLine>
                            <InfoLine icon={quartier.is_public === false ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}>
                                {quartier.is_public === false ? "Quartier privé" : "Quartier public"}
                            </InfoLine>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Stat icon="fa-solid fa-hands-praying" label={religions.length > 1 ? "Religions" : "Religion"} value={religions.length} />
                        <Stat icon="fa-solid fa-map-location-dot" label={autresQuartiers.length > 1 ? "Autres quartiers" : "Autre quartier"} value={autresQuartiers.length} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="flex flex-row items-center gap-2 font-bold">
                            <FontAwesomeIcon icon="fas fa-pen-nib" />
                            <span>Description</span>
                        </span>
                        <MarkdownTextEditor value={quartier.description || 'Aucune description'} />
                    </div>
                </div>

                {dimension ? (
                    <div className="w-full h-64 sm:h-80 lg:w-[400px] lg:h-auto lg:min-h-80 shrink-0 rounded-2xl overflow-hidden">
                        <MapEmbed
                            dimension={dimension}
                            width="100%"
                            height="100%"
                            embed="civilisations"
                            x={quartier.x ?? ville?.x}
                            z={quartier.z ?? ville?.z}
                            zoom={1}
                            title={`Carte de ${quartier.title}`}
                        />
                    </div>
                ) : null}
            </div>

            <TitleH2 text="Religions" icon="fas fa-hands-praying" fonctions={FctReligions} />
            <VilleReligions
                religions={religions}
                ville={quartier}
                scope="quartier"
                auth={auth}
                onModify={updateReligion}
                onDelete={deleteReligion}
            />

            <ResidentsSection type="quartier" id={quartier.id} />

            {autresQuartiers.length > 0 ? (
                <>
                    <TitleH2 text="Autres quartiers de la ville" icon="fas fa-map-location-dot" />
                    <div className="flex flex-row flex-wrap gap-2 w-full">
                        {autresQuartiers.map((item) => (
                            <a key={item.id} href={`/quartier/${item.id}`} className="flex flex-row items-center gap-2 bg-base-200 hover:bg-base-300 transition-colors rounded-full px-3 py-1.5">
                                <FontAwesomeIcon icon="fa-solid fa-map-location-dot" className="opacity-70" />
                                <span>{item.title}</span>
                            </a>
                        ))}
                    </div>
                </>
            ) : null}
        </>
    ) : null;

    return (
        <>
            <Navbar active="civilisations" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !quartier || hidden ? (
                        <>
                            <TitleH1 text="Quartier introuvable" icon="fas fa-map-location-dot" btn={btnReturn} />
                            <p>Ce quartier n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    {auth && quartier ? (
                        <>
                            <DynamicModal config={Config_Modal_Quartier} mode="edit" onSubmit={updateQuartier} onDelete={() => navigate(villeUrl)} />
                            <VilleReligionAddModal id={RELIGION_ADD_MODAL_ID} ville_id={quartierId} scope="quartier" ville_religion_list={religions} onSubmit={addReligion} />
                        </>
                    ) : null}
                </div>
            </main>
        </>
    );
}
