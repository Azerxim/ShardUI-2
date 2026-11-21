import { instantRp } from '@/config/temporalite';

// Champ de date RP des modales : vide par défaut, rien n'est rempli d'office. Tant qu'il est vide, sa date maximale est
// la date du jour dans le RP (config/temporalite.js) : le calendrier du navigateur s'ouvre alors sur elle plutôt que sur
// la date réelle (an 2026). Dès qu'une date est saisie, cette borne tombe, pour ne pas rendre invalides les dates RP
// plus lointaines (an 412…) ; une ligne rappelle la date du jour dans le RP.
export default function InputDateRp({ value, className, ...props }) {
    const aujourdhui = instantRp();
    const vide = !value;
    return (
        <>
            <input type="date" value={value ?? ''} max={vide && aujourdhui ? aujourdhui.iso : undefined} className={className} {...props} />
            {vide && aujourdhui ? <span className="label whitespace-normal">Aujourd'hui dans le RP : {aujourdhui.texte}</span> : null}
        </>
    );
}
