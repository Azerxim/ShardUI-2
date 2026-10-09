import { useState } from 'react';

// ===== Filtres des pages de liste (BarreFiltres) =====
// Recherche sans accents ni majuscules, comparateurs de tri, et choix du visiteur gardés dans son navigateur.

export const normalize = (text) => (text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// La recherche porte sur plusieurs textes (titre, auteur, noms liés…) ; une recherche vide garde tout
export const correspond = (query, textes) => !query || normalize(textes.filter(Boolean).join(' ')).includes(query);

// Sans valeur, un élément passe après les autres quel que soit le sens du tri
const sansValeurApres = (va, vb, sens) => {
  if (va === vb) return 0;
  if (va === null) return 1;
  if (vb === null) return -1;
  return sens * (va - vb);
};

// valeur : (élément) => date ou chaîne ISO ; sens : 1 croissant, -1 décroissant
export const parDate = (valeur, sens) => (a, b) => {
  const date = (item) => (valeur(item) ? new Date(valeur(item)).getTime() : null);
  return sansValeurApres(date(a), date(b), sens);
};

export const parNombre = (valeur, sens) => (a, b) => sansValeurApres(valeur(a) ?? null, valeur(b) ?? null, sens);

export const parTitre = (valeur, sens) => (a, b) => sens * (valeur(a) || '').localeCompare(valeur(b) || '', 'fr', { sensitivity: 'base' });

// Filtres gardés sous `cle` (sauf la recherche, qui repart vide) ; `choix` : { champ: options } pour écarter une valeur
// gardée qui n'existe plus. Préférence seulement : sans stockage, la page démarre sur `defauts`.
export function useFiltresMemorises(cle, defauts, choix = {}) {
  const [filtres, setFiltres] = useState(() => {
    try {
      const filtresLus = { ...defauts, ...(JSON.parse(localStorage.getItem(cle)) || {}), recherche: '' };
      Object.entries(choix).forEach(([champ, options]) => {
        if (!(filtresLus[champ] in options)) filtresLus[champ] = defauts[champ];
      });
      return filtresLus;
    } catch {
      return defauts;
    }
  });

  const changer = (next) => {
    setFiltres(next);
    try {
      localStorage.setItem(cle, JSON.stringify({ ...next, recherche: '' }));
    } catch {
      // Préférence non enregistrée : sans conséquence
    }
  };

  return [filtres, changer];
}
