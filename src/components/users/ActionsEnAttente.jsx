import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Aide from '@/components/aide/Aide';
import { getMesGuerres } from '@/services/api';
import { getSessionUser } from '@/services/session';

// Ce qui attend le joueur connecté, affiché sur l'accueil et le profil :
// appels aux armes à accepter, déclarations de guerre en attente de validation, déclarations à valider (modérateurs).
// Rien n'est affiché sans session ni quand tout est à jour.
export default function ActionsEnAttente({ className = '' }) {
    const [user] = useState(getSessionUser);
    const [mine, setMine] = useState(null);

    useEffect(() => {
        if (!user) return;
        let annule = false;
        getMesGuerres()
            .then((data) => { if (!annule) setMine(data); })
            .catch(() => { });
        return () => { annule = true; };
    }, [user]);

    if (!mine) return null;
    const appels = mine.appels?.length || 0;
    const enAttente = mine.mes_guerres?.length || 0;
    const aValider = mine.a_valider?.length || 0;
    if (!appels && !enAttente && !aValider) return null;

    const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
    return (
        <section aria-label="À traiter" className={`flex flex-col gap-2 w-full ${className}`}>
            {appels > 0 && (
                <div role="alert" className="alert alert-error alert-soft rounded-2xl">
                    <FontAwesomeIcon icon="fa-solid fa-bullhorn" />
                    <span className="flex items-center gap-2">
                        {appels > 1 ? `${appels} appels aux armes attendent` : "Un appel aux armes attend"} votre réponse.
                        <Aide terme="appel" />
                    </span>
                    <a href="/guerres" className="btn btn-sm">Répondre</a>
                </div>
            )}
            {aValider > 0 && (
                <div role="alert" className="alert alert-warning alert-soft rounded-2xl">
                    <FontAwesomeIcon icon="fa-solid fa-gavel" />
                    <span>{pluriel(aValider, 'déclaration')} de guerre à valider en tant que modérateur RP.</span>
                    <a href="/guerres" className="btn btn-sm">Traiter</a>
                </div>
            )}
            {enAttente > 0 && aValider === 0 && (
                <div role="status" className="alert alert-info alert-soft rounded-2xl">
                    <FontAwesomeIcon icon="fa-solid fa-hourglass-half" />
                    <span className="flex items-center gap-2">
                        {enAttente > 1 ? `Vos ${enAttente} déclarations de guerre attendent` : "Votre déclaration de guerre attend"} la validation d'un modérateur RP.
                        <Aide terme="moderateur" />
                    </span>
                    <a href="/guerres" className="btn btn-sm btn-ghost">Voir</a>
                </div>
            )}
        </section>
    );
}
