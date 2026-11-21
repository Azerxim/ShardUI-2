import { dateRp } from '@/config/chroniques';
import { instantRp } from '@/config/temporalite';

// Champ de date RP des modales : vide par défaut, rien n'est rempli d'office. Tant qu'il est vide, sa date maximale est
// la date du jour dans le RP (config/temporalite.js) : le calendrier du navigateur s'ouvre alors sur elle plutôt que sur
// la date réelle (an 2026). Dès qu'une date est saisie, cette borne tombe, pour ne pas rendre invalides les dates RP
// plus lointaines (an 412…).
// Sous le champ, la date en clair dans le RP : celle saisie (« Dans le RP : 1er septembre de l'an 2 », le navigateur
// n'affichant que 01/09/0002), ou, champ vide, celle du jour.
export default function InputDateRp({ value, className, ...props }) {
    // Une date reçue avec une heure (« 0002-09-01T00:00:00 ») ne s'afficherait pas dans un champ de date
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : (value ?? '');
    const aujourdhui = instantRp();
    const saisie = date ? dateRp(date) : null;
    return (
        <>
            <input type="date" value={date} max={!date && aujourdhui ? aujourdhui.iso : undefined} className={className} {...props} />
            {saisie ? (
                <span className="label whitespace-normal">Dans le RP : {saisie}</span>
            ) : !date && aujourdhui ? (
                <span className="label whitespace-normal">Aujourd'hui dans le RP : {aujourdhui.texte}</span>
            ) : null}
        </>
    );
}
