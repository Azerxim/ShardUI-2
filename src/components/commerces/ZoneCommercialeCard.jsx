import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import MapEmbed from '@/components/carte/MapEmbed';
import { MAPS_BASE_URL } from '@/config/maps';
import { emplacement } from '@/utils/cartographie';

// Carte d'une zone commerciale (marché, quartier marchand) : aperçu de la carte en vue Commerces, nom, description,
// ville (page des commerces) et boutiques qui s'y tiennent (magasins situés à l'intérieur).
// boutiques : [{ magasin, commerce }] ; dimension : pour l'aperçu et le lien « Voir sur la carte » (vue Commerces)
export default function ZoneCommercialeCard({ zone, boutiques = [], dimension = null, ville = null, apercu = true }) {
    const couleur = zone.color || '#e3a82b';
    const lieu = emplacement(zone);
    return (
        <article className="flex flex-col gap-3 bg-base-200 rounded-2xl p-3 border-t-4" style={{ borderTopColor: couleur }}>
            {apercu && dimension && lieu ? (
                <div className="h-40 w-full">
                    <MapEmbed dimension={dimension} embed="commerces" x={lieu.x} z={lieu.z} zoom={lieu.zoom} width="100%" height="100%" title={`Carte : ${zone.title || 'zone commerciale'}`} className="rounded-xl" />
                </div>
            ) : null}
            <div className="flex flex-col gap-1 px-1 min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                    <FontAwesomeIcon icon="fa-solid fa-store" style={{ color: couleur }} />
                    <strong className="truncate">{zone.title || 'Zone commerciale sans nom'}</strong>
                </span>
                {ville && (
                    <a href={`/civilisation/${ville.civilisation_id}/ville/${ville.id}`} className="text-sm link link-hover opacity-80 flex items-center gap-2">
                        <FontAwesomeIcon icon="fa-solid fa-city" className="opacity-70" />
                        {ville.title}
                    </a>
                )}
                {zone.description && <p className="text-sm opacity-80">{zone.description}</p>}
                {lieu && <span className="text-xs opacity-60 tabular-nums">X {lieu.x} · Z {lieu.z}</span>}
            </div>
            {dimension?.link && lieu ? (
                <a
                    href={`${MAPS_BASE_URL}/${dimension.link}-commerces#x=${lieu.x}&z=${lieu.z}&zoom=${lieu.zoom}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-ghost bg-base-100 self-start mx-1"
                >
                    <FontAwesomeIcon icon="fa-solid fa-map-location-dot" />
                    Voir sur la carte
                </a>
            ) : null}
            <div className="px-1">
                <p className="text-sm font-semibold mb-1">
                    {boutiques.length === 0 ? "Aucune boutique pour l'instant" : `${boutiques.length} boutique${boutiques.length > 1 ? 's' : ''}`}
                </p>
                {boutiques.length > 0 && (
                    <ul className="flex flex-col gap-1">
                        {boutiques.map(({ magasin, commerce }) => (
                            <li key={magasin.id}>
                                <a href={`/commerce/${commerce.id}`} className="flex items-center gap-2 text-sm bg-base-100 rounded-xl px-3 py-1.5 hover:bg-base-300">
                                    <FontAwesomeIcon icon={magasin.is_siege ? 'fa-solid fa-building' : 'fa-solid fa-shop'} className="opacity-70 w-4" />
                                    <span className="font-semibold truncate">{magasin.title}</span>
                                    <span className="opacity-60 truncate">{commerce.title}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </article>
    );
}
