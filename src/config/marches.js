// Jours de marché et foires (Shard-API crud_marches) : jours de la semaine réelle, 0 = lundi … 6 = dimanche
export const JOURS_SEMAINE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export const JOURS_OPTIONS = JOURS_SEMAINE.map((jour, index) => ({ value: index, label: jour.charAt(0).toUpperCase() + jour.slice(1) }));

// [5] → « le samedi » ; [2, 5] → « le mercredi et le samedi » ; [0…6] → « tous les jours »
export function joursTexte(jours = []) {
    if (jours.length === 0) return null;
    if (jours.length === 7) return "tous les jours";
    const noms = jours.map((jour) => `le ${JOURS_SEMAINE[jour]}`);
    return noms.length === 1 ? noms[0] : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`;
}

// Dates ISO « 2026-10-09 » lues en heure locale (new Date("2026-10-09") serait minuit UTC)
const dateLocale = (iso) => {
    const [annee, mois, jour] = String(iso).split("-").map(Number);
    return new Date(annee, mois - 1, jour);
};

const format = (iso, options) => dateLocale(iso).toLocaleDateString("fr-FR", options);

// « le samedi 10 octobre 2026 » ou « du vendredi 9 au samedi 10 octobre 2026 »
export function periodeFoire({ date_debut: debut, date_fin: fin }) {
    const complet = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    if (!fin || fin === debut) return `le ${format(debut, complet)}`;
    const memeMois = debut.slice(0, 7) === fin.slice(0, 7);
    return `du ${format(debut, memeMois ? { weekday: "long", day: "numeric" } : { weekday: "long", day: "numeric", month: "long" })} au ${format(fin, complet)}`;
}

// En cours (aujourd'hui entre les deux dates) ou à venir ; aujourd'hui en ISO local
const aujourdhui = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const foireEnCours = (foire) => foire.date_debut <= aujourdhui() && aujourdhui() <= foire.date_fin;
export const dateDuJour = aujourdhui;
