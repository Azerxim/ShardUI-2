import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { getContrastTextColor } from '@/utils/contrastColor';
import { MAISON_COULEUR_DEFAUT, MAISON_ICON_DEFAUT } from '@/config/lignees';

const TAILLES = { sm: 'w-6 h-6 text-xs', md: 'w-10 h-10', lg: 'w-16 h-16 text-2xl', xl: 'w-24 h-24 text-4xl' };

// Blason d'une maison noble : son meuble (icône) sur sa couleur, en écu
export default function BlasonMaison({ maison, size = 'md' }) {
    const couleur = maison?.couleur || MAISON_COULEUR_DEFAUT;
    return (
        <span
            aria-hidden="true"
            className={`flex items-center justify-center shrink-0 rounded-b-[45%] rounded-t-md shadow-md ${TAILLES[size] ?? TAILLES.md}`}
            style={{ backgroundColor: couleur, color: getContrastTextColor(couleur) }}
        >
            <FontAwesomeIcon icon={maison?.icon || MAISON_ICON_DEFAUT} />
        </span>
    );
}
