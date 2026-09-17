import { Fragment, useEffect, useMemo, useState } from 'react';
import { usePageTitle } from "@/utils/pageTitle";
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import Navbar from '@/components/layout/Navbar';
import Skeleton from '@/components/ui/Skeleton';
import TitleH1 from '@/components/ui/TitleH1';
import TitleH2 from '@/components/ui/TitleH2';
import Stat from '@/components/ui/Stat';
import InfoLine from '@/components/ui/InfoLine';
import MarkdownTextEditor from '@/components/ui/MarkdownTextEditor';
import DynamicModal from '@/components/modals/DynamicModal';
import FormModal from '@/components/modals/FormModal';
import LinkifiedText from '@/components/ui/LinkifiedText';
import PersonnageAvatar from '@/components/personnages/PersonnageAvatar';
import DynamicIcon from '@/components/ui/DynamicIcon';

import { checkUserID } from "@/services/authorisation";
import { getSessionUser } from "@/services/session";
import { showModal, showModalID } from '@/utils/showModal';
import { runAction } from '@/utils/conflits';
import { journalModal } from '@/config/modals/journal';
import {
  apiRequest,
  getJournalById,
  getJournalContentById,
  getLinkedPlatforms,
  getPersonnagesOfJournal,
  getPersonnagesOfUser
} from "@/services/api"

const PER_PAGE_OPTIONS = [5, 10, 20, 50, 100];
const PER_PAGE_STORAGE_KEY = 'messagesPerPage';
const GROUP_DELAY_MS = 60 * 1000;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|bmp)$/i;
const LINK_MODAL_ID = 'journal-personnage-modal';

const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
const formatDay = (timestamp) => new Date(timestamp).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const dayKey = (timestamp) => new Date(timestamp).toDateString();
const formatSize = (bytes) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} Mo` : `${Math.max(1, Math.round((bytes || 0) / 1024))} Ko`;

// Couleur stable par auteur (pastille et nom)
const authorColor = (authorId) => {
  let hue = 0;
  for (const char of String(authorId ?? "")) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hue} 55% 45%)`;
};

