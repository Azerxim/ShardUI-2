import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "@/components/layout/Navbar";
import TitleH2 from '@/components/ui/TitleH2';
import TitleH1 from '@/components/ui/TitleH1';
import EtagereLivres from '@/components/bibliotheque/EtagereLivres';
import EtagereJournaux from '@/components/bibliotheque/EtagereJournaux';
import DynamicModal from '@/components/modals/DynamicModal';
import GrimoireHero from '@/components/layout/GrimoireHero';
import DynamicNavbar from "@/components/layout/DynamicNavbar";

import JournalList from '@/components/bibliotheque/JournalList';
import BarreFiltres from '@/components/ui/BarreFiltres';

import { showModal } from '@/utils/showModal';
import { requireLogin } from '@/utils/requireLogin';
import { getSessionUser } from '@/services/session';
import { correspond, normalize, parDate, parTitre, useFiltresMemorises } from '@/utils/filtres';
import { journalModal } from '@/config/modals/journal';
import { livreModal } from '@/config/modals/livre';
import {
    getJournaux,
    getLivres,
    getTousLesLiens
} from "@/services/api"
import EtatVide from '@/components/ui/EtatVide';

// ===== Filtres de la bibliothèque (BarreFiltres) =====
const FILTRES_DEFAUT = { recherche: '', afficher: 'tous', tri: 'publication-desc', mesEcrits: false, visibilite: 'tous' };

const AFFICHER = { tous: 'Journaux et livres', journaux: 'Journaux seulement', livres: 'Livres seulement' };
const VISIBILITES = { tous: 'Publics et privés', publics: 'Publics seulement', prives: 'Privés seulement' };

const TRIS = {
  'publication-desc': { label: 'Publication RP : récents', compare: parDate((e) => e.published_date, -1) },
  'publication-asc': { label: 'Publication RP : anciens', compare: parDate((e) => e.published_date, 1) },
  'ajout-desc': { label: 'Ajoutés récemment', compare: parDate((e) => e.created_at, -1) },
  'titre-asc': { label: 'Titre : A → Z', compare: parTitre((e) => e.title, 1) },
  'titre-desc': { label: 'Titre : Z → A', compare: parTitre((e) => e.title, -1) },
};
const TRI_LIBELLES = Object.fromEntries(Object.entries(TRIS).map(([value, { label }]) => [value, label]));

// Noms des civilisations, commerces, religions, alliances, guerres et personnages liés à chaque écrit, pour la recherche :
// Map "livre-12" / "journal-3" -> texte. Une entité privée n'est cherchable que par un administrateur.
const indexerLiens = (liens, user) => {
  const index = new Map();
  for (const { support, ecrit_id: ecritId, entite } of Array.isArray(liens) ? liens : []) {
    if (!entite?.title || (entite.is_public === false && !user?.is_admin)) continue;
    const cle = `${support}-${ecritId}`;
    index.set(cle, `${index.get(cle) || ''} ${entite.title}`);
  }
  return index;
};

// Un écrit privé n'est visible que par son auteur et les administrateurs ; puis recherche (titre, auteur, description et
// noms de ce qui y est lié), « mes écrits », visibilité et tri
const filtrerEcrits = (ecrits, support, filtres, user, liens) => {
  const query = normalize(filtres.recherche.trim());
  return (ecrits || [])
    .filter((ecrit) => ecrit.is_public !== false || user?.is_admin || ecrit.user_id === user?.id)
    .filter((ecrit) => !filtres.mesEcrits || ecrit.user_id === user?.id)
    .filter((ecrit) => filtres.visibilite === 'tous' || (filtres.visibilite === 'prives') === (ecrit.is_public === false))
    .filter((ecrit) => correspond(query, [ecrit.title, ecrit.author, ecrit.description, liens.get(`${support}-${ecrit.id}`)]))
    .sort(TRIS[filtres.tri].compare);
};

