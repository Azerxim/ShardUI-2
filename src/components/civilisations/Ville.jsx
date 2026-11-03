import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { formatInfluence, religionColor } from '@/utils/religionColor';

const influenceOf = (religion) => Math.max(0, Number(religion.influence) || 0);

// Ligne d'une ville dans la liste d'une civilisation (charte « Chancellerie ») : nom, capitale, population et religion
// majoritaire. La carte et la description restent sur la fiche de la ville.
export default function Ville({ info }) {
    const majoritaire = [...(info.religions || [])].sort((a, b) => influenceOf(b) - influenceOf(a))[0] ?? null;
    const population = Number(info.population) || 0;

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_8rem_minmax(0,12rem)] items-center gap-x-4 gap-y-1 w-full ligne-fiche">
            <span className="flex flex-row flex-wrap items-center gap-2 min-w-0">
                <FontAwesomeIcon icon={info.is_capital ? 'fa-solid fa-archway' : 'fa-solid fa-city'} fixedWidth className="opacity-70" />
                <span className="font-bold break-words">{info.title}</span>
                {info.is_capital ? <span className="badge badge-sm badge-primary">Capitale</span> : null}
                {info.is_public === false ? <span className="badge badge-sm badge-warning">Privée</span> : null}
            </span>
            <span className="text-sm opacity-70 tabular-nums text-right sm:text-left">
                {population > 0 ? `${population.toLocaleString('fr-FR')} habitant${population > 1 ? 's' : ''}` : 'Population inconnue'}
            </span>
            <span className="col-span-2 sm:col-span-1 flex flex-row items-center gap-2 text-sm min-w-0">
                {majoritaire ? (
                    <>
                        <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: religionColor(majoritaire) }}></span>
                        <span className="truncate">{majoritaire.title}</span>
                        <span className="opacity-70 tabular-nums shrink-0">{formatInfluence(influenceOf(majoritaire))}</span>
                    </>
                ) : (
                    <span className="opacity-70">Sans religion déclarée</span>
                )}
            </span>
        </div>
    );
}
