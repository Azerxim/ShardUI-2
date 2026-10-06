import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Aide from '@/components/aide/Aide';
import { getMesGuerres, getTableauModeration } from '@/services/api';
import { getSessionUser } from '@/services/session';

// Ce qui attend le joueur connecté, affiché sur l'accueil et le profil :
// appels aux armes à accepter, déclarations de guerre en attente de validation, et pour les modérateurs RP les
// décisions du tableau de bord (/moderation : guerres, ajustements de population, fermes, pièges).
// Rien n'est affiché sans session ni quand tout est à jour.
export default function ActionsEnAttente({ className = '' }) {
    const [user] = useState(getSessionUser);
    const [mine, setMine] = useState(null);
    // Modérateurs : décisions qu'ils peuvent prendre ({ guerres, ajustements, fermes, pieges }), hors leurs propres demandes
    const [moderation, setModeration] = useState(null);

    useEffect(() => {
        if (!user) return;
        let annule = false;
        getMesGuerres()
            .then((data) => { if (!annule) setMine(data); })
            .catch(() => { });
        // Demandé pour tout joueur connecté : le rôle de modérateur stocké dans le navigateur peut dater d'avant
        // sa nomination ; l'API refuse simplement les autres (erreur ignorée)
        getTableauModeration()
            .then((data) => {
                if (annule || !data?.a_traiter) return;
                const { guerres, ajustements, fermes, pieges } = data.a_traiter;
                setModeration({ guerres: guerres.length, ajustements: ajustements.filter((a) => !a.propre).length, fermes: fermes.length, pieges: pieges.filter((p) => !p.propre).length });
            })
            .catch(() => { });
        return () => { annule = true; };
    }, [user]);

    const appels = mine?.appels?.length || 0;
    const enAttente = mine?.mes_guerres?.length || 0;
    const aValider = mine?.a_valider?.length || 0;
    const decisions = moderation ? moderation.guerres + moderation.ajustements + moderation.fermes + moderation.pieges : 0;
    if (!appels && !enAttente && !decisions) return null;

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
            {decisions > 0 && (
                <div role="alert" className="alert alert-warning alert-soft rounded-2xl">
                    <FontAwesomeIcon icon="fa-solid fa-gavel" />
                    <span className="flex flex-col gap-1">
                        <span>{decisions > 1 ? `${decisions} décisions attendent` : 'Une décision attend'} la modération RP :</span>
                        <span className="text-sm opacity-80">
                            {[
                                moderation.guerres && pluriel(moderation.guerres, 'déclaration') + ' de guerre',
                                moderation.ajustements && pluriel(moderation.ajustements, 'ajustement') + ' de population',
                                moderation.fermes && pluriel(moderation.fermes, 'ferme'),
                                moderation.pieges && pluriel(moderation.pieges, 'piège'),
                            ].filter(Boolean).join(' · ')}
                        </span>
                    </span>
                    <a href="/moderation" className="btn btn-sm">Tableau de bord</a>
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
