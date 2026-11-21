import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import { getGenerationCarte, lancerGenerationCarte } from '@/services/api';
import { alerteErreur } from '@/utils/alerteErreur';

// Génération de la carte à la demande, sur la page des statistiques du monde (administrateurs) : Shard-API lance le
// générateur de Shard-Maps (services/generation_carte.py), comme la tâche du lundi : téléchargement du monde, cartes,
// monde téléchargeable et relevé. Pendant la génération, l'état est relu toutes les 10 secondes ; à la fin, onTermine
// recharge les statistiques.

const RESULTATS = {
    termine: { label: 'Terminée', badge: 'badge-success' },
    erreur: { label: 'En erreur', badge: 'badge-error' },
    inconnu: { label: 'Interrompue ?', badge: 'badge-warning' },
};

const dateHeure = (iso) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—');

export default function GenerationCarte({ onTermine }) {
    const [etat, setEtat] = useState(null);
    const [envoi, setEnvoi] = useState(false);

    const relire = useCallback(() => getGenerationCarte().then(setEtat).catch(() => setEtat({ disponible: false, raison: "État du générateur illisible." })), []);

    useEffect(() => { relire(); }, [relire]);

    // Relecture pendant la génération ; à la fin, les statistiques sont rechargées
    useEffect(() => {
        if (!etat?.en_cours) return undefined;
        const minuterie = setInterval(async () => {
            const suivant = await getGenerationCarte().catch(() => null);
            if (!suivant) return;
            setEtat(suivant);
            if (!suivant.en_cours) onTermine?.();
        }, 10000);
        return () => clearInterval(minuterie);
    }, [etat?.en_cours, onTermine]);

    const lancer = async () => {
        const confirmation = await Swal.fire({
            icon: 'question',
            title: 'Générer la carte maintenant ?',
            text: "Le monde est téléchargé depuis le serveur, puis les cartes, le monde téléchargeable et les statistiques sont mis à jour. Cela prend plusieurs minutes ; le serveur Minecraft suspend ses sauvegardes pendant la copie.",
            showCancelButton: true,
            confirmButtonText: 'Générer',
            cancelButtonText: 'Annuler',
        });
        if (!confirmation.isConfirmed) return;
        setEnvoi(true);
        try {
            setEtat(await lancerGenerationCarte());
        } catch (err) {
            alerteErreur('Génération impossible', err);
            relire();
        } finally {
            setEnvoi(false);
        }
    };

    const journal = etat?.journal;
    const resultat = journal ? RESULTATS[journal.resultat] ?? RESULTATS.inconnu : null;

    return (
        <section id="generation" aria-labelledby="generation-titre" className="flex flex-col gap-3 bg-base-200 rounded-2xl p-3 sm:p-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h2 id="generation-titre" className="flex items-center gap-2 font-bold text-lg">
                        <FontAwesomeIcon icon="fa-solid fa-map" />
                        Génération de la carte
                        {etat?.en_cours ? <span className="badge badge-info badge-sm gap-1"><span className="loading loading-spinner loading-xs"></span>En cours</span> : null}
                    </h2>
                    <span className="text-sm opacity-70" aria-live="polite">
                        {etat === null ? 'Lecture de l\'état du générateur…'
                            : !etat.disponible ? etat.raison
                            : `Dernière carte publiée : ${etat.date_carte || 'aucune'}. Génération automatique chaque lundi à 4 h.`}
                    </span>
                </div>
                <button type="button" onClick={lancer} disabled={!etat?.disponible || etat?.en_cours || envoi} className="btn btn-primary rounded-3xl shrink-0">
                    {envoi || etat?.en_cours ? <span className="loading loading-spinner loading-sm"></span> : <FontAwesomeIcon icon="fa-solid fa-rotate" />}
                    {etat?.en_cours ? 'Génération en cours' : 'Générer la carte'}
                </button>
            </div>
            {journal ? (
                <details className="text-sm">
                    <summary className="cursor-pointer flex flex-wrap items-center gap-2">
                        Dernier passage du générateur : {dateHeure(journal.debut)}
                        {!etat.en_cours ? <span className={`badge badge-sm ${resultat.badge}`}>{resultat.label}</span> : null}
                    </summary>
                    <pre className="mt-2 bg-base-100 rounded-xl p-3 text-xs overflow-x-auto whitespace-pre-wrap">{journal.lignes.join('\n')}</pre>
                </details>
            ) : null}
        </section>
    );
}
