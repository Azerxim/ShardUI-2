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
import MapEmbed from "../../components/Objects/MapEmbed";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";
import DynamicModal from '../../components/Modals/DynamicModal';
import VilleReligionAddModal from '../../components/Modals/VilleReligionAddModal';

import { checkMemberAuth } from "../../services/authorisation";
import { getSessionUser } from "../../services/session";
import { showModal, showModalID } from '../../components/Functions/showModal';
import { Config_Modal_Ville } from '../../components/Modals/Config_Modal_Ville';
import { Config_Modal_Quartier } from '../../components/Modals/Config_Modal_Quartier';
import {
    getCivilisationById,
    getCommerces,
    getDimensions,
    getQuartiersByVille
} from "../../services/api"
import { openMapEditor } from "../../services/mapEditor";

const RELIGION_ADD_MODAL_ID = "ville-religion-add-modal";

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
const formatPopulation = (value) => Number(value) > 0 ? Number(value).toLocaleString('fr-FR') : "—";
const villeIcon = (ville) => `fa-solid fa-${ville?.is_capital ? 'archway' : 'city'}`;

// Capitale d'abord, puis ordre alphabétique
const sortVilles = (list) => [...list].sort((a, b) => Number(Boolean(b.is_capital)) - Number(Boolean(a.is_capital)) || a.title.localeCompare(b.title));

// Module d'un quartier : informations à gauche, carte centrée sur le quartier à droite (dessous sur mobile).
// La carte n'est pas dans un lien : on navigue par le titre ou le bouton.
function QuartierCard({ quartier, ville, dimension }) {
    const founded = formatDate(quartier.founded_date);
    const x = quartier.x ?? ville?.x ?? 0;
    const z = quartier.z ?? ville?.z ?? 0;
    const href = `/quartier/${quartier.id}`;

    return (
        <div className="flex flex-col lg:flex-row gap-4 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <a href={href} className="flex flex-row flex-wrap items-center gap-2 font-bold text-lg link link-hover">
                    <FontAwesomeIcon icon="fa-solid fa-map-location-dot" className="opacity-80" />
                    <span className="break-words">{quartier.title}</span>
                    {quartier.is_public === false ? <span className="badge badge-sm badge-warning">Privé</span> : null}
                </a>

                <div className="flex flex-col gap-1 text-sm">
                    <span className="flex flex-row items-center gap-2">
                        <FontAwesomeIcon icon="fa-solid fa-location-dot" className="opacity-70 w-4" />
                        <span className="tabular-nums">{dimension ? `${dimension.title} · ` : ""}X {x} · Z {z}</span>
                    </span>
                    {founded ? (
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-calendar" className="opacity-70 w-4" />
                            <span>Fondé le {founded}</span>
                        </span>
                    ) : null}
                </div>

                {quartier.description ? <p className="break-words line-clamp-3">{quartier.description}</p> : null}

                <a href={href} className="btn btn-sm btn-ghost bg-base-100 self-start mt-auto">
                    Voir le quartier
                    <FontAwesomeIcon icon="fa-solid fa-chevron-right" />
                </a>
            </div>

            {dimension ? (
                <div className="w-full h-48 sm:h-56 lg:w-[360px] shrink-0">
                    <MapEmbed
                        dimension={dimension}
                        width="100%"
                        height="100%"
                        embed="civilisations"
                        x={x}
                        z={z}
                        zoom={1}
                        title={`Carte de ${quartier.title}`}
                    />
                </div>
            ) : null}
        </div>
    );
}

function MagasinLink({ magasin, commerce }) {
    return (
        <a href={`/commerce/${commerce.id}`} className="flex flex-row items-center gap-3 w-full bg-base-200 hover:bg-base-300 transition-colors rounded-2xl p-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-base-100 shrink-0">
                <FontAwesomeIcon icon={magasin.is_siege ? "fa-solid fa-building" : "fa-solid fa-store"} />
            </span>
            <span className="flex flex-col flex-1 min-w-0">
                <span className="flex flex-row flex-wrap items-center gap-2 font-bold">
                    <span className="break-words">{magasin.title}</span>
                    {magasin.is_siege ? <span className="badge badge-sm badge-primary">Siège</span> : null}
                </span>
                <span className="text-sm opacity-70 truncate">{commerce.title}</span>
            </span>
            <FontAwesomeIcon icon="fa-solid fa-chevron-right" className="opacity-50" />
        </a>
    );
}

