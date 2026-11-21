import { dateRp } from "@/config/chroniques";
import { LANCEMENT_DATE } from "@/config/saison";

// ===== Temporalité du RP =====
// Le temps de Tetrago avance plus vite que le nôtre : 1 semaine réelle = 2 ans dans le RP, et l'an 1 commence à
// l'ouverture de la saison, la date de VITE_SAISON_LANCEMENT (config/saison.js ; 14 novembre 2026 à 14 h pour la
// saison 3). Sans date dans cette variable (vide ou « prochainement »), le temps RP n'a pas commencé.
// Affiché sur l'accueil (components/temps/TemporaliteRp.jsx).
// Calendrier RP : douze mois de 31, 28, 31… jours (365 jours, sans année bissextile), nommés comme les nôtres.

export const DEBUT_RP = LANCEMENT_DATE;
export const ANS_RP_PAR_SEMAINE = 2;

const SEMAINE_MS = 7 * 24 * 3600 * 1000;
export const DUREE_AN_RP_MS = SEMAINE_MS / ANS_RP_PAR_SEMAINE; // 3 jours et demi réels
const JOURS_PAR_MOIS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const JOURS_PAR_AN = 365;
export const DUREE_JOUR_RP_MS = DUREE_AN_RP_MS / JOURS_PAR_AN; // ≈ 13 min 49 s réelles
export const DUREE_MOIS_RP_MS = DUREE_AN_RP_MS / 12; // 7 heures réelles (en moyenne)

const deux = (n) => String(n).padStart(2, "0");

// Date RP d'un instant réel : { an, mois, jour, iso « 0003-03-12 », texte « 12 mars de l'an 3 », avancement de
// l'année (0 à 1), debutAnSuivant (instant réel) }, ou null avant l'an 1 (ou sans date d'ouverture)
export function instantRp(maintenant = Date.now(), debut = DEBUT_RP) {
    if (!debut) return null;
    const ecoule = maintenant - debut.getTime();
    if (ecoule < 0) return null;
    const ansEcoules = Math.floor(ecoule / DUREE_AN_RP_MS);
    const avancement = (ecoule - ansEcoules * DUREE_AN_RP_MS) / DUREE_AN_RP_MS;
    let jourDeLAnnee = Math.min(Math.floor(avancement * JOURS_PAR_AN), JOURS_PAR_AN - 1);
    let mois = 0;
    while (jourDeLAnnee >= JOURS_PAR_MOIS[mois]) {
        jourDeLAnnee -= JOURS_PAR_MOIS[mois];
        mois += 1;
    }
    const an = ansEcoules + 1;
    const iso = `${String(an).padStart(4, "0")}-${deux(mois + 1)}-${deux(jourDeLAnnee + 1)}`;
    return {
        an,
        mois: mois + 1,
        jour: jourDeLAnnee + 1,
        iso,
        texte: dateRp(iso),
        avancement,
        debutAnSuivant: new Date(debut.getTime() + (ansEcoules + 1) * DUREE_AN_RP_MS),
    };
}

// Durée réelle restante, arrondie : « 1 j 6 h », « 3 h 12 min », « 8 min », « moins d'une minute »
export function dureeReelle(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "moins d'une minute";
    const jours = Math.floor(minutes / 1440);
    const heures = Math.floor((minutes % 1440) / 60);
    const reste = minutes % 60;
    if (jours > 0) return `${jours} j${heures ? ` ${heures} h` : ""}`;
    if (heures > 0) return `${heures} h${reste ? ` ${reste} min` : ""}`;
    return `${reste} min`;
}
