import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MONNAIE } from '@/config/monnaie';

// Carte de la monnaie officielle : sa valeur, où elle a cours, comment l'obtenir.
// compact : version courte pour la page des commerces, avec un lien vers le Codex.
export default function MonnaieOfficielle({ compact = false, id }) {
    return (
        <section id={id} className="flex flex-col gap-4 w-full bg-base-200 rounded-3xl p-5 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl bg-secondary text-secondary-content">
                    <FontAwesomeIcon icon={MONNAIE.icon} size="xl" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <h2 className="text-xl">Le {MONNAIE.nom}, monnaie officielle de Tetrago</h2>
                    <p className="opacity-80">{MONNAIE.cours}</p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                    <span className="badge badge-secondary badge-lg font-semibold">{MONNAIE.valeur}</span>
                    <span className="text-xs opacity-70">{MONNAIE.equivalence}</span>
                </div>
            </div>
            {compact ? (
                <p className="text-sm opacity-80">
                    Indiquez vos prix en {MONNAIE.pluriel}.{' '}
                    <a href="/codex#monnaie" className="link link-hover font-semibold">Comment en obtenir ?</a>
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    <h3 className="font-semibold">Comment obtenir des {MONNAIE.pluriel}</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {MONNAIE.obtention.map((source) => (
                            <li key={source.titre} className="flex gap-3 bg-base-100 rounded-2xl p-3">
                                <FontAwesomeIcon icon={source.icon} className="mt-1 opacity-70" />
                                <span>
                                    <strong>{source.titre}</strong>
                                    <span className="block text-sm opacity-80">{source.texte}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
