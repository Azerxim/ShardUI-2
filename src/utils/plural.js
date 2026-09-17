// "1 ville", "3 villes" : pluriel simple pour les compteurs affichés
export const plural = (count, singular, pluralForm = `${singular}s`) => `${count} ${count > 1 ? pluralForm : singular}`;
