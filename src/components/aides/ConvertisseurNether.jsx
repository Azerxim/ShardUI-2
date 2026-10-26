import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Outil, { ChampNombre } from '@/components/aides/Outil';
import { entier } from '@/utils/aides';
import { RAPPORT_NETHER } from '@/config/aides';

// Coordonnées de la surface ↔ du Nether : un bloc du Nether vaut 8 blocs de la surface, en X comme en Z
// (la hauteur ne change pas). Saisir d'un côté remplit l'autre.
const versNether = (valeur) => {
    const nombre = entier(valeur);
    return nombre == null ? '' : String(Math.floor(nombre / RAPPORT_NETHER));
};
const versSurface = (valeur) => {
    const nombre = entier(valeur);
    return nombre == null ? '' : String(nombre * RAPPORT_NETHER);
};

export default function ConvertisseurNether() {
    const [coords, setCoords] = useState({ surface: { x: '', z: '' }, nether: { x: '', z: '' } });

    const changer = (cote, axe, valeur) => setCoords((avant) => (cote === 'surface'
        ? { surface: { ...avant.surface, [axe]: valeur }, nether: { ...avant.nether, [axe]: versNether(valeur) } }
        : { nether: { ...avant.nether, [axe]: valeur }, surface: { ...avant.surface, [axe]: versSurface(valeur) } }));

    const colonne = (cote, titre, icon) => (
        <fieldset className="flex flex-col gap-2 flex-1 min-w-0">
            <legend className="flex items-center gap-2 font-semibold mb-2">
                <FontAwesomeIcon icon={icon} className="opacity-70" />
                {titre}
            </legend>
            <div className="grid grid-cols-2 gap-2">
                <ChampNombre label="X" value={coords[cote].x} onChange={(valeur) => changer(cote, 'x', valeur)} />
                <ChampNombre label="Z" value={coords[cote].z} onChange={(valeur) => changer(cote, 'z', valeur)} />
            </div>
        </fieldset>
    );

    return (
        <Outil
            id="nether"
            icon="fa-solid fa-dungeon"
            titre="Coordonnées du Nether"
            texte={`Où construire le portail de l'autre côté : un bloc du Nether vaut ${RAPPORT_NETHER} blocs de la surface. Saisissez les coordonnées d'un côté, l'autre se remplit.`}
        >
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {colonne('surface', 'Surface', 'fa-solid fa-tree')}
                <FontAwesomeIcon icon="fa-solid fa-arrow-right-arrow-left" className="self-center opacity-50 rotate-90 sm:rotate-0 sm:mb-3" />
                {colonne('nether', 'Nether', 'fa-solid fa-fire')}
            </div>
            <p className="text-xs opacity-70">La hauteur (Y) ne change pas. Un portail relie le portail le plus proche de l'autre côté : construisez-le aux coordonnées données pour qu'ils se trouvent.</p>
        </Outil>
    );
}
