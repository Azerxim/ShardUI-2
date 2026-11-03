import { useEffect, useState } from 'react';
import { usePageTitle } from "@/utils/pageTitle";
import { useParams, useNavigate } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Skeleton from '@/components/ui/Skeleton';
import TitleH1 from '@/components/ui/TitleH1';
import EnTeteFiche from '@/components/ui/EnTeteFiche';
import SommaireFiche from '@/components/ui/SommaireFiche';
import TitleH2 from '@/components/ui/TitleH2';
import Stat from '@/components/ui/Stat';
import InfoLine from '@/components/ui/InfoLine';
import LivreChapitre from '@/components/bibliotheque/LivreChapitre';
import MarkdownTextEditor from '@/components/ui/MarkdownTextEditor';
import DynamicIcon from '@/components/ui/DynamicIcon';
import DynamicModal from '@/components/modals/DynamicModal';

import { checkUserID, checkMemberAuth } from "@/services/authorisation";
import { showModal } from '@/utils/showModal';
import { getContrastTextColor } from '@/utils/contrastColor';
import { couleurValide } from '@/utils/couleurFiche';
import { livreModal } from '@/config/modals/livre';
import LivreLiensSection from '@/components/bibliotheque/LivreLiensSection';
import { livreContentModal } from '@/config/modals/livre-content';
import {
    getLivreById,
    getLivreContentById,
    getCivilisationById,
} from "@/services/api"
import EtatVide from '@/components/ui/EtatVide';

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

// Chiffres romains des numéros de chapitre (I, II, III…)
const ROMAINS = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const romain = (n) => ROMAINS.reduce((texte, [valeur, lettres]) => {
    while (n >= valeur) { texte += lettres; n -= valeur; }
    return texte;
}, "");

// Table des chapitres (charte « Chancellerie ») : une ligne par chapitre, qui mène à son texte dans la lecture
function TableChapitres({ chapitres }) {
    return (
        <ol className="flex flex-col w-full">
            {chapitres.map((chapitre, index) => {
                const mots = countWords(chapitre.content);
                const ancre = `chapitre-${chapitre.id ?? index}`;
                return (
                    <li key={chapitre.id ?? index}>
                        <a
                            href={`#${ancre}`}
                            className="grid grid-cols-[3rem_minmax(0,1fr)_auto] sm:grid-cols-[3rem_minmax(0,1fr)_7rem_5rem] items-center gap-x-4 ligne-fiche"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(ancre)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                        >
                            <span className="font-display text-xl opacity-70 text-center">{romain(index + 1)}</span>
                            <span className="font-bold break-words">{chapitre.chapitre}</span>
                            <span className="hidden sm:inline text-sm opacity-70 tabular-nums">{mots.toLocaleString('fr-FR')} mot{mots > 1 ? 's' : ''}</span>
                            <span className="text-sm opacity-70 tabular-nums text-right sm:text-left">{Math.max(1, Math.round(mots / WORDS_PER_MINUTE))} min</span>
                        </a>
                    </li>
                );
            })}
        </ol>
    );
}

