import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from '../../components/Navigation/Navbar';
import Skeleton from '../../components/Objects/Skeleton';
import TitleH1 from '../../components/Objects/TitleH1';
import TitleH2 from '../../components/Objects/TitleH2';
import Stat from '../../components/Objects/Stat';
import InfoLine from '../../components/Objects/InfoLine';
import LivreChapitre from '../../components/Objects/LivreChapitre';
import MarkdownTextEditor from '../../components/Objects/MarkdownTextEditor';
import DynamicIcon from '../../components/Objects/DynamicIcon';
import DynamicModal from '../../components/Modals/DynamicModal';

import { checkUserID, checkMemberAuth } from "../../services/authorisation";
import { showModal } from '../../components/Functions/showModal';
import { getContrastTextColor } from '../../components/Functions/contrastColor';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { Config_Modal_Livre_Content } from '../../components/Modals/Config_Modal_Livre_Content';
import {
    getLivreById,
    getLivreContentById,
    getCivilisationById,
} from "../../services/api"

const DEFAULT_COVER_COLOR = "#cd9f5a";
const WORDS_PER_MINUTE = 230;

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
const countWords = (text) => (text || "").split(/\s+/).filter(Boolean).length;

// Couverture dessinée aux couleurs du livre
function BookCover({ livre }) {
    const color = livre.cover_color || DEFAULT_COVER_COLOR;
    return (
        <div
            className="flex flex-col justify-between w-28 h-40 sm:w-32 sm:h-44 shrink-0 rounded-r-lg rounded-l-sm shadow-lg p-3 overflow-hidden"
            style={{
                backgroundColor: color,
                color: getContrastTextColor(color),
                backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.35) 0%, rgba(255,255,255,0.15) 6%, rgba(255,255,255,0) 14%)",
            }}
        >
            <DynamicIcon icon={livre.cover_icon || "fa-solid fa-book"} fallback="fa-solid fa-book" className="text-xl self-end opacity-90" />
            <span className="font-serif font-bold text-sm leading-tight line-clamp-4 break-words">{livre.title}</span>
            <span className="text-xs opacity-80 truncate">{livre.author}</span>
        </div>
    );
}

