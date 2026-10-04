import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import MapEmbed from '@/components/carte/MapEmbed';
import { emplacement } from '@/utils/cartographie';

// Bâtiment (marqueur) ou zone (polygone) destructible d'une ville : fiche de la ville (DestructiblesSection) et cibles
// d'une guerre (CiblesSection). menace : badge « Menacé » quand une guerre en cours expose l'élément.

const GENRES = {
    batiment: { label: 'Bâtiment', sansNom: 'Bâtiment sans nom', icon: 'fa-solid fa-building' },
    zone: { label: 'Zone', sansNom: 'Zone sans nom', icon: 'fa-solid fa-draw-polygon' },
};

const genre = (element) => (element.shape_type === 'Marker' ? GENRES.batiment : GENRES.zone);

// Visuel de la carte : aperçu de la carte en vue Guerres (flamme du bâtiment, zone en pointillés),
// ou bandeau à la couleur de l'élément quand la dimension est inconnue
function Apercu({ element, dimension, lieu }) {
    const { icon } = genre(element);
    const couleur = element.color || '#c98a12';
    if (dimension && lieu) {
        return (
            <div className="relative h-40 w-full">
                <MapEmbed dimension={dimension} embed="guerres" x={lieu.x} z={lieu.z} zoom={lieu.zoom} width="100%" height="100%" title={`Carte : ${element.title || genre(element).sansNom}`} className="rounded-xl" />
                <span className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-lg text-white shadow pointer-events-none" style={{ backgroundColor: couleur }}>
                    <FontAwesomeIcon icon={icon} />
                </span>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center h-24 w-full rounded-xl text-white" style={{ background: `repeating-linear-gradient(135deg, ${couleur}, ${couleur} 12px, color-mix(in srgb, ${couleur} 80%, black) 12px, color-mix(in srgb, ${couleur} 80%, black) 24px)` }}>
            <FontAwesomeIcon icon={icon} size="2x" />
        </div>
    );
}

export default function DestructibleCard({ element, dimension = null, menace = false }) {
    const { label, sansNom } = genre(element);
    const lieu = emplacement(element);
    return (
        <li className="flex flex-col gap-3 bg-base-200 rounded-2xl p-3 border-t-4" style={{ borderTopColor: element.color || '#c98a12' }}>
            <Apercu element={element} dimension={dimension} lieu={lieu} />
            <span className="flex flex-col gap-0.5 min-w-0 px-1">
                <span className="flex flex-wrap items-center gap-2">
                    <strong className="truncate">{element.title || sansNom}</strong>
                    <span className="badge badge-ghost badge-sm">{label}</span>
                    {menace && <span className="badge badge-error badge-sm">Menacé</span>}
                </span>
                {element.description && <span className="text-sm opacity-80">{element.description}</span>}
                {lieu && <span className="text-xs opacity-60 tabular-nums">X {lieu.x} · Z {lieu.z}</span>}
            </span>
        </li>
    );
}
