import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import TitleH2 from '@/components/ui/TitleH2';
import DestructibleCard from '@/components/conflits/DestructibleCard';
import { getCiblesGuerre } from '@/services/api';
import { plural } from '@/utils/plural';

// ===== Cibles d'une guerre =====
// Bâtiments et zones destructibles des villes des belligérants engagés, camp par camp (Shard-API crud_conflits.cibles_guerre) :
// ce que la guerre autorise à détruire, et rien d'autre (Codex, « Guerres & batailles »). Une ville se déplie à la demande :
// chaque élément a un aperçu de carte (iframe), trop lourd pour tout charger d'un coup.

const CAMPS = [
    { cle: 'attaquant', titre: 'Camp attaquant', icon: 'fa-solid fa-khanda' },
    { cle: 'defenseur', titre: 'Camp défenseur', icon: 'fa-solid fa-shield-halved' },
];

function VilleCibles({ ville, dimension, enCours }) {
    const [ouverte, setOuverte] = useState(false);
    const nombre = ville.destructibles.length;
    return (
        <li className="flex flex-col gap-2">
            <div className="flex flex-row flex-wrap items-center gap-2 bg-base-100 rounded-xl px-3 py-2">
                <button type="button" className="flex flex-row items-center gap-2 flex-1 min-w-0 text-left disabled:cursor-default" onClick={() => setOuverte(!ouverte)} disabled={nombre === 0} aria-expanded={ouverte}>
                    <FontAwesomeIcon icon="fa-solid fa-chevron-right" className={`w-3 opacity-70 transition-transform ${ouverte ? 'rotate-90' : ''} ${nombre === 0 ? 'invisible' : ''}`} />
                    <FontAwesomeIcon icon="fa-solid fa-city" className="opacity-70" />
                    <span className="font-semibold truncate">{ville.title}</span>
                    <span className="text-sm opacity-70 shrink-0">{nombre === 0 ? 'rien de désigné' : plural(nombre, 'cible')}</span>
                </button>
                <a href={`/civilisation/${ville.civilisation_id}/ville/${ville.id}`} className="btn btn-xs btn-ghost" aria-label={`Fiche de ${ville.title}`}>
                    <FontAwesomeIcon icon="fa-solid fa-arrow-up-right-from-square" />
                </a>
            </div>
            {ouverte && (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ville.destructibles.map((element) => <DestructibleCard key={element.id} element={element} dimension={dimension} menace={enCours} />)}
                </ul>
            )}
        </li>
    );
}

export default function CiblesSection({ guerre, dimensions = [] }) {
    const [cibles, setCibles] = useState(null);

    useEffect(() => {
        let annule = false;
        getCiblesGuerre(guerre.id)
            .then((data) => { if (!annule) setCibles(data); })
            .catch(() => { if (!annule) setCibles({ attaquant: [], defenseur: [] }); });
        return () => { annule = true; };
    }, [guerre.id]);

    const enCours = guerre.status === 'en_cours';
    const dimensionDe = (ville) => dimensions.find((dimension) => dimension.id === ville.dimension_id) ?? null;

    return (
        <section id="cibles" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Cibles" icon="fas fa-house-crack" aide="cible" />
            <p className="text-sm opacity-70 px-1">
                Bâtiments et zones que chaque ville des belligérants a désignés comme destructibles : la guerre n'autorise à détruire que ceux-là.
            </p>
            {cibles === null ? (
                <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-start">
                    {CAMPS.map(({ cle, titre, icon }) => {
                        const belligerants = cibles[cle] || [];
                        const total = belligerants.reduce((somme, b) => somme + b.villes.reduce((s, v) => s + v.destructibles.length, 0), 0);
                        return (
                            <div key={cle} className="flex flex-col gap-3 bg-base-200 rounded-2xl p-3">
                                <h3 className="flex flex-row items-center gap-2 font-bold">
                                    <FontAwesomeIcon icon={icon} />
                                    {titre}
                                    <span className="font-normal text-sm opacity-70">· {plural(total, 'cible')}</span>
                                </h3>
                                {belligerants.length === 0 ? <i className="text-sm opacity-70">Aucun belligérant engagé.</i> : belligerants.map(({ entite, villes }) => (
                                    <div key={`${entite.type}-${entite.id}`} className="flex flex-col gap-2">
                                        <span className="text-sm font-semibold opacity-80">{entite.title}</span>
                                        {villes.length === 0 ? (
                                            <i className="text-sm opacity-70">{entite.type === 'religion' ? 'Implantée dans aucune ville publique.' : 'Aucune ville publique.'}</i>
                                        ) : (
                                            <ul className="flex flex-col gap-2">
                                                {villes.map((ville) => <VilleCibles key={ville.id} ville={ville} dimension={dimensionDe(ville)} enCours={enCours} />)}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
