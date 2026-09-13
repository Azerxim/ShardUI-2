import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Ligne d'information d'un en-tête de fiche : icône discrète + texte
export default function InfoLine({ icon, children }) {
    return (
        <span className="flex flex-row items-center gap-2">
            <FontAwesomeIcon icon={icon} className="opacity-70 w-4 shrink-0" />
            <span className="min-w-0 break-words">{children}</span>
        </span>
    );
}
