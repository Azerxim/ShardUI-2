import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { MAPS_BASE_URL } from '@/config/maps';
import { foireEnCours, periodeFoire } from '@/config/marches';

// Foire annoncée par une ville (Shard-API crud_marches) : dates réelles, lieu (zone commerciale ou centre de la ville).
// dimension : pour le lien « Voir sur la carte » ; afficherVille : page des commerces ; actions : boutons de gestion
export default function FoireCard({ foire, dimension = null, afficherVille = false, actions = null }) {
    const enCours = foireEnCours(foire);
    return (
        <article id={`foire-${foire.id}`} className="flex flex-col gap-2 bg-base-200 rounded-2xl p-3 border-l-4 border-secondary scroll-mt-24">
            <div className="flex flex-row items-start gap-3">
                <FontAwesomeIcon icon="fa-solid fa-tents" className="text-xl mt-1 text-secondary" />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                        <strong className="break-words">{foire.title}</strong>
                        {enCours && <span className="badge badge-sm badge-success">En ce moment</span>}
                    </span>
                    <span className="text-sm first-letter:uppercase">{periodeFoire(foire)}{foire.horaires ? `, ${foire.horaires}` : ''}</span>
                    <span className="text-sm opacity-80 flex flex-wrap items-center gap-x-2">
                        {afficherVille && foire.ville && (
                            <a href={`/civilisation/${foire.ville.civilisation_id}/ville/${foire.ville.id}#marches`} className="link link-hover flex items-center gap-1">
                                <FontAwesomeIcon icon="fa-solid fa-city" className="opacity-70" />
                                {foire.ville.title}
                            </a>
                        )}
                        {foire.zone && <span className="flex items-center gap-1"><FontAwesomeIcon icon="fa-solid fa-store" className="opacity-70" />{foire.zone.title || 'Zone commerciale'}</span>}
                    </span>
                    {foire.description && <p className="text-sm opacity-80 break-words">{foire.description}</p>}
                </div>
                {actions && <span className="flex flex-row shrink-0">{actions}</span>}
            </div>
            {dimension?.link && foire.x != null && foire.z != null ? (
                <a href={`${MAPS_BASE_URL}/${dimension.link}-commerces#x=${foire.x}&z=${foire.z}&zoom=0`} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-ghost bg-base-100 self-start">
                    <FontAwesomeIcon icon="fa-solid fa-map-location-dot" />
                    Voir sur la carte
                </a>
            ) : null}
        </article>
    );
}
