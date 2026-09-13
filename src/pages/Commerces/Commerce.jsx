import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";
import TitleH1 from "../../components/Objects/TitleH1";
import TitleH2 from "../../components/Objects/TitleH2";
import DynamicModal from "../../components/Modals/DynamicModal";
import MarkdownTextEditor from "../../components/Objects/MarkdownTextEditor";
import MapEmbed from "../../components/Objects/MapEmbed";

import { showModal } from "../../components/Functions/showModal";
import { Config_Modal_Commerce } from "../../components/Modals/Config_Modal_Commerce";
import { Config_Modal_Magasin } from "../../components/Modals/Config_Modal_Magasin";
import { getCommerceById, getDimensions, getVilles } from "../../services/api";

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

function MagasinCard({ magasin, dimension, ville, auth }) {
    const opened = formatDate(magasin.founded_date);

    return (
        <div className="flex flex-col lg:flex-row gap-4 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-row items-start gap-3">
                    <FontAwesomeIcon icon={magasin.is_siege ? "fa-solid fa-building" : "fa-solid fa-store"} className="text-xl mt-1" />
                    <span className="flex flex-row flex-wrap items-center gap-2 flex-1 min-w-0 font-bold text-lg">
                        <span className="break-words">{magasin.title}</span>
                        {magasin.is_siege ? <span className="badge badge-sm badge-primary">Siège</span> : null}
                        {!magasin.is_public ? <span className="badge badge-sm badge-warning">Privé</span> : null}
                    </span>
                    {auth ? (
                        <button type="button" className="btn btn-sm btn-ghost btn-circle tooltip tooltip-left" data-tip="Modifier le magasin" onClick={() => showModal(Config_Modal_Magasin, "edit", { id: magasin.id })}>
                            <FontAwesomeIcon icon="fa-solid fa-pen" />
                        </button>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1 text-sm">
                    {ville ? (
                        <a href={`/civilisation/${ville.civilisation_id}/ville/${ville.id}`} className="flex flex-row items-center gap-2 link link-hover">
                            <FontAwesomeIcon icon={`fa-solid fa-${ville.is_capital ? 'archway' : 'city'}`} className="opacity-70 w-4" />
                            <span>{ville.title}</span>
                        </a>
                    ) : null}
                    {magasin.dimension_id ? (
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-location-dot" className="opacity-70 w-4" />
                            <span className="tabular-nums">{dimension ? `${dimension.title} · ` : ""}X {magasin.x ?? 0} · Z {magasin.z ?? 0}</span>
                        </span>
                    ) : null}
                    {opened ? (
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-calendar" className="opacity-70 w-4" />
                            <span>Ouvert le {opened}</span>
                        </span>
                    ) : null}
                </div>

                {magasin.description ? <p className="break-words">{magasin.description}</p> : null}
            </div>

            {dimension ? (
                <div className="w-full h-48 lg:w-[400px] shrink-0">
                    <MapEmbed
                        dimension={dimension}
                        width="100%"
                        height="100%"
                        embed="civilisations"
                        x={magasin.x}
                        z={magasin.z}
                        zoom={0}
                        title={`Carte de ${magasin.title}`}
                    />
                </div>
            ) : null}
        </div>
    );
}

export default function CommercePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [commerce, setCommerce] = useState(null);
    const [owner, setOwner] = useState(null);
    const [magasins, setMagasins] = useState([]);
    const [dirigeant, setDirigeant] = useState(null);
    const [diriges, setDiriges] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [villes, setVilles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        getCommerceById(id)
            .then((data) => {
                setCommerce(data.commerce ?? null);
                setOwner(data.owner ?? null);
                setMagasins(data.magasins ?? []);
                setDirigeant(data.dirigeant ?? null);
                setDiriges(data.diriges ?? []);
            })
            .catch((error) => {
                console.error("Error fetching commerce:", error);
                setCommerce(null);
            })
            .finally(() => setLoading(false));
    }, [id, reloadKey]);

    // Données complémentaires : leur échec n'empêche pas l'affichage de la page
    useEffect(() => {
        getDimensions()
            .then(setDimensions)
            .catch((error) => console.error("Error fetching dimensions:", error));
        getVilles()
            .then(setVilles)
            .catch((error) => console.error("Error fetching villes:", error));
    }, []);

    // Recharger après un ajout / une modification / une suppression de magasin (le siège peut changer)
    const reload = () => setReloadKey((key) => key + 1);

    const auth = Boolean(user && commerce && (user.is_admin || user.id === commerce.owner_id));
    const hidden = commerce && !commerce.is_public && !auth;

    const FctModify = [
        { id: 1, title: "Modifier", icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Commerce, "edit") }
    ];

    const FctMagasins = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Magasin, "add") }
    ];

    const btnReturn = { text: 'Retour aux commerces', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/commerces' };

    // Les magasins privés ne sont visibles que par le propriétaire et les administrateurs
    const visibleMagasins = magasins.filter((magasin) => magasin.is_public || auth);
    const siege = visibleMagasins.find((magasin) => magasin.is_siege);
    const villeSiege = siege ? villes.find((ville) => ville.id === siege.ville_id) : null;
    // Commerces dirigés privés : visibles par leur propriétaire et les administrateurs
    const visibleDiriges = diriges.filter(({ commerce: dirige }) => dirige.is_public || user?.is_admin || user?.id === dirige.owner_id);

    const BodyHTML = commerce ? (
        <>
            <TitleH1 text={commerce.title} icon="fas fa-shop" btn={btnReturn} fonctions={FctModify} />

            <div className="flex flex-col gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="flex items-center justify-center w-16 h-16 rounded-full text-2xl shrink-0 bg-base-300 shadow-md">
                        <FontAwesomeIcon icon="fa-solid fa-shop" />
                    </span>
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-user" className="opacity-70 w-4" />
                            {owner ? (
                                <a href={`/profil/${owner.id}`} className="link link-hover truncate">{owner.full_name || owner.username}</a>
                            ) : <span>Propriétaire inconnu</span>}
                        </span>
                        {dirigeant ? (
                            <span className="flex flex-row items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-crown" className="opacity-70 w-4" />
                                <span>Dirigé par <a href={`/commerce/${dirigeant.id}`} className="link link-hover">{dirigeant.title}</a></span>
                            </span>
                        ) : null}
                        <span className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon={commerce.is_public ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} className="opacity-70 w-4" />
                            <span>{commerce.is_public ? "Commerce public" : "Commerce privé"}</span>
                        </span>
                        {commerce.created_at ? (
                            <span className="flex flex-row items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-calendar" className="opacity-70 w-4" />
                                <span>Créé le {formatDate(commerce.created_at)}</span>
                            </span>
                        ) : null}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-row items-center gap-3 bg-base-100 rounded-2xl p-3">
                        <FontAwesomeIcon icon="fa-solid fa-store" className="text-xl" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl font-bold tabular-nums">{visibleMagasins.length}</span>
                            <span className="text-sm opacity-70">{visibleMagasins.length > 1 ? "Magasins" : "Magasin"}</span>
                        </div>
                    </div>
                    <div className="flex flex-row items-center gap-3 bg-base-100 rounded-2xl p-3">
                        <FontAwesomeIcon icon="fa-solid fa-building" className="text-xl" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl font-bold truncate">{siege ? siege.title : "—"}</span>
                            <span className="text-sm opacity-70 truncate">{villeSiege ? `Siège · ${villeSiege.title}` : "Siège"}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="flex flex-row items-center gap-2 font-bold">
                        <FontAwesomeIcon icon="fas fa-pen-nib" />
                        <span>Description</span>
                    </span>
                    <MarkdownTextEditor value={commerce.description ? commerce.description : 'Aucune description'} />
                </div>
            </div>

            <TitleH2 text="Magasins" icon="fas fa-store" fonctions={FctMagasins} />
            {visibleMagasins.length === 0 ? (
                <div className="w-full">
                    <i>Ce commerce n'a encore aucun magasin.</i>
                </div>
            ) : (
                <div className="flex flex-col gap-2 w-full">
                    {visibleMagasins.map((magasin) => (
                        <MagasinCard
                            key={magasin.id}
                            magasin={magasin}
                            dimension={dimensions.find((dimension) => dimension.id === magasin.dimension_id)}
                            ville={villes.find((ville) => ville.id === magasin.ville_id)}
                            auth={auth}
                        />
                    ))}
                </div>
            )}

            {visibleDiriges.length > 0 ? (
                <>
                    <TitleH2 text="Commerces dirigés" icon="fas fa-crown" />
                    <div className="flex flex-col gap-4 w-full">
                        {visibleDiriges.map(({ commerce: dirige, owner: dirigeOwner, magasins: dirigeMagasins }) => {
                            const dirigeAuth = Boolean(user && (user.is_admin || user.id === dirige.owner_id));
                            const dirigeVisibleMagasins = (dirigeMagasins || []).filter((magasin) => magasin.is_public || dirigeAuth);
                            return (
                                <div key={dirige.id} className="flex flex-col gap-2 w-full">
                                    <a href={`/commerce/${dirige.id}`} className="flex flex-row flex-wrap items-center gap-2 px-2 font-bold hover:underline">
                                        <FontAwesomeIcon icon="fa-solid fa-shop" />
                                        <span>{dirige.title}</span>
                                        {dirigeOwner ? <span className="font-normal text-sm opacity-70">· {dirigeOwner.full_name || dirigeOwner.username}</span> : null}
                                    </a>
                                    {dirigeVisibleMagasins.length === 0 ? (
                                        <i className="px-2 text-sm opacity-70">Aucun magasin.</i>
                                    ) : dirigeVisibleMagasins.map((magasin) => (
                                        <MagasinCard
                                            key={magasin.id}
                                            magasin={magasin}
                                            dimension={dimensions.find((dimension) => dimension.id === magasin.dimension_id)}
                                            ville={villes.find((ville) => ville.id === magasin.ville_id)}
                                            auth={false}
                                        />
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : null}
        </>
    ) : null;

    return (
        <>
            <Navbar active="commerces" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !commerce || hidden ? (
                        <>
                            <TitleH1 text="Commerce introuvable" icon="fas fa-shop" btn={btnReturn} />
                            <p>Ce commerce n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    {auth ? (
                        <>
                            <DynamicModal config={Config_Modal_Commerce} mode="edit" onSubmit={(data) => setCommerce(data.commerce ?? commerce)} onDelete={() => navigate('/commerces')} />
                            <DynamicModal config={Config_Modal_Magasin} mode="add" onSubmit={reload} />
                            {magasins.map((magasin) => (
                                <DynamicModal key={magasin.id} config={Config_Modal_Magasin} mode="edit" local={{ id: magasin.id }} onSubmit={reload} onDelete={reload} />
                            ))}
                        </>
                    ) : null}
                </div>
            </main>
        </>
    );
}
