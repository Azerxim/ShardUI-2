import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ENTITE_TYPES, PACTE_STATUTS, REVELATION_MODES, formatDateHeure, verifierEmpreinte } from '@/utils/actions';

const nomCompte = (user) => user?.full_name || user?.username || 'Compte supprimé';

// Auteur d'une action, ou partie d'un pacte : icône, lien vers sa fiche, sorte d'entité
function Entite({ entite }) {
    const type = entite ? ENTITE_TYPES[entite.type] : null;
    if (!type) return null;
    return (
        <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={type.icon} className="opacity-70" />
            {entite.deleted
                ? <span>{entite.title}</span>
                : <a href={type.href(entite.id)} className="link link-hover font-semibold">{entite.title}</a>}
            <span className="opacity-60">({type.label.toLowerCase()})</span>
        </span>
    );
}

// Carte d'une action secrète.
// - Scellée et inconnue : seulement son code, sa date de dépôt et son empreinte (ce que voit le public).
// - Connue (auteur, lecture tracée, ou révélée) : titre, auteur, guerre, contenu, lectures.
// - Pacte secret (action.pacte) : ses deux parties, son état (en attente, signé, refusé, retiré).
// onLire : lecture tracée proposée aux administrateurs et modérateurs RP ; onReveler : bouton « Révéler » ;
// onSigner, onRefuser (partie invitée) et onRetirer (partie qui propose) : réponse à un pacte en attente.
export default function ActionCard({ action, onLire = null, onReveler = null, onSigner = null, onRefuser = null, onRetirer = null, compact = false }) {
    const connue = action.content !== undefined;
    const [verification, setVerification] = useState(null);

    useEffect(() => {
        let annule = false;
        if (action.revealed && action.sel) {
            verifierEmpreinte(action).then((ok) => { if (!annule) setVerification(ok); });
        }
        return () => { annule = true; };
    }, [action]);

    const pacte = connue ? action.pacte : null;
    const statut = pacte ? PACTE_STATUTS[pacte.statut] : null;
    // Un pacte non signé n'est pas (encore) scellé au registre : sa bordure le distingue
    const bordure = action.revealed ? 'border-success' : pacte && pacte.statut !== 'signe' ? 'border-base-300' : 'border-warning';
    const boutons = onLire || onReveler || onSigner || onRefuser || onRetirer;

    return (
        <article id={action.code} className={`flex flex-col gap-3 rounded-2xl p-4 scroll-mt-24 border-l-4 bg-base-200 ${bordure} target:ring-2 target:ring-primary`}>
            <header className="flex flex-wrap items-center gap-2">
                <span className="badge badge-neutral font-mono">{action.code}</span>
                {pacte && pacte.statut !== 'signe'
                    ? <span className={`badge ${statut?.badge} badge-soft gap-1`}><FontAwesomeIcon icon={statut?.icon} />{statut?.label}</span>
                    : action.revealed
                        ? <span className="badge badge-success badge-soft gap-1"><FontAwesomeIcon icon="fa-solid fa-lock-open" />{pacte ? 'Révélé' : 'Révélée'}</span>
                        : <span className="badge badge-warning badge-soft gap-1"><FontAwesomeIcon icon="fa-solid fa-lock" />{pacte ? 'Scellé' : 'Scellée'}</span>}
                {pacte ? <span className="badge badge-primary badge-soft gap-1"><FontAwesomeIcon icon="fa-solid fa-handshake" />Pacte secret</span> : null}
                {connue && action.piege ? <span className="badge badge-error badge-soft gap-1"><FontAwesomeIcon icon="fa-solid fa-skull" />Piège mortel</span> : null}
                <span className="text-sm opacity-70">{pacte ? 'Proposé' : 'Scellée'} le {formatDateHeure(action.created_at)}</span>
            </header>

            {connue ? (
                <>
                    <h3 className="text-lg font-bold">{action.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {pacte ? (
                            <span className="flex flex-wrap items-center gap-2" aria-label="Parties du pacte">
                                <Entite entite={action.entite} />
                                <FontAwesomeIcon icon="fa-solid fa-arrows-left-right" className="opacity-50" />
                                <Entite entite={pacte.partie} />
                            </span>
                        ) : <Entite entite={action.entite} />}
                        {action.guerre && (
                            <span className="flex items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-shield-halved" className="opacity-70" />
                                <a href={`/guerre/${action.guerre.id}`} className="link link-hover">{action.guerre.title}</a>
                            </span>
                        )}
                    </div>
                    {!compact || action.revealed ? <p className="whitespace-pre-line break-words bg-base-100 rounded-xl p-3">{action.content}</p> : null}
                </>
            ) : (
                <p className="flex items-center gap-2 italic opacity-70">
                    <FontAwesomeIcon icon="fa-solid fa-envelope-circle-check" />
                    Contenu scellé jusqu'à sa révélation.
                </p>
            )}

            {pacte && pacte.statut !== 'en_attente' ? (
                <p className={`flex items-start gap-2 text-sm rounded-xl p-3 ${pacte.statut === 'signe' ? 'bg-success/10' : 'bg-base-100'}`}>
                    <FontAwesomeIcon icon={statut?.icon} className="mt-0.5 w-4" />
                    <span>
                        {pacte.statut === 'signe' ? `Signé par ${pacte.partie?.title}` : pacte.statut === 'refuse' ? `Refusé par ${pacte.partie?.title}` : `Retiré par ${action.entite?.title}`}
                        {pacte.reponse_at ? ` le ${formatDateHeure(pacte.reponse_at)}` : ''}
                        {pacte.reponse_by ? ` (${nomCompte(pacte.reponse_by)})` : ''}
                        {pacte.motif ? ` — motif : ${pacte.motif}` : ''}
                    </span>
                </p>
            ) : pacte ? (
                <p className="flex items-start gap-2 text-sm rounded-xl p-3 bg-info/10">
                    <FontAwesomeIcon icon="fa-solid fa-hourglass-half" className="mt-0.5 w-4" />
                    <span>En attente de la signature de {pacte.partie?.title}. Son texte ne peut plus changer ; tant qu'il n'est pas signé, seules les deux parties le voient.</span>
                </p>
            ) : null}

            {action.revealed && action.piege ? (
                <p className={`flex items-start gap-2 text-sm rounded-xl p-3 ${action.piege_verdict === 'mortel' ? 'bg-error/15' : action.piege_verdict ? 'bg-warning/15' : 'bg-base-100'}`}>
                    <FontAwesomeIcon icon={action.piege_verdict === 'mortel' ? 'fa-solid fa-skull' : action.piege_verdict ? 'fa-solid fa-user-injured' : 'fa-solid fa-gavel'} className="mt-0.5 w-4" />
                    <span>
                        {action.piege_verdict === 'mortel' ? 'Piège mortel, validé par la modération RP' : action.piege_verdict ? 'Le piège ne fait que blesser, selon la modération RP' : 'Piège en attente du jugement d\'un modérateur RP : tant qu\'il n\'est pas validé, il ne tue pas.'}
                        {action.piege_moderateur ? ` (${action.piege_moderateur.full_name || action.piege_moderateur.username}, le ${formatDateHeure(action.piege_decision_at)})` : ''}
                        {action.piege_note ? ` — ${action.piege_note}` : ''}
                    </span>
                </p>
            ) : null}

            <div className="flex flex-col gap-1 text-sm">
                {action.revealed ? (
                    <span className="flex items-center gap-2">
                        <FontAwesomeIcon icon="fa-solid fa-lock-open" className="opacity-70 w-4" />
                        <span>
                            Révélée le {formatDateHeure(action.revealed_at)} {REVELATION_MODES[action.reveal_mode] || ''}
                            {action.reveal_mode === 'moderateur' && action.revealed_by ? ` (${action.revealed_by.full_name || action.revealed_by.username})` : ''}
                            {action.reveal_motif ? ` — motif : ${action.reveal_motif}` : ''}
                        </span>
                    </span>
                ) : connue && action.reveal_at ? (
                    <span className="flex items-center gap-2">
                        <FontAwesomeIcon icon="fa-solid fa-hourglass-half" className="opacity-70 w-4" />
                        <span>Révélation automatique le {formatDateHeure(action.reveal_at)}</span>
                    </span>
                ) : null}
                <span className="flex items-center gap-2 min-w-0" title={`Empreinte SHA-256 publiée au dépôt : ${action.empreinte}`}>
                    <FontAwesomeIcon icon="fa-solid fa-fingerprint" className="opacity-70 w-4 shrink-0" />
                    <span className="font-mono text-xs truncate opacity-70">{action.empreinte}</span>
                    {verification === true && <span className="badge badge-success badge-sm shrink-0 gap-1"><FontAwesomeIcon icon="fa-solid fa-check" />Intacte</span>}
                    {verification === false && <span className="badge badge-error badge-sm shrink-0">Ne correspond pas</span>}
                </span>
            </div>

            {connue && Array.isArray(action.lectures) && (
                <div className="text-sm">
                    {action.lectures.length === 0 ? (
                        <span className="flex items-center gap-2 opacity-70">
                            <FontAwesomeIcon icon="fa-solid fa-eye-slash" className="w-4" />
                            {action.revealed ? "Personne ne l'a lue avant sa révélation." : "Aucun administrateur ni modérateur RP ne l'a lue."}
                        </span>
                    ) : (
                        <details open={!action.revealed}>
                            <summary className="cursor-pointer flex items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-eye" className="w-4" />
                                Lue {action.lectures.length} fois {action.revealed ? 'avant sa révélation' : 'par l\'équipe'} (lecture tracée)
                            </summary>
                            <ul className="mt-2 ml-6 list-disc">
                                {action.lectures.map((lecture, index) => (
                                    <li key={index}>{nomCompte(lecture.user)} ({lecture.role}), le {formatDateHeure(lecture.read_at)}</li>
                                ))}
                            </ul>
                        </details>
                    )}
                </div>
            )}

            {boutons && (
                <div className="flex flex-wrap gap-2">
                    {onSigner && (
                        <button type="button" className="btn btn-sm btn-success" onClick={onSigner}>
                            <FontAwesomeIcon icon="fa-solid fa-signature" />
                            Signer le pacte
                        </button>
                    )}
                    {onRefuser && (
                        <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={onRefuser}>
                            <FontAwesomeIcon icon="fa-solid fa-ban" />
                            Refuser
                        </button>
                    )}
                    {onRetirer && (
                        <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={onRetirer}>
                            <FontAwesomeIcon icon="fa-solid fa-rotate-left" />
                            Retirer la proposition
                        </button>
                    )}
                    {onLire && (
                        <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={onLire}>
                            <FontAwesomeIcon icon="fa-solid fa-eye" />
                            Lire (lecture tracée)
                        </button>
                    )}
                    {onReveler && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={onReveler}>
                            <FontAwesomeIcon icon="fa-solid fa-lock-open" />
                            Révéler
                        </button>
                    )}
                </div>
            )}
        </article>
    );
}
