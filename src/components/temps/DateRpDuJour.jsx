import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { dureeReelle, instantRp } from '@/config/temporalite';
import { SAISON } from '@/config/saison';

// Bandeau compact de la date du jour dans le RP (config/temporalite.js), pour les pages qui parlent d'histoire
// (chroniques) ; le détail de la règle du temps est sur l'accueil (#temps-rp). Relue toutes les 30 secondes.
export default function DateRpDuJour({ className = '' }) {
    const [maintenant, setMaintenant] = useState(() => Date.now());

    useEffect(() => {
        const minuterie = setInterval(() => setMaintenant(Date.now()), 30000);
        return () => clearInterval(minuterie);
    }, []);

    const instant = instantRp(maintenant);

    return (
        <div role="status" aria-label="Date du jour dans le RP" className={`flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 bg-base-200 rounded-3xl px-4 py-3 w-full ${className}`}>
            <span className="flex items-center gap-2 font-semibold">
                <FontAwesomeIcon icon="fa-solid fa-hourglass-half" className="text-secondary" />
                {instant ? `Aujourd'hui, nous sommes le ${instant.texte}` : `L'an 1 commencera à l'ouverture de la saison ${SAISON}`}
            </span>
            {instant ? (
                <span className="text-sm opacity-70">
                    L'an {instant.an + 1} commence dans {dureeReelle(instant.debutAnSuivant.getTime() - maintenant)} ·{' '}
                    <a href="/#temps-rp" className="link link-hover">1 semaine réelle = 2 ans RP</a>
                </span>
            ) : null}
        </div>
    );
}