export default function BibliothequePage() {
    const [journaux, setJournaux] = useState([]);
    const [livres, setLivres] = useState([]);
    const [loadingJournaux, setLoadingJournaux] = useState(true);
    const [loadingLivres, setLoadingLivres] = useState(true);
    const [storageJournaux, setStorageJournaux] = useState(JSON.parse(localStorage.getItem('journaux')) || []);
    const [storageLivres, setStorageLivres] = useState(JSON.parse(localStorage.getItem('livres')) || []);
    const [filtres, changerFiltres] = useFiltresMemorises('bibliotheque-filtres', FILTRES_DEFAUT, { afficher: AFFICHER, tri: TRIS, visibilite: VISIBILITES });
    const user = getSessionUser();
    // Index de recherche des liens (vide tant qu'il n'est pas chargé : la recherche porte alors sur les écrits seuls)
    const [liens, setLiens] = useState(() => new Map());

    useEffect(() => {
        let annule = false;
        getTousLesLiens()
            .then((data) => { if (!annule) setLiens(indexerLiens(data, getSessionUser())); })
            .catch((error) => console.error('Error fetching liens:', error));
        return () => { annule = true; };
    }, []);

    const effacerFiltres = { label: "Effacer les filtres", icon: "fa-solid fa-xmark", onClick: () => changerFiltres(FILTRES_DEFAUT) };

    useEffect(() => {
        const MIN_LOADING_TIME = 1000;
        const startTime = Date.now();
        getJournaux()
            .then((data) => {
                // console.log('Journaux fetched:', data);
                // Ajouter les liens pour redirection vers la page de détail
                const journauxWithLinks = data.map(journal => ({
                    ...journal,
                    // link: `/bibliotheque/journal/${journal.id}`
                }));
                setJournaux([...journauxWithLinks]);
                setStorageJournaux([...journauxWithLinks]);
                localStorage.setItem('journaux', JSON.stringify([...journauxWithLinks]));
                const elapsedTime = Date.now() - startTime;
                const remainingTime = MIN_LOADING_TIME - elapsedTime;
                if (remainingTime > 0) {
                    setTimeout(() => setLoadingJournaux(false), remainingTime);
                } else {
                    setLoadingJournaux(false);
                }
                // setJournaux(journaux_exemple); // Temporary: use example journals until API is ready
            })
            .catch((error) => {
                console.error('Error fetching journaux:', error);
                setJournaux([]);
                setStorageJournaux([]);
                localStorage.removeItem('journaux');
                const elapsedTime = Date.now() - startTime;
                const remainingTime = MIN_LOADING_TIME - elapsedTime;
                if (remainingTime > 0) {
                    setTimeout(() => setLoadingJournaux(false), remainingTime);
                } else {
                    setLoadingJournaux(false);
                }
            });
    }, []);

    const updateJournal = (journal) => {
        setJournaux((prevJournaux) => [...prevJournaux, journal]);
        setStorageJournaux((prevStorageJournaux) => [...prevStorageJournaux, journal]);
        localStorage.setItem('journaux', JSON.stringify([...storageJournaux, journal]));
    };

    useEffect(() => {
        const MIN_LOADING_TIME = 1000;
        const startTime = Date.now();

        getLivres()
            .then((data) => {
                // console.log('Livres fetched:', data);
                setLivres([...data]);
                setStorageLivres([...data]);
                localStorage.setItem('livres', JSON.stringify([...data]));
                const elapsedTime = Date.now() - startTime;
                const remainingTime = MIN_LOADING_TIME - elapsedTime;
                if (remainingTime > 0) {
                    setTimeout(() => setLoadingLivres(false), remainingTime);
                } else {
                    setLoadingLivres(false);
                }
                // setLivres(livres_exemple); // Temporary: use example books until API is ready
            })
            .catch((error) => {
                console.error('Error fetching livres:', error);
                setLivres([]);
                setStorageLivres([]);
                localStorage.removeItem('livres');
                const elapsedTime = Date.now() - startTime;
                const remainingTime = MIN_LOADING_TIME - elapsedTime;
                if (remainingTime > 0) {
                    setTimeout(() => setLoadingLivres(false), remainingTime);
                } else {
                    setLoadingLivres(false);
                }
            });
    }, []);

    const updateLivre = (livre) => {
        setLivres((prevLivres) => [...prevLivres, livre]);
        setStorageLivres((prevStorageLivres) => [...prevStorageLivres, livre]);
        localStorage.setItem('livres', JSON.stringify([...storageLivres, livre]));
    };

    // Pendant le chargement : la dernière liste gardée dans le navigateur
    const sourceJournaux = loadingJournaux ? storageJournaux : journaux;
    const sourceLivres = loadingLivres ? storageLivres : livres;
    const journauxFiltres = filtrerEcrits(sourceJournaux, 'journal', filtres, user, liens);
    const livresFiltres = filtrerEcrits(sourceLivres, 'livre', filtres, user, liens);

    const journaux_fonctions = [
        // { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => showModal(journalModal, "add") }
    ];

    const livres_fonctions = [
        // { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => showModal(livreModal, "add") }
    ];

    return (
        <>
            <Navbar active="bibliotheque" />
            <div className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center flex-col gap-2">

                    <GrimoireHero
                        icon="fa-solid fa-book"
                        title="La Bibliothèque de Tetrago"
                        description="Chaque journal est un souvenir, chaque livre un monde : ici s'accumulent les récits que la communauté refuse de laisser s'effacer. Venez les lire, ou déposez-y les vôtres."
                        topRight={
                            <div className="flex flex-col gap-2">
                                <button onClick={() => requireLogin(() => showModal(journalModal, "add"), "publier un journal")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouveau Journal" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                    <span className="flex">Journal</span>
                                    <FontAwesomeIcon icon="fas fa-plus" />
                                </button>
                                <button onClick={() => requireLogin(() => showModal(livreModal, "add"), "écrire un livre")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouveau Livre" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                    <span className="flex">Livre</span>
                                    <FontAwesomeIcon icon="fas fa-plus" />
                                </button>
                            </div>
                        }
                    />
                    {/* <DynamicNavbar active_id="bibliotheque" /> */}

                    <BarreFiltres
                        filtres={filtres}
                        defauts={FILTRES_DEFAUT}
                        onChange={changerFiltres}
                        recherche={{ placeholder: "Titre, auteur, civilisation, religion, guerre, personnage…", label: "Rechercher dans la bibliothèque" }}
                        selects={[
                            { name: 'afficher', label: 'Afficher', options: AFFICHER },
                            { name: 'tri', label: 'Trier', options: TRI_LIBELLES, className: 'sm:w-56' },
                            ...(user ? [{ name: 'visibilite', label: 'Visibilité', options: VISIBILITES, className: 'sm:w-48' }] : []),
                        ]}
                        toggles={user ? [{ name: 'mesEcrits', label: 'Mes écrits' }] : []}
                    />

                    {filtres.afficher !== 'livres' ? (
                        <>
                            <TitleH2 text="Journaux" fonctions={journaux_fonctions} aide="journal" />
                            {loadingJournaux && storageJournaux.length === 0 ? (
                                <div style={{ width: '100%' }}>
                                    <i>Chargement des journaux...</i>
                                </div>
                            ) : sourceJournaux.length === 0 ? (
                                <EtatVide
                                    icon="fa-solid fa-newspaper"
                                    texte="Aucun journal n'a encore été publié."
                                    aide="Un journal relie un salon Discord au site : ses messages deviennent le récit de vos personnages."
                                    action={{ label: "Publier un journal", icon: "fa-solid fa-plus", onClick: () => requireLogin(() => showModal(journalModal, "add"), "publier un journal") }}
                                />
                            ) : journauxFiltres.length === 0 ? (
                                <EtatVide icon="fa-solid fa-magnifying-glass" texte="Aucun journal ne correspond à vos filtres." action={effacerFiltres} />
                            ) : <JournalList journaux={journauxFiltres} />}
                        </>
                    ) : null}

                    <DynamicModal config={journalModal} mode="add" onSubmit={(journal) => { updateJournal(journal) }} />

                    {filtres.afficher !== 'journaux' ? (
                        <>
                            <TitleH2 text="Livres" fonctions={livres_fonctions} aide="livre" />
                            {loadingLivres && storageLivres.length === 0 ? (
                                <div style={{ width: '100%' }}>
                                    <i>Chargement des livres...</i>
                                </div>
                            ) : sourceLivres.length === 0 ? (
                                <EtatVide
                                    icon="fa-solid fa-book"
                                    texte="Aucun livre n'a encore été écrit."
                                    aide="Un livre raconte en chapitres l'histoire, les légendes ou les lois de votre monde."
                                    action={{ label: "Écrire un livre", icon: "fa-solid fa-plus", onClick: () => requireLogin(() => showModal(livreModal, "add"), "écrire un livre") }}
                                />
                            ) : livresFiltres.length === 0 ? (
                                <EtatVide icon="fa-solid fa-magnifying-glass" texte="Aucun livre ne correspond à vos filtres." action={effacerFiltres} />
                            ) : <EtagereLivres books={livresFiltres} text='livre(s)' height={12} width={4} orientation='vertical' />}
                        </>
                    ) : null}

                    <DynamicModal config={livreModal} mode="add" onSubmit={(livre) => { updateLivre(livre) }} />

                </div>
            </div>
        </>
    );
}