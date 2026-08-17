import { useState, useEffect } from 'react';

import Navbar from "../../components/Navigation/Navbar";
import TitleH2 from '../../components/Objects/TitleH2';
import TitleH1 from '../../components/Objects/TitleH1';
import EtagereLivres from '../../components/Objects/EtagereLivres';
import DynamicModal from '../../components/Modals/DynamicModal';
import GrimoireHero from '../../components/Layouts/GrimoireHero';

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Journal } from '../../components/Modals/Config_Modal_Journal';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { getApiURL } from "../../services/api"


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

    const apiURL = getApiURL()

    useEffect(() => {
        fetch(`${apiURL}/bibliotheque/journaux/list`)
            .then((response) => response.json())
            .then((data) => {
                // console.log('Journaux fetched:', data);
                // Ajouter les liens pour redirection vers la page de détail
                const journauxWithLinks = data.map(journal => ({
                    ...journal,
                    // link: `/bibliotheque/journal/${journal.id}`
                }));
                setJournaux([...journauxWithLinks, ...journaux_exemple]);
                // setJournaux(journaux_exemple); // Temporary: use example journals until API is ready
            })
            .catch((error) => {
                console.error('Error fetching journaux:', error);
                setJournaux([]);
            });
    }, []);

    const updateJournal = (journal) => {
        setJournaux((prevJournaux) => [...prevJournaux, journal]);
    };

    useEffect(() => {
        fetch(`${apiURL}/bibliotheque/livres/list`)
            .then((response) => response.json())
            .then((data) => {
                // console.log('Livres fetched:', data);
                setLivres([...data, ...livres_exemple]);
                // setLivres(livres_exemple); // Temporary: use example books until API is ready
            })
            .catch((error) => {
                console.error('Error fetching livres:', error);
                setLivres([]);
            });
    }, []);

    const updateLivre = (livre) => {
        setLivres((prevLivres) => [...prevLivres, livre]);
    };

    const journaux_fonctions = [
        { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => showModal(Config_Modal_Journal, "add") }
    ];

    const livres_fonctions = [
        { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: true, function: () => showModal(Config_Modal_Livre, "add") }
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
                    />

                    <TitleH2 text="Journaux" fonctions={journaux_fonctions} />
                    {journaux.length === 0 ? (
                        <div style={{ width: '100%' }}>
                            <i>Aucun journal disponible.</i>
                        </div>
                    ) : <EtagereLivres books={journaux} text='journaux' height={4} width={12} orientation='horizontal' />}

                    <DynamicModal config={Config_Modal_Journal} mode="add" onSubmit={(journal) => { updateJournal(journal) }} />

                    <TitleH2 text="Livres" fonctions={livres_fonctions} />
                    {livres.length === 0 ? (
                        <div style={{ width: '100%' }}>
                            <i>Aucun livre disponible.</i>
                        </div>
                    ) : <EtagereLivres books={livres} text='livre(s)' />}

                    <DynamicModal config={Config_Modal_Livre} mode="add" onSubmit={(livre) => { updateLivre(livre) }} />

                </div>
            </div>
        </>
    );
}