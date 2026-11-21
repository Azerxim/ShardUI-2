import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ANS_RP_PAR_SEMAINE, DEBUT_RP, dureeReelle, instantRp } from '@/config/temporalite';
import { SAISON } from '@/config/saison';

// Temporalité du RP sur l'accueil : la date du jour dans le RP, l'avancement de l'année et la règle de conversion
// (config/temporalite.js). Un jour RP dure moins d'un quart d'heure réel : la date est relue toutes les 30 secondes.

const REGLES = [
    { icon: 'fa-solid fa-calendar-week', valeur: `1 semaine`, texte: `réelle = ${ANS_RP_PAR_SEMAINE} ans RP` },
    { icon: 'fa-solid fa-hourglass-half', valeur: '3 jours ½', texte: 'réels = 1 an RP' },
    { icon: 'fa-solid fa-moon', valeur: '7 heures', texte: 'réelles = 1 mois RP' },
    { icon: 'fa-solid fa-sun', valeur: '≈ 14 minutes', texte: 'réelles = 1 jour RP' },
];

const dateReelle = (date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const instantReel = (date) => date.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default function TemporaliteRp({ className = '' }) {
    const [maintenant, setMaintenant] = useState(() => Date.now());

    useEffect(() => {
        const minuterie = setInterval(() => setMaintenant(Date.now()), 30000);
        return () => clearInterval(minuterie);
    }, []);

    const instant = instantRp(maintenant);

    return (
        <section id="temps-rp" aria-labelledby="temps-rp-titre" className={`flex flex-col gap-4 bg-base-200 rounded-3xl p-5 sm:p-6 scroll-mt-24 ${className}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-secondary text-secondary-content">
                    <FontAwesomeIcon icon="fa-solid fa-hourglass-half" size="xl" />
                </span>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h2 id="temps-rp-titre" className="text-sm font-semibold uppercase tracking-wide opacity-70">Le temps à Tetrago</h2>
                    {instant ? (
                        <>
                            <p className="text-2xl sm:text-3xl font-display" aria-live="polite">Nous sommes le {instant.texte}</p>
                            <p className="text-sm opacity-80">
                                L'an {instant.an + 1} commence {instantReel(instant.debutAnSuivant)}, dans {dureeReelle(instant.debutAnSuivant.getTime() - maintenant)}.
                            </p>
                        </>
                    ) : (
                        <p className="text-2xl sm:text-3xl font-display">
                            L'an 1 commencera {DEBUT_RP ? `le ${dateReelle(DEBUT_RP)}` : `à l'ouverture de la saison ${SAISON}`}
                        </p>
                    )}
                </div>
            </div>

            {instant ? (
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs opacity-70">
                        <span>An {instant.an}</span>
                        <span>{Math.floor(instant.avancement * 100)} % de l'année écoulée</span>
                    </div>
                    <progress className="progress progress-secondary w-full" value={instant.avancement} max="1" aria-label={`Avancement de l'an ${instant.an}`} />
                </div>
            ) : null}

            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-2" aria-label="Correspondance entre le temps réel et le temps du RP">
                {REGLES.map((regle) => (
                    <li key={regle.valeur} className="flex items-center gap-3 bg-base-100 rounded-2xl p-3 min-w-0">
                        <FontAwesomeIcon icon={regle.icon} className="opacity-70 shrink-0" />
                        <span className="flex flex-col min-w-0">
                            <strong>{regle.valeur}</strong>
                            <span className="text-xs opacity-80">{regle.texte}</span>
                        </span>
                    </li>
                ))}
            </ul>
            {instant ? <p className="text-xs opacity-70">L'an 1 a commencé le {dateReelle(DEBUT_RP)}, avec la saison {SAISON}.</p> : null}
        </section>
    );
}
