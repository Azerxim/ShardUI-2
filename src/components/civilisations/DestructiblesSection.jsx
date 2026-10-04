import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import EtatVide from '@/components/ui/EtatVide';
import DestructibleCard from '@/components/conflits/DestructibleCard';
import { getDestructiblesOfVille } from '@/services/api';
import { getSessionUser } from '@/services/session';
import { openMapEditor } from '@/services/mapEditor';

// ===== Zones et bâtiments destructibles d'une ville =====
// Ce qu'une guerre RP autorise à détruire : un marqueur par bâtiment, un polygone par zone, tracés dans
// l'éditeur de carte (?destructible=ID de la ville). Les dirigeants de la civilisation, les administrateurs
// et les modérateurs RP les désignent (mêmes règles que l'API, crud.check_cartographie_authorisation).

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
                    {tries.map((element) => <DestructibleCard key={element.id} element={element} dimension={dimension} />)}
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
