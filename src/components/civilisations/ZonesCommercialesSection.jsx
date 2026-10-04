import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import EtatVide from '@/components/ui/EtatVide';
import ZoneCommercialeCard from '@/components/commerces/ZoneCommercialeCard';
import { getZonesCommercialesOfVille } from '@/services/api';
import { openMapEditor } from '@/services/mapEditor';
import { dansLaZone } from '@/utils/cartographie';

// ===== Zones commerciales d'une ville =====
// Marchés et quartiers marchands tracés dans l'éditeur de carte (?commerciale=ID de la ville) par les dirigeants de la
// civilisation. Les boutiques d'une zone sont les magasins de la ville situés à l'intérieur, d'après leur position.
// magasins : [{ magasin, commerce }] (magasins publics de la ville, déjà chargés par la fiche)
export default function ZonesCommercialesSection({ ville, dimension, auth, magasins = [] }) {
    const [zones, setZones] = useState(null);

    useEffect(() => {
        let annule = false;
        getZonesCommercialesOfVille(ville.id)
            .then((liste) => { if (!annule) setZones(Array.isArray(liste) ? liste : []); })
            .catch(() => { if (!annule) setZones([]); });
        return () => { annule = true; };
    }, [ville.id]);

    const ouvrirEditeur = () => {
        if (!dimension) {
            Swal.fire({ icon: 'error', title: 'Carte indisponible', text: 'La dimension de cette ville est inconnue.' });
            return;
        }
        openMapEditor({ dimension, type: 'commerciale', id: ville.id, x: ville.x, z: ville.z });
    };

    const fonctions = [
        { id: 1, title: 'Tracer', icon: 'fas fa-draw-polygon', class: 'bg-base-200 hover:bg-base-300', connected: true, authorisation: auth, tooltip: { text: 'Tracer les marchés et quartiers marchands sur la carte', position: 'left' }, function: ouvrirEditeur },
    ];

    let contenu;
    if (zones === null) {
        contenu = <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>;
    } else if (zones.length === 0) {
        contenu = (
            <EtatVide
                icon="fa-solid fa-store"
                texte="Cette ville n'a pas encore de zone commerciale."
                aide={auth
                    ? "Tracez sur la carte ses marchés et quartiers marchands : les magasins situés à l'intérieur y seront listés."
                    : "Les dirigeants de la civilisation tracent sur la carte les marchés et quartiers marchands de la ville."}
                action={auth ? { label: 'Tracer sur la carte', icon: 'fa-solid fa-draw-polygon', onClick: ouvrirEditeur } : null}
            />
        );
    } else {
        contenu = (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full items-start">
                {[...zones].sort((a, b) => (a.title || '').localeCompare(b.title || '')).map((zone) => (
                    <ZoneCommercialeCard
                        key={zone.id}
                        zone={zone}
                        dimension={dimension}
                        boutiques={magasins.filter(({ magasin }) => magasin.dimension_id === zone.dimension_id && dansLaZone(zone, magasin.x, magasin.z))}
                    />
                ))}
            </div>
        );
    }

    return (
        <>
            <TitleH2 text="Zones commerciales" icon="fas fa-store" fonctions={fonctions} aide="commerciale" />
            {contenu}
        </>
    );
}