function Sommaire({ chapitres }) {
    return (
        <nav className="flex flex-col gap-2 w-full lg:w-72 shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] overflow-y-auto bg-base-200 rounded-3xl p-4">
            <span className="flex flex-row items-center gap-2 font-bold">
                <FontAwesomeIcon icon="fa-solid fa-list-ol" />
                <span>Sommaire</span>
            </span>
            <ol className="flex flex-col gap-1">
                {chapitres.map((chapitre, index) => (
                    <li key={chapitre.id ?? index}>
                        <a
                            href={`#chapitre-${chapitre.id ?? index}`}
                            className="flex flex-row gap-2 rounded-xl px-2 py-1 hover:bg-base-300 transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(`chapitre-${chapitre.id ?? index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                        >
                            <span className="opacity-60 tabular-nums">{index + 1}.</span>
                            <span className="min-w-0 break-words">{chapitre.chapitre}</span>
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export default function LivreDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [livre, setLivre] = useState(null);
    const [civilisation, setCivilisation] = useState(null);
    const [chapitres, setChapitres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingChapitres, setLoadingChapitres] = useState(true);
    const [auth, setAuth] = useState(false);

    useEffect(() => {
        getLivreById(id)
            .then((data) => {
                const found = data.livre ?? null;
                setLivre(found);
                // Livre d'une civilisation : Fondateur / Admin de la civilisation ; sinon son auteur (ou un administrateur)
                if (!found?.civilisation_id) {
                    checkUserID(found?.user_id, setAuth);
                    return;
                }
                return getCivilisationById(found.civilisation_id)
                    .then((civ) => {
                        setCivilisation(civ.civilisation ?? null);
                        checkMemberAuth(civ.members ?? [], setAuth);
                    })
                    .catch((error) => console.error('Error fetching civilisation:', error));
            })
            .catch((error) => {
                console.error('Error fetching livre:', error);
                setLivre(null);
            })
            .finally(() => setLoading(false));

        getLivreContentById(id)
            .then((data) => setChapitres(data.contents ?? []))
            .catch((error) => console.error('Error fetching chapitres:', error))
            .finally(() => setLoadingChapitres(false));
    }, [id]);

    const updateLivre = (data) => {
        if (data.livre) setLivre(data.livre);
    };

    const addChapitre = (data) => {
        if (data?.content) setChapitres((prev) => [...prev, data.content]);
    };

    const updateChapitre = (data) => {
        const chapitre = data?.content;
        if (chapitre) setChapitres((prev) => prev.map((item) => item.id === chapitre.id ? chapitre : item));
    };

    const deleteChapitre = (chapitre) => {
        setChapitres((prev) => prev.filter((item) => item.id !== chapitre.id));
    };

    const btnReturn = { text: 'Retour à la bibliothèque', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/bibliotheque' };

    const FctModify = [
        { id: 0, title: 'Modifier', icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(Config_Modal_Livre, "edit") }
    ];

    const FctChapitres = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, tooltip: { text: "Ajouter un nouveau chapitre", position: "bottom" }, function: () => showModal(Config_Modal_Livre_Content, "add") }
    ];

    const words = chapitres.reduce((total, chapitre) => total + countWords(chapitre.content), 0);
    const readingMinutes = words > 0 ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0;
    const published = formatDate(livre?.published_date);

    const BodyHTML = livre ? (
        <>
            <TitleH1 text={livre.title} icon="fas fa-book" btn={btnReturn} fonctions={FctModify} />

            {/* En-tête : couverture, informations, chiffres clés et description */}
            <div className="flex flex-col sm:flex-row gap-4 w-full bg-base-200 rounded-3xl p-4">
                <div className="flex justify-center sm:block">
                    <BookCover livre={livre} />
                </div>
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                        <InfoLine icon="fa-solid fa-feather">
                            {livre.author ? <>Écrit par <strong>{livre.author}</strong></> : "Auteur inconnu"}
                        </InfoLine>
                        <InfoLine icon="fa-solid fa-calendar">
                            {published ? `Publié le ${published}` : "Date de publication inconnue"}
                        </InfoLine>
                        {civilisation ? (
                            <InfoLine icon="fa-solid fa-flag">
                                Civilisation : <a href={`/civilisation/${civilisation.id}`} className="link link-hover">{civilisation.title}</a>
                            </InfoLine>
                        ) : null}
                        {livre.language ? <InfoLine icon="fa-solid fa-language">{livre.language}</InfoLine> : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Stat icon="fa-solid fa-bookmark" label={chapitres.length > 1 ? "Chapitres" : "Chapitre"} value={loadingChapitres ? "…" : chapitres.length} />
                        <Stat icon="fa-solid fa-font" label={words > 1 ? "Mots" : "Mot"} value={loadingChapitres ? "…" : words.toLocaleString('fr-FR')} />
                        <Stat icon="fa-solid fa-hourglass-half" label="Temps de lecture" value={loadingChapitres ? "…" : readingMinutes > 0 ? `~${readingMinutes} min` : "—"} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className="flex flex-row items-center gap-2 font-bold">
                            <FontAwesomeIcon icon="fas fa-pen-nib" />
                            <span>Description</span>
                        </span>
                        <MarkdownTextEditor value={livre.description || 'Aucune description'} />
                    </div>
                </div>
            </div>

            <TitleH2 text="Chapitres" icon="fas fa-book-open" fonctions={FctChapitres} />
            {loadingChapitres ? (
                <div className="flex justify-center items-center py-12 w-full">
                    <div className="loading loading-spinner loading-lg"></div>
                </div>
            ) : chapitres.length === 0 ? (
                <i className="w-full">Ce livre n'a encore aucun chapitre.</i>
            ) : (
                <div className="flex flex-col lg:flex-row gap-4 w-full items-start">
                    {chapitres.length > 1 ? <Sommaire chapitres={chapitres} /> : null}
                    <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
                        {chapitres.map((chapitre, index) => (
                            <LivreChapitre
                                key={chapitre.id ?? index}
                                index={index}
                                content={chapitre}
                                authorisation={auth}
                                updateLivreContent={updateChapitre}
                                deleteLivreContent={deleteChapitre}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    ) : null;

    return (
        <>
            <Navbar active="bibliotheque" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                    {loading ? (
                        <Skeleton />
                    ) : !livre ? (
                        <>
                            <TitleH1 text="Livre introuvable" icon="fas fa-book" btn={btnReturn} />
                            <p>Ce livre n'existe pas ou n'est plus disponible.</p>
                        </>
                    ) : BodyHTML}

                    <DynamicModal config={Config_Modal_Livre} mode="edit" onSubmit={updateLivre} onDelete={() => navigate('/bibliotheque')} />
                    <DynamicModal config={Config_Modal_Livre_Content} mode="add" onSubmit={addChapitre} />
                </div>
            </main>
        </>
    );
}