export default function LivreDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [livre, setLivre] = useState(null);
    const [chapitres, setChapitres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingChapitres, setLoadingChapitres] = useState(true);
    const [auth, setAuth] = useState(false);

    usePageTitle(livre?.title);

    useEffect(() => {
        getLivreById(id)
            .then((data) => {
                const found = data.livre ?? null;
                setLivre(found);
                // Son auteur ou un administrateur ; les dirigeants des civilisations liées s'ajoutent avec les liens (onLiens)
                checkUserID(found?.user_id, setAuth);
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

    // Même règle que l'API (crud._check_livre_rights) : le Fondateur ou un Admin d'une civilisation liée peut aussi modifier
    const droitsParLiens = (liens) => {
        const civilisations = liens.filter((lien) => lien.entite.type === 'civilisation');
        Promise.all(civilisations.map((lien) => getCivilisationById(lien.entite.id).catch(() => null)))
            .then((fiches) => {
                if (fiches.some((fiche) => fiche && checkMemberAuth(fiche.members ?? []))) setAuth(true);
            });
    };

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

    const couleurCouverture = couleurValide(livre?.cover_color) ?? DEFAULT_COVER_COLOR;
    const btnReturn = { text: 'Retour à la bibliothèque', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/bibliotheque' };

    const FctModify = [
        { id: 0, title: 'Modifier', icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(livreModal, "edit") }
    ];

    const FctChapitres = [
        { id: 1, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, tooltip: { text: "Ajouter un nouveau chapitre", position: "bottom" }, function: () => showModal(livreContentModal, "add") }
    ];

    const words = chapitres.reduce((total, chapitre) => total + countWords(chapitre.content), 0);
    const readingMinutes = words > 0 ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0;
    const published = formatDate(livre?.published_date);

    const BodyHTML = livre ? (
        <>
            {/* En-tête dans la couleur de la couverture ; la couverture, cernée d'encre, s'en détache */}
            <EnTeteFiche
                couleur={couleurCouverture}
                embleme={<span className="block rounded-r-lg rounded-l-sm ring-[3px] ring-[#17131f] self-start sm:self-auto"><BookCover livre={livre} /></span>}
                surtitre={["Livre", livre.author ? `par ${livre.author}` : null, livre.language].filter(Boolean).join(" · ")}
                titre={livre.title}
                fonctions={FctModify}
                ariane={[{ label: "Bibliothèque", href: "/bibliotheque" }, { label: livre.title }]}
            />
            <SommaireFiche />

            {/* Corps en deux colonnes, comme la maquette : présentation et table des chapitres à gauche ; chiffres clés et
                « À propos » à droite (au-dessus sur téléphone). La lecture suit, sur toute la largeur. */}
            <div className="fiche grid grid-cols-1 lg:grid-cols-3 gap-x-10 w-full items-start">
                <div className="lg:col-span-2 flex flex-col gap-2 min-w-0">
                    <TitleH2 text="Présentation" icon="fas fa-pen-nib" />
                    <MarkdownTextEditor value={livre.description || 'Aucune description'} />

                    <TitleH2 text="Chapitres" icon="fas fa-book-open" fonctions={FctChapitres} />
                    {loadingChapitres ? (
                        <div className="flex justify-center items-center py-12 w-full">
                            <div className="loading loading-spinner loading-lg"></div>
                        </div>
                    ) : chapitres.length === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-feather-pointed"
                            texte="Ce livre n'a encore aucun chapitre."
                            aide={auth ? "Écrivez le premier chapitre pour ouvrir le livre à ses lecteurs." : null}
                            action={auth ? { label: "Écrire le premier chapitre", icon: "fa-solid fa-plus", onClick: () => showModal(livreContentModal, "add") } : null}
                        />
                    ) : (
                        <TableChapitres chapitres={chapitres} />
                    )}
                </div>

                <aside className="flex flex-col gap-2 min-w-0 order-first lg:order-none">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 bg-base-200 rounded-3xl p-2 mt-4 lg:mt-7">
                        <Stat icon="fa-solid fa-bookmark" label={chapitres.length > 1 ? "Chapitres" : "Chapitre"} value={loadingChapitres ? "…" : chapitres.length} />
                        <Stat icon="fa-solid fa-font" label={words > 1 ? "Mots" : "Mot"} value={loadingChapitres ? "…" : words.toLocaleString('fr-FR')} />
                        <Stat icon="fa-solid fa-hourglass-half" label="Temps de lecture" value={loadingChapitres ? "…" : readingMinutes > 0 ? `~${readingMinutes} min` : "—"} />
                    </div>

                    <TitleH2 text="À propos du livre" icon="fas fa-circle-info" />
                    <div className="flex flex-col gap-2 px-1">
                        <InfoLine icon="fa-solid fa-feather">
                            {livre.author ? <>Écrit par <strong>{livre.author}</strong></> : "Auteur inconnu"}
                        </InfoLine>
                        <InfoLine icon="fa-solid fa-calendar">{published ? `Publié le ${published}` : "Date de publication inconnue"}</InfoLine>
                        {livre.language ? <InfoLine icon="fa-solid fa-language">{livre.language}</InfoLine> : null}
                        <LivreLiensSection ecrit={livre} auth={auth} onLiens={droitsParLiens} />
                    </div>
                </aside>
            </div>

            {/* Lecture : le texte des chapitres, sur toute la largeur */}
            {!loadingChapitres && chapitres.length > 0 ? (
                <div className="fiche flex flex-col gap-4 w-full">
                    <TitleH2 text="Lecture" icon="fas fa-book-open-reader" />
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
            ) : null}
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

                    <DynamicModal config={livreModal} mode="edit" onSubmit={updateLivre} onDelete={() => navigate('/bibliotheque')} />
                    <DynamicModal config={livreContentModal} mode="add" onSubmit={addChapitre} />
                </div>
            </main>
        </>
    );
}
