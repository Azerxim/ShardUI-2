import './Bibliotheque.css';
import { useState, useEffect } from 'react';

import Navbar from "../../components/Navigation/Navbar";
import TitleH2 from '../../components/Sections/TitleH2';
import TitleH1 from '../../components/Sections/TitleH1';
import EtagereLivres from '../../components/Sections/EtagereLivres';
import link from 'daisyui/components/link';

const journaux_exemple = [
    { id: 1, title: "Journal 1", cover_color: "#5865F2", cover_icon: "fab fa-discord", link: "#", description: "Contenu du journal 1...", link: "/bibliotheque/journal/1" },
    { id: 2, title: "Journal 2", cover_color: "#8A2BE2", cover_icon: "fas fa-file-alt", link: "#", description: "Contenu du journal 2..." },
    { id: 3, title: "Journal 3", cover_color: "#20B2AA", cover_icon: "fas fa-file-invoice", link: "#", description: "Contenu du journal 3..." }
];

const livres_exemple = [
    { id: 1, title: "Livre 1", cover_color: "#3CB371", cover_icon: "fas fa-book", link: "#", description: "Contenu du livre 1..." },
    { id: 2, title: "Livre 2", cover_color: "#20B2AA", cover_icon: "fas fa-book-open", link: "#", description: "Contenu du livre 2..." },
    { id: 3, title: "Livre 3", cover_color: "#70db90ff", cover_icon: "fas fa-scroll", link: "#", description: "Contenu du livre 3..." },
    { id: 4, title: "Livre 4", cover_color: "#68cfeeff", cover_icon: "fas fa-book-atlas", link: "#", description: "Contenu du livre 4..." },
    { id: 5, title: "Livre 5", cover_color: "#cd9f5aff", cover_icon: "fas fa-bookmark", link: "#", description: "Contenu du livre 5..." }
];

export default function BibliothequePage() {

    const [journaux, setJournaux] = useState([]);
    const [livres, setLivres] = useState([]);

    useEffect(() => {
        fetch('/api/bibliotheque/journaux/list/')
            .then((response) => response.json())
            .then((data) => {
                // console.log('Journaux fetched:', data);
                // Ajouter les liens pour redirection vers la page de détail
                const journauxWithLinks = data.map(journal => ({
                    ...journal,
                    link: `/bibliotheque/journal/${journal.id}`
                }));
                setJournaux(journauxWithLinks);
                // setJournaux(journaux_exemple); // Temporary: use example journals until API is ready
            })
            .catch((error) => {
                console.error('Error fetching journaux:', error);
                setJournaux([]);
            });
    }, []);

    // useEffect(() => {
    //     fetch('/api/bibliotheque/livres/list/')
    //         .then((response) => response.json())
    //         .then((data) => {
    //             // console.log('Livres fetched:', data);
    //             setLivres(data);
    //             setLivres(livres_exemple); // Temporary: use example books until API is ready
    //         })
    //         .catch((error) => {
    //             console.error('Error fetching livres:', error);
    //             setLivres([]);
    //         });
    // }, []);

    const testFunction = () => {
        alert("Fonction test déclenchée !");
    };

    const journaux_fonctions = [
        { id: 1, title: "Nouveau", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, function: testFunction }
    ];

    return (
        <>
            <Navbar active="bibliotheque" />
            <div className="container mx-auto p-4">
                <div className="flex flex-col items-center justify-center flex-col gap-2">
                    <TitleH1 text="Bibliothèque" />
                    <p>Bienvenue dans la bibliothèque.</p>

                    <TitleH2 text="Journaux" fonctions={journaux_fonctions} />
                    {journaux.length === 0 ? (
                        <div style={{ width: '100%' }}>
                            <i>Aucun journal disponible.</i>
                        </div>
                    ) : <EtagereLivres books={journaux} text='journaux' height={4} width={12} orientation='horizontal' />}

                    {/* <TitleH2 text="Livres" />
                    {livres.length === 0 ? (
                        <div style={{ width: '100%' }}>
                            <i>Aucun livre disponible.</i>
                        </div>
                    ) : <EtagereLivres books={livres} text='livre(s)' />} */}

                </div>
            </div>
        </>
    );
}