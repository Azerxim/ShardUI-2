import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GLOSSAIRE } from '@/config/glossaire';

// Petit « ? » à côté d'un terme propre à Tetrago : la définition au survol (ou au focus clavier),
// et un lien vers le glossaire du Codex au clic.
// L'infobulle n'existe qu'à partir de sm : sur téléphone, sa longue définition débordait de l'écran,
// et un toucher ouvre de toute façon le glossaire.
const POSITIONS = {
    bottom: 'sm:tooltip sm:tooltip-bottom',
    top: 'sm:tooltip sm:tooltip-top',
    left: 'sm:tooltip sm:tooltip-left',
    right: 'sm:tooltip sm:tooltip-right',
};

export default function Aide({ terme, position = 'bottom' }) {
    const entree = GLOSSAIRE[terme];
    if (!entree) return null;
    return (
        <a
            href={`/codex#glossaire-${terme}`}
            className={`${POSITIONS[position] ?? POSITIONS.bottom} inline-flex items-center opacity-50 hover:opacity-100 focus-visible:opacity-100 text-base font-normal`}
            data-tip={`${entree.terme} : ${entree.definition}`}
            aria-label={`Qu'est-ce que : ${entree.terme} ? Voir le glossaire`}
        >
            <FontAwesomeIcon icon="fa-regular fa-circle-question" />
        </a>
    );
}