// Messages consécutifs d'un même auteur, signés par le même personnage (ou aucun), à moins d'une minute d'intervalle,
// du plus ancien au plus récent. links : Map id du message -> association à un personnage
const groupMessages = (messages, links) => {
  const personnageOf = (message) => links.get(String(message.id))?.personnage.id ?? null;
  const sorted = [...(messages || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const groups = [];
  for (const message of sorted) {
    const group = groups[groups.length - 1];
    const last = group?.[group.length - 1];
    if (last && last.author?.id === message.author?.id && personnageOf(last) === personnageOf(message) && new Date(message.timestamp) - new Date(last.timestamp) < GROUP_DELAY_MS) {
      group.push(message);
    } else {
      groups.push([message]);
    }
  }
  return groups;
};

// Cache local des messages : affichage immédiat à l'ouverture, puis actualisation en arrière-plan
const CACHE_PREFIX = 'journal-content-';

const readCache = (journalId) => {
  try {
    const cached = JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${journalId}`));
    return cached?.content?.messages ? cached : null;
  } catch {
    return null;
  }
};

const writeCache = (journalId, content, savedAt) => {
  const key = `${CACHE_PREFIX}${journalId}`;
  const value = JSON.stringify({ savedAt, content });
  try {
    localStorage.setItem(key, value);
  } catch {
    // Stockage plein : on libère les caches des autres journaux, puis on réessaie une fois
    try {
      Object.keys(localStorage)
        .filter((other) => other.startsWith(CACHE_PREFIX) && other !== key)
        .forEach((other) => localStorage.removeItem(other));
      localStorage.setItem(key, value);
    } catch {
      // Cache indisponible : la page fonctionne sans
    }
  }
};

const readPerPage = () => {
  try {
    const saved = Number(localStorage.getItem(PER_PAGE_STORAGE_KEY));
    return PER_PAGE_OPTIONS.includes(saved) ? saved : 20;
  } catch {
    return 20;
  }
};

function Attachment({ attachment }) {
  if (IMAGE_EXTENSIONS.test(attachment.filename || "")) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block w-fit max-w-full">
        <img src={attachment.url} alt={attachment.filename} loading="lazy" className="max-h-96 max-w-full rounded-xl" />
      </a>
    );
  }
  return (
    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex flex-row items-center gap-2 w-fit max-w-full bg-base-100 hover:bg-base-300 transition-colors rounded-xl px-3 py-2">
      <FontAwesomeIcon icon="fa-solid fa-paperclip" className="opacity-70" />
      <span className="truncate">{attachment.filename}</span>
      <span className="text-xs opacity-60 shrink-0">{formatSize(attachment.size)}</span>
    </a>
  );
}

// canLink : l'utilisateur connecté est l'auteur Discord du message (compte Discord lié)
function Message({ message, link, canLink, onLink, onUnlink }) {
  const reactions = Object.entries(message.reactions || {});
  return (
    <div className="flex flex-col gap-2">
      {message.content ? (
        <p className="whitespace-pre-wrap break-words leading-relaxed">
          <LinkifiedText text={message.content} />
          {message.edited_at ? <span className="text-xs opacity-50 ml-1">(modifié)</span> : null}
        </p>
      ) : null}
      {(message.attachments || []).map((attachment, index) => (
        <Attachment key={`${message.id}-${index}`} attachment={attachment} />
      ))}
      {reactions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {reactions.map(([emoji, count]) => (
            <span key={emoji} className="inline-flex items-center gap-1 bg-base-100 rounded-full px-2.5 py-0.5 text-sm">
              <span>{emoji}</span>
              <span className="tabular-nums">{count}</span>
            </span>
          ))}
        </div>
      ) : null}
      {canLink ? (
        <div className="flex flex-row flex-wrap gap-1">
          <button type="button" className="btn btn-xs btn-ghost bg-base-100 gap-1" onClick={() => onLink(message, link)}>
            <FontAwesomeIcon icon="fa-solid fa-masks-theater" />
            {link ? "Changer de personnage" : "Associer à un personnage"}
          </button>
          {link ? (
            <button type="button" className="btn btn-xs btn-ghost bg-base-100 text-error" onClick={() => onUnlink(link)}>Dissocier</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MessageGroup({ group, links, myDiscordUid, onLink, onUnlink }) {
  const author = group[0].author || {};
  const personnage = links.get(String(group[0].id))?.personnage;
  const color = authorColor(author.id);
  const canLink = Boolean(myDiscordUid) && String(author.id) === String(myDiscordUid);
  return (
    <div className="flex flex-row gap-3 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
      {personnage ? (
        <a href={`/personnage/${personnage.id}`} className="shrink-0 h-fit" aria-label={`Fiche de ${personnage.name}`}>
          <PersonnageAvatar personnage={personnage} />
        </a>
      ) : (
        <span className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shrink-0" style={{ backgroundColor: color }}>
          {(author.name || "?").charAt(0).toUpperCase()}
        </span>
      )}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex flex-row flex-wrap items-baseline gap-x-2">
          {personnage ? (
            <>
              <a href={`/personnage/${personnage.id}`} className="font-bold break-words link link-hover">{personnage.name}</a>
              <span className="text-xs opacity-60 break-words">joué par {author.name || "auteur inconnu"}</span>
            </>
          ) : (
            <span className="font-bold break-words" style={{ color }}>{author.name || "Auteur inconnu"}</span>
          )}
          {author.is_bot ? <span className="badge badge-xs badge-info">BOT</span> : null}
          <span className="text-xs opacity-60">{formatTime(group[0].timestamp)}</span>
        </div>
        {group.map((message) => (
          <Message key={message.id} message={message} link={links.get(String(message.id))} canLink={canLink} onLink={onLink} onUnlink={onUnlink} />
        ))}
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="join">
      <button type="button" onClick={() => onChange(1)} disabled={page === 1} className="join-item btn btn-sm" title="Première page">
        <FontAwesomeIcon icon="fa-solid fa-angles-left" />
      </button>
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className="join-item btn btn-sm" title="Page précédente">
        <FontAwesomeIcon icon="fa-solid fa-angle-left" />
      </button>
      <span className="join-item btn btn-sm btn-active pointer-events-none tabular-nums">
        {page} / {totalPages}
      </span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} className="join-item btn btn-sm" title="Page suivante">
        <FontAwesomeIcon icon="fa-solid fa-angle-right" />
      </button>
      <button type="button" onClick={() => onChange(totalPages)} disabled={page === totalPages} className="join-item btn btn-sm" title="Dernière page">
        <FontAwesomeIcon icon="fa-solid fa-angles-right" />
      </button>
    </div>
  );
}

export default function JournalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = getSessionUser()?.id;
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(readPerPage);

  // content : derniers messages valides (cache puis API) ; ils restent affichés pendant une actualisation
  const [contentFor, setContentFor] = useState(id);
  const [content, setContent] = useState(() => readCache(id)?.content ?? null);
  const [updatedAt, setUpdatedAt] = useState(() => readCache(id)?.savedAt ?? null);
  const [fetching, setFetching] = useState(true);
  const [contentError, setContentError] = useState(null);

  // Personnages : associations du journal, compte Discord et personnages de l'utilisateur connecté
  const [links, setLinks] = useState([]);
  const [linksKey, setLinksKey] = useState(0);
  const [myDiscordUid, setMyDiscordUid] = useState(null);
  const [platformsChecked, setPlatformsChecked] = useState(false);
  const [myPersonnages, setMyPersonnages] = useState([]);
  const [linkRequest, setLinkRequest] = useState(null);

  // Changement de journal sans démontage de la page : on repart de son cache
  if (contentFor !== id) {
    const cached = readCache(id);
    setContentFor(id);
    setContent(cached?.content ?? null);
    setUpdatedAt(cached?.savedAt ?? null);
    setFetching(true);
    setContentError(null);
    setCurrentPage(1);
    setLinks([]);
  }

  const applyContent = (journalId, data) => {
    const next = data?.content;
    if (next && !next.error) {
      const savedAt = new Date().toISOString();
      setContent(next);
      setUpdatedAt(savedAt);
      setContentError(null);
      writeCache(journalId, next, savedAt);
    } else {
      setContentError(next?.message || "Impossible de récupérer les messages de ce journal.");
    }
  };

  const failContent = (error) => {
    console.error('Error fetching journal content:', error);
    setContentError("Impossible de récupérer les messages de ce journal.");
  };

  usePageTitle(journal?.title);

  useEffect(() => {
    let cancelled = false;

    getJournalById(id)
      .then((data) => {
        if (cancelled) return;
        setJournal(data.journal ?? null);
        checkUserID(data.journal?.user_id, setAuth);
      })
      .catch((error) => {
        console.error('Error fetching journal:', error);
        if (!cancelled) setJournal(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getJournalContentById(id)
      .then((data) => {
        if (!cancelled) applyContent(id, data);
      })
      .catch((error) => {
        if (!cancelled) failContent(error);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    getPersonnagesOfJournal(id)
      .then((list) => {
        if (!cancelled) setLinks(Array.isArray(list) ? list : []);
      })
      .catch((error) => console.error('Error fetching personnages of journal:', error));
    return () => {
      cancelled = true;
    };
  }, [id, linksKey]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getLinkedPlatforms()
      .then((list) => {
        if (!cancelled) setMyDiscordUid((Array.isArray(list) ? list : []).find((platform) => platform.platform === "discord")?.uid ?? null);
      })
      .catch((error) => console.error('Error fetching linked platforms:', error))
      .finally(() => {
        if (!cancelled) setPlatformsChecked(true);
      });
    getPersonnagesOfUser(userId)
      .then((list) => {
        if (!cancelled) setMyPersonnages(Array.isArray(list) ? list : []);
      })
      .catch((error) => console.error('Error fetching my personnages:', error));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // La modale est recréée pour chaque message (valeurs initiales) : on l'ouvre une fois montée
  useEffect(() => {
    if (linkRequest) showModalID(LINK_MODAL_ID);
  }, [linkRequest]);

  const reloadContent = () => {
    if (fetching) return;
    setFetching(true);
    getJournalContentById(id)
      .then((data) => applyContent(id, data))
      .catch(failContent)
      .finally(() => setFetching(false));
    setLinksKey((key) => key + 1);
  };

  const changePerPage = (value) => {
    setPerPage(value);
    setCurrentPage(1);
    try {
      localStorage.setItem(PER_PAGE_STORAGE_KEY, String(value));
    } catch {
      // Préférence non enregistrée : sans conséquence
    }
  };

  const openLink = (message, link) => {
    setLinkRequest((prev) => ({ message, link, count: (prev?.count ?? 0) + 1 }));
  };

  const submitLink = async (values) => {
    const data = await apiRequest("POST", "/personnages/messages", {
      journal_id: Number(id),
      message_id: String(linkRequest.message.id),
      personnage_id: Number(values.personnage_id),
    });
    Swal.fire({ icon: "success", title: "Message signé", text: data?.text ?? "Le message est associé à votre personnage." });
    setLinksKey((key) => key + 1);
  };

  const unlink = async (link) => {
    const result = await runAction(() => apiRequest("DELETE", `/personnages/messages/${link.id}`), {
      confirm: { title: "Dissocier ce message ?", text: `Il ne sera plus signé par ${link.personnage.name}.`, button: "Dissocier" },
    });
    if (result) setLinksKey((key) => key + 1);
  };

  const linksByMessage = useMemo(() => new Map(links.map((link) => [String(link.message_id), link])), [links]);
  const messages = useMemo(() => content?.messages || [], [content]);
  const groups = useMemo(() => groupMessages(messages, linksByMessage), [messages, linksByMessage]);
  const totalPages = Math.max(1, Math.ceil(groups.length / perPage));
  const page = Math.min(currentPage, totalPages);
  const pageGroups = groups.slice((page - 1) * perPage, page * perPage);

  const changePage = (value) => {
    setCurrentPage(Math.min(Math.max(value, 1), totalPages));
    document.getElementById('journal-messages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const authorsCount = new Set(messages.map((message) => message.author?.id)).size;
  const messageIds = new Set(messages.map((message) => String(message.id)));
  const personnagesCount = new Set(links.filter((link) => messageIds.has(String(link.message_id))).map((link) => link.personnage.id)).size;
  const lastGroup = groups[groups.length - 1];
  const lastMessageDate = lastGroup ? formatDate(lastGroup[lastGroup.length - 1].timestamp) : null;
  const published = formatDate(journal?.published_date);

  const btnReturn = { text: 'Retour à la bibliothèque', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/bibliotheque' };

  const FctModify = [
    { id: 0, title: 'Modifier', icon: "fas fa-pen", class: "bg-base-200 hover:bg-base-300", connected: true, authorisation: auth, function: () => showModal(journalModal, "edit") }
  ];

  const FctMessages = [
    { id: 1, title: "Rafraîchir", icon: "fas fa-rotate-right", class: "bg-base-200 hover:bg-base-300", connected: false, authorisation: true, function: reloadContent }
  ];

  // Premier chargement sans cache : rien à afficher en attendant l'API
  const waitingFirstContent = fetching && !content;
  const statValue = (value) => waitingFirstContent ? "…" : value;

  const BodyHTML = journal ? (
    <>
      <TitleH1 text={journal.title} icon="fas fa-newspaper" btn={btnReturn} fonctions={FctModify} />

      {/* En-tête : informations, chiffres clés et description */}
      <div className="flex flex-col gap-4 w-full bg-base-200 rounded-3xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="flex items-center justify-center w-16 h-16 rounded-full text-2xl shrink-0 bg-base-300 shadow-md">
            <DynamicIcon icon={journal.cover_icon || "fa-solid fa-newspaper"} fallback="fa-solid fa-newspaper" />
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <InfoLine icon="fa-solid fa-feather">
              {journal.author ? <>Rédigé par <strong>{journal.author}</strong></> : "Auteur inconnu"}
            </InfoLine>
            <InfoLine icon="fa-solid fa-calendar">
              {published ? `Publié le ${published}` : "Date de publication inconnue"}
            </InfoLine>
            {journal.uid ? <InfoLine icon="fa-brands fa-discord">Alimenté par un salon Discord</InfoLine> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <Stat icon="fa-solid fa-comments" label={messages.length > 1 ? "Messages" : "Message"} value={statValue(messages.length)} />
          <Stat icon="fa-solid fa-user-pen" label={authorsCount > 1 ? "Auteurs" : "Auteur"} value={statValue(authorsCount)} />
          <Stat icon="fa-solid fa-masks-theater" label={personnagesCount > 1 ? "Personnages" : "Personnage"} value={statValue(personnagesCount)} />
          <Stat icon="fa-solid fa-clock-rotate-left" label="Dernier message" value={statValue(lastMessageDate || "—")} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="flex flex-row items-center gap-2 font-bold">
            <FontAwesomeIcon icon="fas fa-pen-nib" />
            <span>Description</span>
          </span>
          <MarkdownTextEditor value={journal.description || 'Aucune description'} />
        </div>
      </div>

      <div id="journal-messages" className="w-full scroll-mt-24">
        <TitleH2 text="Messages" icon="fas fa-comments" fonctions={FctMessages} />
      </div>

      {userId && platformsChecked && !myDiscordUid && messages.length > 0 ? (
        <div role="note" className="flex flex-col sm:flex-row sm:items-center gap-3 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
          <FontAwesomeIcon icon="fa-solid fa-masks-theater" className="text-info text-xl shrink-0" />
          <p className="flex-1">Vous avez écrit dans ce journal ? Liez votre compte Discord pour signer vos messages du nom de vos personnages.</p>
          <a href="/profil" className="btn btn-sm btn-primary self-start sm:self-auto">Lier mon compte Discord</a>
        </div>
      ) : null}

      {content ? (
        <div className="flex flex-row items-center gap-2 w-full px-2 text-sm opacity-70">
          {fetching ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              <span>Actualisation des messages…</span>
            </>
          ) : updatedAt ? (
            <span>Mis à jour le {formatDate(updatedAt)} à {formatTime(updatedAt)}</span>
          ) : null}
        </div>
      ) : null}

      {contentError ? (
        <div role="alert" className="alert alert-warning alert-soft w-full">
          <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
          <span>{content ? `Actualisation impossible : ${contentError.replace(/\.?$/, '.')} Affichage des derniers messages enregistrés.` : contentError}</span>
        </div>
      ) : null}

      {waitingFirstContent ? (
        <div className="flex justify-center items-center py-12 w-full">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : !content ? null : groups.length === 0 ? (
        <i className="w-full">Ce journal ne contient encore aucun message.</i>
      ) : (
        <>
          {totalPages > 1 ? (
            <div className="flex justify-center w-full">
              <Pagination page={page} totalPages={totalPages} onChange={changePage} />
            </div>
          ) : null}

          <div className="flex flex-col gap-2 w-full">
            {pageGroups.map((group, index) => (
              <Fragment key={group[0].id}>
                {index === 0 || dayKey(group[0].timestamp) !== dayKey(pageGroups[index - 1][0].timestamp) ? (
                  <div className="divider my-1 text-sm opacity-70 first-letter:uppercase">{formatDay(group[0].timestamp)}</div>
                ) : null}
                <MessageGroup group={group} links={linksByMessage} myDiscordUid={myDiscordUid} onLink={openLink} onUnlink={unlink} />
              </Fragment>
            ))}
          </div>

          <div className="flex flex-row flex-wrap justify-center items-center gap-4 w-full mt-2">
            <label className="flex flex-row items-center gap-2 whitespace-nowrap">
              <span className="text-sm">Groupes par page</span>
              <select value={perPage} onChange={(e) => changePerPage(Number(e.target.value))} className="select select-bordered select-sm bg-base-100 w-20">
                {PER_PAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onChange={changePage} /> : null}
          </div>
        </>
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
          ) : !journal ? (
            <>
              <TitleH1 text="Journal introuvable" icon="fas fa-newspaper" btn={btnReturn} />
              <p>Ce journal n'existe pas ou n'est plus disponible.</p>
            </>
          ) : BodyHTML}

          <DynamicModal config={journalModal} mode="edit" onSubmit={(data) => { if (data.journal) setJournal(data.journal); }} onDelete={() => navigate('/bibliotheque')} />

          {myDiscordUid ? (
            <FormModal
              key={`link-${linkRequest?.count ?? 0}`}
              id={LINK_MODAL_ID}
              title="Associer à un personnage"
              intro="Le message apparaîtra au nom du personnage choisi dans ce journal et sur sa fiche."
              fields={[{
                name: "personnage_id", label: "Personnage", type: "select", required: true,
                options: myPersonnages.map(({ personnage }) => ({ value: personnage.id, label: personnage.name })),
                empty: "Vous n'avez encore aucun personnage : créez-en un depuis la page Personnages ou votre profil.",
              }]}
              initialValues={{
                personnage_id: linkRequest?.link ? String(linkRequest.link.personnage.id) : myPersonnages.length === 1 ? String(myPersonnages[0].personnage.id) : "",
              }}
              submitLabel="Associer"
              submitIcon="fas fa-masks-theater"
              onSubmit={submitLink}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}
