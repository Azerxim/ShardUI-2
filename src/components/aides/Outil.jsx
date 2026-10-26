import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Carte d'un outil de la page des aides : titre, phrase d'usage, puis l'outil lui-même
export default function Outil({ id, icon, titre, texte, children }) {
    return (
        <section id={id} aria-labelledby={`${id}-titre`} className="flex flex-col gap-4 bg-base-200 rounded-3xl p-5 shadow-md scroll-mt-24 target:ring-2 target:ring-primary">
            <div className="flex flex-row items-start gap-3">
                <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-2xl bg-secondary text-secondary-content">
                    <FontAwesomeIcon icon={icon} />
                </span>
                <div className="flex flex-col gap-1 min-w-0">
                    <h3 id={`${id}-titre`} className="font-bold text-lg">{titre}</h3>
                    {texte && <p className="text-sm opacity-80">{texte}</p>}
                </div>
            </div>
            {children}
        </section>
    );
}

// Champ numérique des outils : vide tant que rien n'est saisi
export function ChampNombre({ label, value, onChange, min, placeholder = '0' }) {
    return (
        <label className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-semibold opacity-70">{label}</span>
            <input
                type="number"
                inputMode="numeric"
                step="1"
                min={min}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="input input-ghost bg-base-100 w-full tabular-nums"
            />
        </label>
    );
}
