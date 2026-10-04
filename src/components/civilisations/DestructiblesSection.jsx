import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import EtatVide from '@/components/ui/EtatVide';
import MapEmbed from '@/components/carte/MapEmbed';
import { getDestructiblesOfVille } from '@/services/api';
import { getSessionUser } from '@/services/session';
import { openMapEditor } from '@/services/mapEditor';
import { emplacement } from '@/utils/cartographie';

// ===== Zones et bâtiments destructibles d'une ville =====
// Ce qu'une guerre RP autorise à détruire : un marqueur par bâtiment, un polygone par zone, tracés dans
// l'éditeur de carte (?destructible=ID de la ville). Les dirigeants de la civilisation, les administrateurs
// et les modérateurs RP les désignent (mêmes règles que l'API, crud.check_cartographie_authorisation).

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

export default function DestructiblesSection({ ville, dimension, auth }) {
    const user = getSessionUser();
    const peutDesigner = Boolean(auth || user?.is_admin || user?.is_moderateur);
    const [elements, setElements] = useState(null);

    useEffect(() => {
        let annule = false;
        getDestructiblesOfVille(ville.id)
            .then((liste) => { if (!annule) setElements(Array.isArray(liste) ? liste : []); })
            .catch(() => { if (!annule) setElements([]); });
        return () => { annule = true; };
    }, [ville.id]);

    const ouvrirEditeur = () => {
        if (!dimension) {
            Swal.fire({ icon: 'error', title: 'Carte indisponible', text: 'La dimension de cette ville est inconnue.' });
            return;
        }
        openMapEditor({ dimension, type: 'destructible', id: ville.id, x: ville.x, z: ville.z });
    };

    const fonctions = [
        { id: 1, title: 'Sélectionner', icon: 'fas fa-crosshairs', class: 'bg-base-200 hover:bg-base-300', connected: true, authorisation: peutDesigner, tooltip: { text: 'Désigner sur la carte les bâtiments et zones destructibles', position: 'left' }, function: ouvrirEditeur },
    ];

    // Bâtiments d'abord, puis zones, chacun par ordre alphabétique
    const tries = [...(elements || [])].sort((a, b) => (
        Number(b.shape_type === 'Marker') - Number(a.shape_type === 'Marker') || (a.title || '').localeCompare(b.title || '')
    ));
    const batiments = tries.filter((element) => element.shape_type === 'Marker').length;

    let contenu;
    if (elements === null) {
        contenu = <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>;
    } else if (elements.length === 0) {
        contenu = (
            <EtatVide
                icon="fa-solid fa-shield-halved"
                texte="Aucun bâtiment ni aucune zone n'est désigné comme destructible."
                aide={peutDesigner
                    ? "Désignez sur la carte ce qu'une guerre RP autorise à détruire dans cette ville : un marqueur par bâtiment, un polygone par zone."
                    : "Les dirigeants de la civilisation et les modérateurs RP désignent sur la carte ce qu'une guerre RP autorise à détruire."}
                action={peutDesigner ? { label: 'Sélectionner sur la carte', icon: 'fa-solid fa-crosshairs', onClick: ouvrirEditeur } : null}
            />
        );
    } else {
        contenu = (
            <>
                <p className="text-sm opacity-70 px-1 w-full">
                    Ce qu'une guerre RP autorise à détruire dans cette ville : {batiments} bâtiment{batiments > 1 ? 's' : ''} et {elements.length - batiments} zone{elements.length - batiments > 1 ? 's' : ''}.
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
                    {tries.map((element) => {
                        const { label, sansNom } = genre(element);
                        const lieu = emplacement(element);
                        return (
                            <li key={element.id} className="flex flex-col gap-3 bg-base-200 rounded-2xl p-3 border-t-4" style={{ borderTopColor: element.color || '#c98a12' }}>
                                <Apercu element={element} dimension={dimension} lieu={lieu} />
                                <span className="flex flex-col gap-0.5 min-w-0 px-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <strong className="truncate">{element.title || sansNom}</strong>
                                        <span className="badge badge-ghost badge-sm">{label}</span>
                                    </span>
                                    {element.description && <span className="text-sm opacity-80">{element.description}</span>}
                                    {lieu && <span className="text-xs opacity-60 tabular-nums">X {lieu.x} · Z {lieu.z}</span>}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </>
        );
    }

    return (
        <>
            <TitleH2 text="Zones et bâtiments destructibles" icon="fas fa-burst" fonctions={fonctions} aide="destructible" />
            {contenu}
        </>
    );
}
