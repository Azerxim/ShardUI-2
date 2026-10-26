import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Outil, { ChampNombre } from '@/components/aides/Outil';
import { dureeRp, entier, formatNombre } from '@/utils/aides';
import { getVilles } from '@/services/api';
import { ECHELLE_RP, RAPPORT_NETHER, VITESSES } from '@/config/aides';

// Distance à vol d'oiseau entre deux villes publiques placées sur la carte (ou deux points saisis), et temps de
// trajet estimé selon le moyen de transport, en temps réel et en temps RP (config/aides.js : ECHELLE_RP) ; par le Nether,
// la distance est divisée par 8.
const LIBRE = 'libre';

const duree = (secondes) => {
    const total = Math.round(secondes);
    if (total < 60) return `${total} s`;
    const heures = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (heures) return `${heures} h ${String(minutes).padStart(2, '0')}`;
    const reste = total % 60;
    return reste ? `${minutes} min ${String(reste).padStart(2, '0')} s` : `${minutes} min`;
};

// Point d'une extrémité : la ville choisie, ou les coordonnées saisies
function position(extremite, villes) {
    if (extremite.choix === LIBRE) {
        const x = entier(extremite.x);
        const z = entier(extremite.z);
        return x == null || z == null ? null : { x, z, dimension_id: null };
    }
    return villes.find((ville) => String(ville.id) === extremite.choix) ?? null;
}

function Extremite({ label, extremite, villes, onChange }) {
    return (
        <fieldset className="flex flex-col gap-2 flex-1 min-w-0">
            <legend className="text-xs font-semibold opacity-70 mb-1">{label}</legend>
            <select
                value={extremite.choix}
                onChange={(e) => onChange({ ...extremite, choix: e.target.value })}
                aria-label={label}
                className="select select-ghost bg-base-100 w-full"
            >
                <option value="">Choisir une ville</option>
                {villes.map((ville) => <option key={ville.id} value={String(ville.id)}>{ville.title}</option>)}
                <option value={LIBRE}>Coordonnées saisies</option>
            </select>
            {extremite.choix === LIBRE && (
                <div className="grid grid-cols-2 gap-2">
                    <ChampNombre label="X" value={extremite.x} onChange={(x) => onChange({ ...extremite, x })} />
                    <ChampNombre label="Z" value={extremite.z} onChange={(z) => onChange({ ...extremite, z })} />
                </div>
            )}
        </fieldset>
    );
}

export default function DistanceVilles() {
    const [villes, setVilles] = useState([]);
    const [depart, setDepart] = useState({ choix: '', x: '', z: '' });
    const [arrivee, setArrivee] = useState({ choix: '', x: '', z: '' });
    const [parNether, setParNether] = useState(false);

    useEffect(() => {
        getVilles()
            .then((liste) => setVilles((Array.isArray(liste) ? liste : [])
                .filter((ville) => ville.is_public && ville.x != null && ville.z != null)
                .sort((a, b) => a.title.localeCompare(b.title, 'fr'))))
            .catch(() => setVilles([]));
    }, []);

    const a = position(depart, villes);
    const b = position(arrivee, villes);
    const autreDimension = a?.dimension_id && b?.dimension_id && a.dimension_id !== b.dimension_id;
    const distance = a && b && !autreDimension ? Math.hypot(b.x - a.x, b.z - a.z) : null;
    const parcourue = distance == null ? null : parNether ? distance / RAPPORT_NETHER : distance;

    return (
        <Outil
            id="distance"
            icon="fa-solid fa-route"
            titre="Distance et temps de trajet"
            texte={villes.length
                ? "Entre deux villes publiques placées sur la carte, ou deux points dont vous connaissez les coordonnées."
                : "Entre deux points dont vous connaissez les coordonnées ; les villes publiques s'ajouteront à la liste une fois placées sur la carte."}
        >
            <div className="flex flex-col sm:flex-row gap-4">
                <Extremite label="Départ" extremite={depart} villes={villes} onChange={setDepart} />
                <Extremite label="Arrivée" extremite={arrivee} villes={villes} onChange={setArrivee} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
                <input type="checkbox" className="toggle toggle-sm" checked={parNether} onChange={(e) => setParNether(e.target.checked)} />
                Passer par le Nether (portails à chaque bout)
            </label>
            {autreDimension && (
                <p className="text-sm bg-base-100 rounded-2xl px-4 py-3">Ces deux villes ne sont pas dans la même dimension : aucune route ne les relie.</p>
            )}
            {parcourue != null && (
                <div className="flex flex-col gap-3 bg-base-100 rounded-2xl px-4 py-3" aria-live="polite">
                    <p>
                        <strong className="text-lg tabular-nums">{formatNombre(Math.round(distance))} blocs</strong>
                        <span className="opacity-70"> à vol d'oiseau</span>
                        {parNether && <span className="opacity-70">, soit {formatNombre(Math.round(parcourue))} blocs dans le Nether</span>}
                    </p>
                    <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {VITESSES.map((moyen) => (
                            <li key={moyen.id} className="flex flex-col gap-0.5 bg-base-200 rounded-xl px-3 py-2">
                                <span className="flex items-center gap-2 text-xs opacity-70">
                                    <FontAwesomeIcon icon={moyen.icon} />
                                    {moyen.label}
                                </span>
                                <span className="font-semibold tabular-nums">{duree(parcourue / moyen.vitesse)}</span>
                                <span className="text-sm tabular-nums">
                                    <span className="opacity-70">RP : </span>
                                    <span className="font-semibold">{dureeRp(parcourue / moyen.vitesse)}</span>
                                </span>
                                {moyen.note && <span className="text-xs opacity-60">{moyen.note}</span>}
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs opacity-60">
                        En ligne droite, sans relief ni détour : comptez davantage en pratique.
                        {' '}Temps RP : dans le récit, un bloc vaut {ECHELLE_RP} mètres, et un jour de Minecraft (20 minutes) fait un jour.
                    </p>
                </div>
            )}
        </Outil>
    );
}
