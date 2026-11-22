import { getPostes } from '@/services/api';

// Postes qu'une civilisation peut mettre en jeu : ceux de son gouvernement et ceux de ses villes (Shard-API crud_elections)
// villes : villes de la civilisation (id, title). Renvoie [{ id, label }], label « Roi », « Bourgmestre de Valcourt »…
export async function postesEnJeu(civilisationId, villes = []) {
    const sources = [{ type: 'civilisation', id: civilisationId, suffixe: '' }, ...villes.map((ville) => ({ type: 'ville', id: ville.id, suffixe: ` de ${ville.title}` }))];
    const listes = await Promise.all(sources.map((source) => getPostes(source.type, source.id)
        .then((liste) => (Array.isArray(liste) ? liste : []).map((poste) => ({ id: poste.id, label: `${poste.title}${source.suffixe}` })))
        .catch(() => [])));
    return listes.flat();
}
