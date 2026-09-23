// Annonce du lancement de la saison 3 sur l'accueil (pages/home/LaunchHomePage.jsx).
// VITE_SAISON_LANCEMENT :
//   - vide : accueil habituel ;
//   - une date ISO (ex. 2026-10-17T20:00:00+02:00) : annonce avec compte à rebours, puis accueil habituel
//     dès la date passée, sans redéploiement ;
//   - tout autre texte (ex. "prochainement") : annonce sans date, jusqu'à ce que la variable soit vidée.
// La page /lancement montre l'annonce en toutes circonstances, pour la relire avant de l'activer.
const valeur = (import.meta.env.VITE_SAISON_LANCEMENT || "").trim();
const date = valeur ? new Date(valeur) : null;

export const SAISON = 3;
export const LANCEMENT_DATE = date && !Number.isNaN(date.getTime()) ? date : null;

export function lancementAVenir(maintenant = Date.now()) {
    if (!valeur) return false;
    return LANCEMENT_DATE ? LANCEMENT_DATE.getTime() > maintenant : true;
}
