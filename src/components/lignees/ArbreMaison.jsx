import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import PersonnageAvatar from '@/components/personnages/PersonnageAvatar';
import { dateRp, vieRp } from '@/config/lignees';

// ===== Arbre d'une maison =====
// Descendance dessinée en arbre indenté (lisible aussi sur téléphone) : chaque ancêtre sans parent dans la maison ouvre
// une branche ; un couple est montré ensemble (le conjoint venu d'une autre maison est marqué « allié »), avec leurs
// enfants dessous. Un enfant dont les deux parents sont dans des branches différentes n'apparaît qu'une fois ; un
// conjoint membre qui a ses parents dans la maison reste dans leur branche (et figure aussi à côté de son conjoint).

const parNaissance = (a, b) => (a.date_naissance ?? '9999').localeCompare(b.date_naissance ?? '9999') || a.name.localeCompare(b.name);

function Fiche({ personnage, chef, allie, mariage }) {
    const vie = vieRp(personnage);
    return (
        <span className={`flex flex-row items-center gap-2 rounded-2xl pl-1 pr-3 py-1 min-w-0 ${allie ? 'bg-base-100 border border-dashed border-base-300' : 'bg-base-100'}`}>
            <PersonnageAvatar personnage={personnage} size="sm" />
            <span className="flex flex-col min-w-0">
                <span className="flex items-center gap-1 min-w-0">
                    {chef && <FontAwesomeIcon icon="fa-solid fa-crown" className="text-warning shrink-0" title="Chef de la maison" />}
                    <a href={`/personnage/${personnage.id}`} className={`link link-hover font-semibold truncate ${personnage.status === 'mort' ? 'opacity-70' : ''}`}>{personnage.name}</a>
                    {personnage.status === 'mort' && <span className="text-xs opacity-60" title="Mort">†</span>}
                </span>
                <span className="text-xs opacity-60 truncate">
                    {[vie, allie ? 'allié' : null, mariage ? `marié le ${dateRp(mariage)}` : null].filter(Boolean).join(' · ')}
                </span>
            </span>
        </span>
    );
}

export default function ArbreMaison({ membres, allies, liens, chefId }) {
    const personnes = new Map([...allies, ...membres].map((p) => [p.id, p]));
    const estMembre = new Set(membres.map((p) => p.id));
    const parents = new Map();
    const conjoints = new Map();
    for (const lien of liens) {
        if (lien.type === 'parent') parents.set(lien.cible_id, [...(parents.get(lien.cible_id) ?? []), lien.source_id]);
        if (lien.type === 'conjoint') {
            conjoints.set(lien.source_id, [...(conjoints.get(lien.source_id) ?? []), { id: lien.cible_id, date_rp: lien.date_rp }]);
            conjoints.set(lien.cible_id, [...(conjoints.get(lien.cible_id) ?? []), { id: lien.source_id, date_rp: lien.date_rp }]);
        }
    }
    const vus = new Set();
    const aDesParents = (id) => (parents.get(id) ?? []).some((parent) => estMembre.has(parent));

    const branche = (personnage) => {
        vus.add(personnage.id);
        const couple = (conjoints.get(personnage.id) ?? []).filter((c) => personnes.has(c.id) && !vus.has(c.id));
        couple.filter((c) => !aDesParents(c.id)).forEach((c) => vus.add(c.id));
        const foyer = new Set([personnage.id, ...couple.map((c) => c.id)]);
        const enfants = membres.filter((m) => !vus.has(m.id) && (parents.get(m.id) ?? []).some((id) => foyer.has(id))).sort(parNaissance);
        return (
            <li key={personnage.id} className="flex flex-col gap-2">
                <div className="flex flex-row flex-wrap items-center gap-2">
                    <Fiche personnage={personnage} chef={personnage.id === chefId} />
                    {couple.map((c) => (
                        <span key={c.id} className="flex flex-row items-center gap-2">
                            <FontAwesomeIcon icon="fa-solid fa-ring" className="opacity-60" title="Conjoints" />
                            <Fiche personnage={personnes.get(c.id)} chef={c.id === chefId} allie={!estMembre.has(c.id)} mariage={c.date_rp} />
                        </span>
                    ))}
                </div>
                {enfants.length > 0 && (
                    <ul className="flex flex-col gap-2 border-l-2 border-base-300 ml-4 pl-4">
                        {enfants.map((enfant) => (vus.has(enfant.id) ? null : branche(enfant)))}
                    </ul>
                )}
            </li>
        );
    };

    // Ancêtres : membres sans parent connu dans la maison ; les autres apparaissent sous leurs parents
    const racines = membres.filter((m) => !aDesParents(m.id)).sort(parNaissance);
    const branches = [];
    for (const racine of racines) {
        if (!vus.has(racine.id)) branches.push(branche(racine));
    }
    return <ul aria-label="Arbre de la maison" className="flex flex-col gap-4 w-full">{branches}</ul>;
}
