// Ouverture de la recherche globale (components/layout/RechercheGlobale.jsx) depuis un autre composant,
// par exemple le menu burger sur téléphone, où la loupe de la barre est masquée.
export const EVENEMENT_OUVRIR_RECHERCHE = 'recherche:ouvrir';
export const ouvrirRecherche = () => window.dispatchEvent(new Event(EVENEMENT_OUVRIR_RECHERCHE));
