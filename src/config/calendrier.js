// Calendrier des événements RP (Shard-API crud_calendrier) : heures réelles du serveur, qui se joue en temps réel.
// Classes écrites en entier (badge, puce) pour que Tailwind les garde au build.
export const TYPES_EVENEMENTS = {
    bataille: { label: "Bataille", icon: "fa-solid fa-khanda", badge: "badge-error", puce: "bg-error/15 text-error" },
    fete: { label: "Fête", icon: "fa-solid fa-champagne-glasses", badge: "badge-accent", puce: "bg-accent/15 text-accent" },
    couronnement: { label: "Couronnement", icon: "fa-solid fa-crown", badge: "badge-warning", puce: "bg-warning/20 text-warning-content" },
    ceremonie: { label: "Cérémonie", icon: "fa-solid fa-bell", badge: "badge-info", puce: "bg-info/15 text-info" },
    tournoi: { label: "Tournoi", icon: "fa-solid fa-chess-knight", badge: "badge-primary", puce: "bg-primary/15 text-primary" },
    conseil: { label: "Conseil", icon: "fa-solid fa-landmark", badge: "badge-secondary", puce: "bg-secondary/15 text-secondary" },
    autre: { label: "Événement", icon: "fa-solid fa-calendar-day", badge: "badge-neutral", puce: "bg-base-300" },
};

export const typeEvenement = (type) => TYPES_EVENEMENTS[type] ?? TYPES_EVENEMENTS.autre;

// Foires des villes (crud_marches), affichées au calendrier en lecture seule
export const FOIRE = { label: "Foire", icon: "fa-solid fa-tents", puce: "bg-secondary/15 text-secondary" };

export const ORGANISATEURS = {
    joueur: { label: "Joueur", icon: "fa-solid fa-user", href: (id) => `/profil/${id}` },
    civilisation: { label: "Civilisation", icon: "fa-solid fa-flag", href: (id) => `/civilisation/${id}` },
    religion: { label: "Religion", icon: "fa-solid fa-cross", href: (id) => `/religion/${id}` },
    commerce: { label: "Commerce", icon: "fa-solid fa-shop", href: (id) => `/commerce/${id}` },
    alliance: { label: "Alliance", icon: "fa-solid fa-handshake", href: (id) => `/alliance/${id}` },
};

export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const JOURS_COURTS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

const deux = (n) => String(n).padStart(2, "0");

// Dates locales en ISO : « 2026-10-09 » ; mois : « 2026-10 »
export const isoJour = (date) => `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
export const isoMois = (date) => `${date.getFullYear()}-${deux(date.getMonth() + 1)}`;

// « 2026-10 » → premier jour du mois (heure locale) ; valeur illisible : mois en cours
export function debutDuMois(mois) {
    const [annee, numero] = String(mois || "").split("-").map(Number);
    if (!annee || !numero || numero < 1 || numero > 12) {
        const maintenant = new Date();
        return new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    }
    return new Date(annee, numero - 1, 1);
}

export const moisVoisin = (debut, sens) => new Date(debut.getFullYear(), debut.getMonth() + sens, 1);

export const titreMois = (debut) => `${MOIS[debut.getMonth()]} ${debut.getFullYear()}`;

// Semaines du mois, du lundi au dimanche : jours hors du mois à null
export function semainesDuMois(debut) {
    const decalage = (debut.getDay() + 6) % 7;
    const nbJours = new Date(debut.getFullYear(), debut.getMonth() + 1, 0).getDate();
    const cases = [...Array(decalage).fill(null), ...Array.from({ length: nbJours }, (_, i) => new Date(debut.getFullYear(), debut.getMonth(), i + 1))];
    while (cases.length % 7) cases.push(null);
    return Array.from({ length: cases.length / 7 }, (_, i) => cases.slice(i * 7, i * 7 + 7));
}

// Les dates de l'API sont sans fuseau : new Date("2026-10-09T21:00:00") les lit en heure locale
const heure = (date) => (date.getMinutes() ? `${date.getHours()} h ${deux(date.getMinutes())}` : `${date.getHours()} h`);
const jourLong = (date, avecAnnee = true) => date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", ...(avecAnnee ? { year: "numeric" } : {}) });

// « samedi 10 octobre 2026 à 21 h », « samedi 10 octobre 2026, de 21 h à 23 h », « du samedi 10 octobre à 21 h au … »
export function horaireEvenement({ date_debut: debutIso, date_fin: finIso }) {
    const debut = new Date(debutIso);
    if (!finIso) return `${jourLong(debut)} à ${heure(debut)}`;
    const fin = new Date(finIso);
    if (isoJour(debut) === isoJour(fin)) return `${jourLong(debut)}, de ${heure(debut)} à ${heure(fin)}`;
    return `du ${jourLong(debut, debut.getFullYear() !== fin.getFullYear())} à ${heure(debut)} au ${jourLong(fin)} à ${heure(fin)}`;
}

// Jours (ISO) couverts par un événement ou une foire, bornés au mois affiché
export function joursCouverts(debutIso, finIso, debutMois) {
    const debut = new Date(debutIso.length === 10 ? `${debutIso}T00:00:00` : debutIso);
    const fin = new Date(!finIso ? debut : finIso.length === 10 ? `${finIso}T00:00:00` : finIso);
    const finMois = moisVoisin(debutMois, 1);
    const jours = [];
    for (let jour = new Date(Math.max(debut, debutMois)); jour < finMois && isoJour(jour) <= isoJour(fin); jour.setDate(jour.getDate() + 1)) {
        jours.push(isoJour(jour));
        jour.setHours(0, 0, 0, 0);
    }
    return jours;
}

// Valeur d'un champ datetime-local : « 2026-10-09T21:00 »
export const valeurDateHeure = (iso) => (iso ? String(iso).slice(0, 16) : "");
