import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// État vide d'une liste : dit ce qui manque, explique en une phrase, et propose l'action qui comble le vide.
// action : { label, icon, onClick } ou { label, icon, href } ; sans droit d'agir, passer seulement `aide`.
export default function EtatVide({ icon = 'fa-solid fa-feather-pointed', texte, aide, action, className = 'w-full' }) {
    const Bouton = action?.href ? 'a' : 'button';
    return (
        <div className={`flex flex-col items-center text-center gap-2 py-8 px-4 rounded-2xl border border-dashed border-base-300 bg-base-200/40 ${className}`}>
            <FontAwesomeIcon icon={icon} size="2x" className="opacity-40 mb-1" />
            <p className="font-semibold">{texte}</p>
            {aide && <p className="text-sm opacity-70 max-w-md">{aide}</p>}
            {action && (
                <Bouton
                    {...(action.href ? { href: action.href } : { type: 'button', onClick: action.onClick })}
                    className="btn btn-primary btn-sm mt-2"
                >
                    {action.icon && <FontAwesomeIcon icon={action.icon} />}
                    {action.label}
                </Bouton>
            )}
        </div>
    );
}
