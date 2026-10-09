import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// ===== Barre de filtres d'une page de liste =====
// Recherche, listes de choix et interrupteurs ; « Réinitialiser » n'apparaît que si un filtre diffère de `defauts`.
// selects : [{ name, label, options, className }] ; options : { valeur: libellé }, ou [[valeur, libellé], …] quand l'ordre
// compte et que les valeurs sont des nombres (un objet les rangerait par valeur) ; toggles : [{ name, label }]
// (le parent n'y met que ce qui s'applique au visiteur, par exemple « Mes … » une fois connecté).
export default function BarreFiltres({ filtres, defauts, onChange, recherche, selects = [], toggles = [] }) {
  const set = (champ, value) => onChange({ ...filtres, [champ]: value });
  const modifies = Object.keys(defauts).some((champ) => filtres[champ] !== defauts[champ]);

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full">
      <label className="input input-ghost bg-base-200 rounded-3xl w-full sm:w-auto sm:flex-1 min-w-0 sm:min-w-64">
        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="opacity-60" />
        <input type="search" value={filtres.recherche} onChange={(e) => set('recherche', e.target.value)} placeholder={recherche.placeholder} aria-label={recherche.label} />
      </label>
      {selects.map(({ name, label, options, className = 'sm:w-52' }) => (
        <select key={name} value={filtres[name]} onChange={(e) => set(name, e.target.value)} aria-label={label} className={`select select-ghost bg-base-200 rounded-3xl w-full ${className}`}>
          {(Array.isArray(options) ? options : Object.entries(options)).map(([value, libelle]) => <option key={value} value={value}>{libelle}</option>)}
        </select>
      ))}
      {toggles.map(({ name, label }) => (
        <label key={name} className="flex flex-row items-center gap-2 cursor-pointer bg-base-200 rounded-3xl px-4 h-10">
          <input type="checkbox" checked={filtres[name]} onChange={(e) => set(name, e.target.checked)} className="toggle toggle-sm toggle-primary" />
          <span>{label}</span>
        </label>
      ))}
      {modifies ? (
        <button type="button" onClick={() => onChange(defauts)} className="btn btn-ghost bg-base-200 hover:bg-base-300 rounded-3xl">
          <FontAwesomeIcon icon="fa-solid fa-xmark" />
          Réinitialiser
        </button>
      ) : null}
    </div>
  );
}
