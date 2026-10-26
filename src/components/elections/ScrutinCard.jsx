import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ENTITES_ELECTIONS, RESULTATS, finDuVote, heureScrutin, phaseScrutin } from '@/config/elections';
import { plural } from '@/utils/plural';

// Résumé d'un scrutin (section des fiches, page des élections) ; avecEntite : le nom de la civilisation, religion ou alliance
export default function ScrutinCard({ scrutin, avecEntite = false }) {
    const phase = phaseScrutin(scrutin.phase);
    const entite = ENTITES_ELECTIONS[scrutin.entite.type];
    let quand;
    if (scrutin.phase === 'candidatures') quand = `Vote du ${heureScrutin(scrutin.vote_debut)} au ${heureScrutin(scrutin.vote_fin)}`;
    else if (scrutin.phase === 'vote' || scrutin.phase === 'second_tour') quand = `Jusqu'au ${heureScrutin(finDuVote(scrutin))}`;
    else quand = scrutin.closed_at ? `Le ${heureScrutin(scrutin.closed_at)}` : null;

    return (
        <li>
            <a href={`/election/${scrutin.id}`} aria-label={scrutin.title} className="flex flex-col gap-2 bg-base-100 hover:bg-base-300 transition-colors rounded-2xl p-3 h-full">
                <span className="flex flex-row flex-wrap items-center gap-2">
                    <FontAwesomeIcon icon={phase.icon} className="opacity-70" />
                    <span className="font-bold break-words flex-1 min-w-0">{scrutin.title}</span>
                    <span className={`badge badge-sm ${phase.badge}`}>{phase.label}</span>
                </span>
                <span className="text-sm opacity-80 flex flex-row flex-wrap gap-x-3 gap-y-1">
                    {avecEntite && entite ? (
                        <span className="flex items-center gap-1">
                            <FontAwesomeIcon icon={entite.icon} className="opacity-70" />
                            {scrutin.entite.title}
                        </span>
                    ) : null}
                    {scrutin.poste ? <span className="flex items-center gap-1"><FontAwesomeIcon icon="fa-solid fa-crown" className="opacity-70" />{scrutin.poste.title}</span> : null}
                    <span>{plural(scrutin.candidats_count, 'candidat')}</span>
                    {quand ? <span>{quand}</span> : null}
                </span>
                {scrutin.phase === 'clos' ? (
                    <span className="text-sm font-semibold">
                        {scrutin.elu ? <><FontAwesomeIcon icon="fa-solid fa-award" className="mr-2 text-warning" />{scrutin.elu.nom} est élu</> : RESULTATS[scrutin.resultat]}
                    </span>
                ) : null}
            </a>
        </li>
    );
}
