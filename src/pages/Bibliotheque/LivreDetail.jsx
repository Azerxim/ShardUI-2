import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from '../../components/Navigation/Navbar';
import TitleH1 from '../../components/Sections/TitleH1';
import TitleH2 from '../../components/Sections/TitleH2';
import LivreChapitre from '../../components/Sections/LivreChapitre';
import DynamicModal from '../../components/Modals/DynamicModal';

import { showModal } from '../../components/Functions/showModal';
import { Config_Modal_Livre } from '../../components/Modals/Config_Modal_Livre';
import { Config_Modal_Livre_Content } from '../../components/Modals/Config_Modal_Livre_Content';
import { getApiURL } from "../../services/api"

export default function LivreDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [livre, setLivre] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingContent, setLoadingContent] = useState(false);
    const [error, setError] = useState(null);
    const apiURL = getApiURL()

    useEffect(() => {
        const fetchLivre = async () => {
          try {
            setLoading(true);
            const response = await fetch(`${apiURL}/bibliotheque/livres/read/${id}`);

            if (!response.ok) {
              throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // console.log('Livre fetched:', data);
            setLivre(data.livre);
            setError(null);
          } catch (err) {
            setError('Erreur lors du chargement du livre');
            console.error(err);
            setLivre(null);
          } finally {
            setLoading(false);
          }
        };

        const fetchContent = async () => {
          try {
            setLoadingContent(true);
            const response = await fetch(`${apiURL}/bibliotheque/livres/contents/read/${id}`);

            if (!response.ok) {
              throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            // console.log('Livre content fetched:', data);
            setContent(data.contents);
          } catch (err) {
            console.error(err);
            setContent(null);
          } finally {
            setLoadingContent(false);
          }
        };

        if (id) {
            fetchLivre();
            fetchContent();
        }
    }, [id]);

    const reloadContent = async () => {
        try {
            setLoadingContent(true);
            const response = await fetch(`${apiURL}/bibliotheque/livres/contents/read/${id}`);

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Livre content reloaded:', data);
            setContent(data.contents);
        } catch (err) {
            console.error('Erreur lors du rechargement du contenu:', err);
        } finally {
            setLoadingContent(false);
        }
    };

    const btnReturn = { text: 'Retour à la bibliothèque', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/bibliotheque' };

    const fonctions = [
        { id: 0, title: 'Modifier', icon: "fas fa-pen", class: "btn-ghost bg-base-200 hover:bg-base-300", connected: true, function: () => showModal(Config_Modal_Livre, "edit") }
    ];

    const content_fonctions = [
        { id: 1, title: "Rafraichir", icon: "fas fa-rotate-right", class: "bg-base-200 hover:bg-base-300", connected: false, function: reloadContent },
        { id: 2, title: "Ajouter", icon: "fas fa-plus", class: "bg-base-200 hover:bg-base-300", connected: true, tooltip: {text: "Ajouter un nouveau chapitre", position: "bottom"}, function: () => showModal(Config_Modal_Livre_Content, "add") }
    ];

    const updateLivre = (data) => {
        console.log("Livre mis à jour:", data);
        setLivre(data.livre ? data.livre : null);
    };

    const createLivreContent = (data) => {
        console.log("Contenu mis à jour:", data);
        setContent([...content, data.content ? data.content : null]);
    };

    const updateLivreContent = (data) => {
        console.log("Contenu mis à jour:", data);
        setContent(content.map(item => item.id === data.content.id ? data.content : item));
    };

    const deleteLivreContent = (data) => {
        console.log("Contenu supprimé:", data);
        setContent(content.filter(item => item.id !== data.id));
    };

    const handleDelete = () => {
        navigate('/bibliotheque');
    };

    return (
        <>
            <Navbar active="bibliotheque" />
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center flex-col gap-2">
                    <DynamicModal config={Config_Modal_Livre} mode="edit" onSubmit={(livre) => { updateLivre(livre) }} onDelete={handleDelete} />
                    <DynamicModal config={Config_Modal_Livre_Content} mode="add" onSubmit={(content) => { createLivreContent(content) }} />

                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="loading loading-spinner loading-lg"></div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error mb-6">
                            <span>{error}</span>
                            <div className="mt-4">
                                <Link to="/bibliotheque" className="btn btn-sm btn-outline">
                                    Retour aux livres
                                </Link>
                            </div>
                        </div>
                    )}
                    {!loading && livre && (
                        <>
                            <TitleH1 text={`Livre: ${livre.title}`} btn={btnReturn} fonctions={fonctions} />
                            <article className="w-full mt-1">
                                <div className="mb-4">
                                    <div className="flex gap-4">
                                        {livre.author && (
                                            <>
                                                <span>Auteur: <strong>{livre.author}</strong></span>
                                                <span>•</span>
                                            </>
                                        )}
                                        {livre.published_date && (
                                            <span>{new Date(livre.published_date).toLocaleDateString('fr-FR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        )}
                                    </div>
                                </div>

                                {livre.description && (
                                    <>
                                        <div className="divider"></div>

                                        <div className="prose prose-lg max-w-none mb-8">
                                            <p>{livre.description}</p>
                                        </div>
                                    </>
                                )}

                                <TitleH2 text="Contenu" fonctions={content_fonctions} style_box={{ marginBottom: '1rem' }} />

                                {loadingContent && (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="loading loading-spinner loading-lg"></div>
                                    </div>
                                )}

                                {!loadingContent && content && (
                                    <>
                                        <div className="prose prose-lg max-w-none mb-4">
                                            {content && content.length > 0 ? (
                                                content.map((chapitre, index) => (
                                                    <LivreChapitre key={index} livre={livre} content={chapitre} updateLivreContent={updateLivreContent} deleteLivreContent={deleteLivreContent} />
                                                ))
                                            ) : (
                                                <p>Aucun chapitre disponible.</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </article>
                        </>
                    )}

                    {!loading && !livre && !error && (
                        <div className="alert alert-warning">
                            <span>Aucun livre trouvé avec cet ID.</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
