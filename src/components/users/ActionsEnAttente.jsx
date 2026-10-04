import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Aide from '@/components/aide/Aide';
import { getAjustementsEnAttente, getMesGuerres } from '@/services/api';
import { getSessionUser } from '@/services/session';

// Ce qui attend le joueur connecté, affiché sur l'accueil et le profil :
// appels aux armes à accepter, déclarations de guerre en attente de validation, déclarations à valider (modérateurs),
// ajustements de population à valider (modérateurs).
// Rien n'est affiché sans session ni quand tout est à jour.
export default function ActionsEnAttente({ className = '' }) {
    const [user] = useState(getSessionUser);
    const [mine, setMine] = useState(null);
    const [ajustements, setAjustements] = useState([]);

    useEffect(() => {
        if (!user) return;
        let annule = false;
        getMesGuerres()
            .then((data) => { if (!annule) setMine(data); })
            .catch(() => { });
        // Demandé pour tout joueur connecté : le rôle de modérateur stocké dans le navigateur peut dater d'avant
        // sa nomination ; l'API refuse simplement les autres (erreur ignorée)
        getAjustementsEnAttente()
            .then((data) => { if (!annule) setAjustements(Array.isArray(data) ? data.filter((a) => a.demande_par?.id !== user.id) : []); })
            .catch(() => { });
        return () => { annule = true; };
    }, [user]);

    if (!mine && !ajustements.length) return null;
    const appels = mine?.appels?.length || 0;
    const enAttente = mine?.mes_guerres?.length || 0;
    const aValider = mine?.a_valider?.length || 0;
    if (!appels && !enAttente && !aValider && !ajustements.length) return null;

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
            {ajustements.length > 0 && (
                <div role="alert" className="alert alert-warning alert-soft rounded-2xl">
                    <FontAwesomeIcon icon="fa-solid fa-scale-balanced" />
                    <span className="flex flex-col gap-1">
                        <span>{pluriel(ajustements.length, 'ajustement')} de population à valider en tant que modérateur RP :</span>
                        <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                            {ajustements.slice(0, 5).map((a) => (
                                <a key={a.id} href={`/civilisation/${a.ville.civilisation_id}/ville/${a.ville.id}#population`} className="link">
                                    {a.ville.title} ({a.ecart > 0 ? '+' : '−'}{Math.abs(a.ecart)})
                                </a>
                            ))}
                        </span>
                    </span>
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
