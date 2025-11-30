import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './Journal.css';
import Navbar from '../../components/Navigation/Navbar';
import ServerEtat from '../../components/Sections/ServerEtat';
import TitleH1 from '../../components/Sections/TitleH1';
import TitleH2 from '../../components/Sections/TitleH2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function JournalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [journal, setJournal] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage, setMessagesPerPageState] = useState(() => {
    const saved = localStorage.getItem('messagesPerPage');
    return saved ? Number(saved) : 20;
  });

  const setMessagesPerPage = (value) => {
    setMessagesPerPageState(value);
    localStorage.setItem('messagesPerPage', value.toString());
  };

  const groupMessages = (messages) => {
    if (!messages || messages.length === 0) return [];

    const sorted = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const groups = [];
    let currentGroup = [];

    for (let i = 0; i < sorted.length; i++) {
      const currentMessage = sorted[i];

      if (currentGroup.length === 0) {
        currentGroup.push(currentMessage);
      } else {
        const lastMessage = currentGroup[currentGroup.length - 1];
        const timeDiff = Math.abs(
          new Date(currentMessage.timestamp) - new Date(lastMessage.timestamp)
        );
        const oneMinuteMs = 60 * 1000;

        if (
          currentMessage.author.id === lastMessage.author.id &&
          timeDiff < oneMinuteMs
        ) {
          currentGroup.push(currentMessage);
        } else {
          groups.push(currentGroup);
          currentGroup = [currentMessage];
        }
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/journaux/read/${id}`);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Journal fetched:', data);
        setJournal(data.journal);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement du journal');
        console.error(err);
        setJournal(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchContent = async () => {
      try {
        setLoadingContent(true);
        const response = await fetch(`/api/journaux/contents/${id}`);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Journal content fetched:', data);
        setContent(data.content);
      } catch (err) {
        console.error(err);
        setContent(null);
      } finally {
        setLoadingContent(false);
      }
    };

    if (id) {
      fetchJournal();
      fetchContent();
      setCurrentPage(1);
    }
  }, [id]);

  const getPaginatedMessages = () => {
    if (!content || !content.messages) return [];
    const grouped = groupMessages(content.messages);
    const startIndex = (currentPage - 1) * messagesPerPage;
    const endIndex = startIndex + messagesPerPage;
    return grouped.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (!content || !content.messages) return 1;
    const grouped = groupMessages(content.messages);
    return Math.ceil(grouped.length / messagesPerPage);
  };

  const reloadContent = async () => {
    try {
      setLoadingContent(true);
      const response = await fetch(`/api/journaux/contents/${id}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Journal content reloaded:', data);
      setContent(data.content);
    } catch (err) {
      console.error('Erreur lors du rechargement du contenu:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const btnReturn = { text: 'Retour à la bibliothèque', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/bibliotheque' };

  const content_fonctions = [
    { id: 1, title: "Rafraichir", icon: "fas fa-rotate-right", class: "bg-base-200 hover:bg-base-300", connected: false, function: reloadContent }
  ];

  return (
    <>
      <Navbar active="journal" />
      <section className="container mx-auto px-4 py-2">
        <ServerEtat />
      </section>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center flex-col gap-2">
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
                  Retour aux journaux
                </Link>
              </div>
            </div>
          )}
          {!loading && journal && (
            <>
              <TitleH1 text={journal.title} btn={btnReturn} />
              <article className="w-full mt-1">
                <div className="mb-4">
                  <div className="flex gap-4">
                    {journal.author && (
                      <>
                        <span>Auteur: <strong>{journal.author}</strong></span>
                        <span>•</span>
                      </>
                    )}
                    {journal.published_date && (
                      <span>{new Date(journal.published_date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    )}
                  </div>
                </div>

                {journal.description && (
                  <>
                    <div className="divider"></div>

                    <div className="prose prose-lg max-w-none mb-8">
                      <p>{journal.description}</p>
                    </div>
                  </>
                )}

                <TitleH2 text="Contenu" fonctions={content_fonctions} style_add={{ marginBottom: '1rem' }} />

                {loadingContent && (
                  <div className="flex justify-center items-center py-12">
                    <div className="loading loading-spinner loading-lg"></div>
                  </div>
                )}

                {!loadingContent && content && (
                  <>
                    <div className="prose prose-lg max-w-none mb-4">
                      {content.messages && content.messages.length > 0 ? (
                        <div className="space-y-4">
                          {getPaginatedMessages().map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-base-200 p-4 rounded-lg border-l-4 border-blue-500">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <strong className="text-blue-600">{group[0].author.name}</strong>
                                  <span className="text-sm ml-2">
                                    {new Date(group[0].timestamp).toLocaleString('fr-FR')}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {group.map((message) => (
                                  <div key={message.id}>
                                    <p className="">{message.content}</p>
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className="mt-1">
                                        <span className="text-xs text-gray-500">{message.attachments.length} pièce(s) jointe(s)</span>
                                      </div>
                                    )}
                                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {Object.entries(message.reactions).map(([emoji, count]) => (
                                          <span key={emoji} className="inline-flex items-center gap-1 bg-base-300 border border-base-300 rounded-full px-3 py-1 text-sm">
                                            <span>{emoji}</span>
                                            <span className="">{count}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Aucun message disponible.</p>
                      )}
                    </div>

                    {content.messages && content.messages.length > 0 && (
                      <div className="flex justify-center items-center gap-6 mt-8 flex-wrap">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <label className="font-semibold">Messages par page:</label>
                          <select
                            value={messagesPerPage}
                            onChange={(e) => {
                              setMessagesPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="select select-bordered select-sm bg-base-100"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>

                        <div className="join">
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="join-item btn btn-sm"
                            title="Première page"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-angles-left" />
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="join-item btn btn-sm"
                            title="Page précédente"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-angle-left" />
                          </button>
                          <button
                            className="join-item btn btn-sm btn-active"
                            disabled
                          >
                            Page {currentPage} / {getTotalPages()}
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                            disabled={currentPage === getTotalPages()}
                            className="join-item btn btn-sm"
                            title="Page suivante"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-angle-right" />
                          </button>
                          <button
                            onClick={() => setCurrentPage(getTotalPages())}
                            disabled={currentPage === getTotalPages()}
                            className="join-item btn btn-sm"
                            title="Dernière page"
                          >
                            <FontAwesomeIcon icon="fa-solid fa-angles-right" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </article>
            </>
          )}

          {!loading && !journal && !error && (
            <div className="alert alert-warning">
              <span>Aucun journal trouvé avec cet ID.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