export default function VilleDetailPage() {
    const { civ_id, id } = useParams();
    const villeId = parseInt(id);
    const navigate = useNavigate();
    const user = getSessionUser();
    const [civilisation, setCivilisation] = useState(null);
    const [members, setMembers] = useState([]);
    const [villes, setVilles] = useState([]);
    const [ville, setVille] = useState(null);
    const [religions, setReligions] = useState([]);
    const [quartiers, setQuartiers] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [loading, setLoading] = useState(true);

    // La ville et ses religions viennent de la fiche de sa civilisation
    useEffect(() => {
        getCivilisationById(civ_id)
            .then((data) => {
                const found = (data.villes ?? []).find((item) => item.id === villeId) ?? null;
                setCivilisation(data.civilisation ?? null);
                setMembers(data.members ?? []);
                setVilles(data.villes ?? []);
                setVille(found);
                setReligions(found?.religions ?? []);
            })
            .catch((error) => {
                console.error('Error fetching ville:', error);
                setVille(null);
            })
            .finally(() => setLoading(false));
    }, [civ_id, villeId]);

    // Données complémentaires : leur échec n'empêche pas l'affichage de la page
    useEffect(() => {
        getDimensions()
            .then((list) => setDimensions(Array.isArray(list) ? list : []))
            .catch((error) => console.error('Error fetching dimensions:', error));
        getQuartiersByVille(villeId)
            .then((list) => setQuartiers(Array.isArray(list) ? list : []))
            .catch((error) => console.error('Error fetching quartiers:', error));
        getCommerces()
            .then((list) => setMagasins((Array.isArray(list) ? list : []).flatMap(({ commerce, magasins: items }) => (items || [])
                .filter((magasin) => magasin.ville_id === villeId)
                .map((magasin) => ({ magasin, commerce })))))
            .catch((error) => console.error('Error fetching commerces:', error));
    }, [villeId]);

    const auth = checkMemberAuth(members);
    const isMember = Boolean(user && members.some((member) => member.user_id === user.id));
    const canSeePrivate = auth || isMember;
    const hidden = ville && ville.is_public === false && !canSeePrivate;
    const dimension = dimensions.find((item) => item.id === ville?.dimension_id);

    const updateVille = (data) => {
        // PUT /villes/update renvoie la ville elle-même (GET /villes/id l'enveloppe dans { ville })
        const updated = data?.ville ?? (data?.id ? data : null);
        if (!updated) return;
        setVille((prev) => ({ ...prev, ...updated }));
        setVilles((prev) => prev.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
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

    const addQuartier = (data) => {
        const created = data?.quartier ?? (data?.id ? data : null);
        if (created) setQuartiers((prev) => [...prev, created]);
    };

    const openFrontieresEditor = () => {
        if (!dimension) {
            Swal.fire({ icon: "error", title: "Carte indisponible", text: "La dimension de cette ville est inconnue." });
            return;
        }
        openMapEditor({ dimension, type: "ville", id: ville.id, x: ville.x, z: ville.z });
    };

    const FctModify = [
        { id: 1, title: "Frontières", icon: "fas fa-draw-polygon", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: openFrontieresEditor },
        { id: 2, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Ville, "edit") }
    ];

    const FctReligions = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModalID(RELIGION_ADD_MODAL_ID) }
    ];

    const FctQuartiers = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, tooltip: { text: "Ajouter un quartier", position: "bottom" }, function: () => showModal(Config_Modal_Quartier, "add") }
    ];

    const btnReturn = { text: 'Retour à la civilisation', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: `/civilisation/${civ_id}` };

    const founded = formatDate(ville?.founded_date);
    const visibleQuartiers = quartiers.filter((quartier) => quartier.is_public !== false || canSeePrivate);
    const visibleMagasins = magasins
        .filter(({ magasin, commerce }) => magasin.is_public !== false && commerce.is_public !== false)
        .sort((a, b) => Number(Boolean(b.magasin.is_siege)) - Number(Boolean(a.magasin.is_siege)) || a.magasin.title.localeCompare(b.magasin.title));
    const autresVilles = sortVilles(villes.filter((item) => item.id !== villeId && (item.is_public !== false || canSeePrivate)));

    const BodyHTML = ville ? (
        <>
            <TitleH1 text={ville.title} icon={villeIcon(ville)} btn={btnReturn} fonctions={FctModify} />

            {/* En-tête : identité, chiffres clés, description et carte */}
            <div className="flex flex-col lg:flex-row gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <span className="flex items-center justify-center w-16 h-16 rounded-full text-2xl shrink-0 bg-base-300 shadow-md">
                            <FontAwesomeIcon icon={villeIcon(ville)} />
                        </span>
                        <div className="flex flex-col gap-1 min-w-0">
                            <InfoLine icon="fa-solid fa-flag">
                                Civilisation : {civilisation ? <a href={`/civilisation/${civilisation.id}`} className="link link-hover">{civilisation.title}</a> : "inconnue"}
                                {ville.is_capital ? <span className="badge badge-sm badge-primary ml-2 align-middle">Capitale</span> : null}
                            </InfoLine>
                            <InfoLine icon="fa-solid fa-calendar">
                                {founded ? `Fondée le ${founded}` : "Date de fondation inconnue"}
                            </InfoLine>
                            <InfoLine icon="fa-solid fa-location-dot">
                                <span className="tabular-nums">{dimension ? `${dimension.title} · ` : ""}X {ville.x ?? 0} · Z {ville.z ?? 0}</span>
                            </InfoLine>
                            <InfoLine icon={ville.is_public === false ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}>
                                {ville.is_public === false ? "Ville privée" : "Ville publique"}
                            </InfoLine>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
                        <Stat icon="fa-solid fa-people-group" label="Population" value={formatPopulation(ville.population)} />
                        <Stat icon="fa-solid fa-hands-praying" label={religions.length > 1 ? "Religions" : "Religion"} value={religions.length} />
                        <Stat icon="fa-solid fa-map-location-dot" label={visibleQuartiers.length > 1 ? "Quartiers" : "Quartier"} value={visibleQuartiers.length} />
                        <Stat icon="fa-solid fa-store" label={visibleMagasins.length > 1 ? "Magasins" : "Magasin"} value={visibleMagasins.length} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="flex flex-row items-center gap-2 font-bold">
                            <FontAwesomeIcon icon="fas fa-pen-nib" />
                            <span>Description</span>
                        </span>
                        <MarkdownTextEditor value={ville.description || 'Aucune description'} />
                    </div>
                </div>

                {dimension ? (
                    // Pleine largeur sous les informations sur mobile, colonne à droite sur grand écran
                    <div className="w-full h-64 sm:h-80 lg:w-[400px] lg:h-auto lg:min-h-80 shrink-0 rounded-2xl overflow-hidden">
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
                ) : null}
            </div>

            <TitleH2 text="Religions" icon="fas fa-hands-praying" fonctions={FctReligions} />
            <VilleReligions
                religions={religions}
                ville={ville}
                auth={auth}
                onModify={updateReligion}
                onDelete={deleteReligion}
            />

            <TitleH2 text="Quartiers" icon="fas fa-map-location-dot" fonctions={FctQuartiers} />
            {visibleQuartiers.length === 0 ? (
                <i className="w-full">Cette ville n'a pas encore de quartier.</i>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    {visibleQuartiers.map((quartier) => <QuartierCard key={quartier.id} quartier={quartier} ville={ville} dimension={dimension} />)}
                </div>
            )}

            <TitleH2 text="Commerces" icon="fas fa-shop" />
            {visibleMagasins.length === 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                    <i className="flex-1">Aucun commerce n'est encore implanté dans cette ville.</i>
                    <a href="/commerces" className="btn btn-sm btn-ghost bg-base-200 self-start sm:self-auto">
                        <FontAwesomeIcon icon="fa-solid fa-shop" />
                        Découvrir les commerces
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                    {visibleMagasins.map(({ magasin, commerce }) => <MagasinLink key={magasin.id} magasin={magasin} commerce={commerce} />)}
                </div>
            )}

            {autresVilles.length > 0 ? (
                <>
                    <TitleH2 text="Autres villes de la civilisation" icon="fas fa-city" />
                    <div className="flex flex-row flex-wrap gap-2 w-full">
                        {autresVilles.map((item) => (
                            <a key={item.id} href={`/civilisation/${civ_id}/ville/${item.id}`} className="flex flex-row items-center gap-2 bg-base-200 hover:bg-base-300 transition-colors rounded-full px-3 py-1.5">
                                <FontAwesomeIcon icon={villeIcon(item)} className="opacity-70" />
                                <span>{item.title}</span>
                                {item.is_capital ? <span className="badge badge-sm badge-ghost">Capitale</span> : null}
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
                    ) : !ville || hidden ? (
                        <>
                            <TitleH1 text="Ville introuvable" icon="fas fa-city" btn={btnReturn} />
                            <p>Cette ville n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    {auth && ville ? (
                        <>
                            <DynamicModal config={Config_Modal_Ville} mode="edit" onSubmit={updateVille} onDelete={() => navigate(`/civilisation/${civ_id}`)} />
                            <VilleReligionAddModal id={RELIGION_ADD_MODAL_ID} ville_id={id} ville_religion_list={religions} onSubmit={addReligion} />
                            <DynamicModal config={Config_Modal_Quartier} mode="add" onSubmit={addQuartier} />
                        </>
                    ) : null}
                </div>
            </main>
        </>
    );
}
