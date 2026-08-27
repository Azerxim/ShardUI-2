import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "../../components/Navigation/Navbar";
import TitleH2 from '../../components/Objects/TitleH2';
import TitleH1 from '../../components/Objects/TitleH1';
import EtagereLivres from '../../components/Objects/EtagereLivres';
import EtagereJournaux from '../../components/Objects/EtagereJournaux';
import DynamicModal from '../../components/Modals/DynamicModal';
import GrimoireHero from '../../components/Layouts/GrimoireHero';
import DynamicNavbar from "../../components/Navigation/DynamicNavbar";

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Journal } from '../../components/Modals/Config_Modal_Journal';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { Config_RP_Navbar } from '../../components/Navigation/Config_RP_Navbar';
import {
    getJournaux,
    getLivres
} from "../../services/api"


// const journaux_exemple = [
//     { id: 1, title: "Hydrogen", cover_color: "#5865F2", cover_icon: "fab fa-discord", link: "/bibliotheque/journal/0", description: "Contenu du journal 1..." },
//     { id: 2, title: "Journal 2", cover_color: "#8A2BE2", cover_icon: "fas fa-file-alt", link: "#", description: "Contenu du journal 2..." },
//     { id: 3, title: "Journal 3", cover_color: "#f2f2f2", cover_icon: "fas fa-file-invoice", link: "#", description: "Contenu du journal 3..." }
// ];

// const livres_exemple = [
//     { id: 1, title: "Livre 1", cover_color: "#3CB371", cover_icon: "fas fa-book", link: "/bibliotheque/livre/0", description: "Contenu du livre 1..." },
//     { id: 2, title: "Livre 2", cover_color: "#20B2AA", cover_icon: "fas fa-book-open", link: "#", description: "Contenu du livre 2..." },
//     { id: 3, title: "Livre 3", cover_color: "#70db90ff", cover_icon: "fas fa-scroll", link: "#", description: "Contenu du livre 3..." },
//     { id: 4, title: "Livre 4", cover_color: "#68cfeeff", cover_icon: "fas fa-book-atlas", link: "#", description: "Contenu du livre 4..." },
//     { id: 5, title: "Livre 5", cover_color: "#cd9f5aff", cover_icon: "fas fa-bookmark", link: "#", description: "Contenu du livre 5..." }
// ];

const journaux_exemple = []
const livres_exemple = []

export default function BibliothequePage() {
    const [journaux, setJournaux] = useState([]);
    const [livres, setLivres] = useState([]);
    const [loadingJournaux, setLoadingJournaux] = useState(true);
    const [loadingLivres, setLoadingLivres] = useState(true);
    const [storageJournaux, setStorageJournaux] = useState(JSON.parse(localStorage.getItem('journaux')) || []);
    const [storageLivres, setStorageLivres] = useState(JSON.parse(localStorage.getItem('livres')) || []);

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
                setJournaux([...journauxWithLinks, ...journaux_exemple]);
                setStorageJournaux([...journauxWithLinks, ...journaux_exemple]);
                localStorage.setItem('journaux', JSON.stringify([...journauxWithLinks, ...journaux_exemple]));
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
                setLivres([...data, ...livres_exemple]);
                setStorageLivres([...data, ...livres_exemple]);
                localStorage.setItem('livres', JSON.stringify([...data, ...livres_exemple]));
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

    const journaux_fonctions = [
        // { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => showModal(Config_Modal_Journal, "add") }
    ];

    const livres_fonctions = [
        // { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => showModal(Config_Modal_Livre, "add") }
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
                                <button onClick={() => showModal(Config_Modal_Journal, "add")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouveau Journal" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                    <span className="flex">Journal</span>
                                    <FontAwesomeIcon icon="fas fa-plus" />
                                </button>
                                <button onClick={() => showModal(Config_Modal_Livre, "add")} className={`flex flex-nowrap justify-end gap-2 items-center h-full bg-base-200 hover:bg-base-300 text-base-content rounded-3xl tooltip tooltip-left`} data-tip="Nouveau Livre" style={{ padding: '0.75rem 0.75rem 0.75rem 1.25rem', cursor: 'pointer' }}>
                                    <span className="flex">Livre</span>
                                    <FontAwesomeIcon icon="fas fa-plus" />
                                </button>
                            </div>
                        }
                    />
                    <DynamicNavbar active_id="bibliotheque" navigation={Config_RP_Navbar.navigation} shadow="md" />

                    <TitleH2 text="Journaux" fonctions={journaux_fonctions} />
                    {loadingJournaux ? (
                        storageJournaux.length === 0 ? (
                            <div style={{ width: '100%' }}>
                                <i>Chargement des journaux...</i>
                            </div>
                        ) : (
                            <EtagereJournaux books={storageJournaux} text='journaux' height={6} width={24} orientation='horizontal' />
                        )
                    ) : (
                        journaux.length === 0 ? (
                            <div style={{ width: '100%' }}>
                                <i>Aucun journal disponible.</i>
                            </div>
                        ) : <EtagereJournaux books={journaux} text='journaux' height={6} width={24} orientation='horizontal' />
                    )}

                    <DynamicModal config={Config_Modal_Journal} mode="add" onSubmit={(journal) => { updateJournal(journal) }} />

                    <TitleH2 text="Livres" fonctions={livres_fonctions} />
                    {loadingLivres ? (
                        storageLivres.length === 0 ? (
                            <div style={{ width: '100%' }}>
                                <i>Chargement des livres...</i>
                            </div>
                        ) : (
                            <EtagereLivres books={storageLivres} text='livre(s)' height={12} width={4} orientation='vertical' />
                        )
                    ) : (
                        livres.length === 0 ? (
                            <div style={{ width: '100%' }}>
                                <i>Aucun livre disponible.</i>
                            </div>
                        ) : <EtagereLivres books={livres} text='livre(s)' height={12} width={4} orientation='vertical' />
                    )}

                    <DynamicModal config={Config_Modal_Livre} mode="add" onSubmit={(livre) => { updateLivre(livre) }} />

                </div>
            </div>
        </>
    );
}