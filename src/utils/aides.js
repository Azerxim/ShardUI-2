import { PERSONNAGE_STATUTS, identityText, residenceText } from "@/utils/personnages";
import { dateRp } from "@/config/chroniques";
import { DUREE_JOUR_MINECRAFT, ECHELLE_RP, LIMITE_DISCORD } from "@/config/aides";

// Calculs des outils de la page des aides (components/aides/)

// Valeur saisie → entier, ou null si le champ est vide ou invalide
export const entier = (valeur) => {
    if (valeur === "" || valeur == null) return null;
    const nombre = Number(valeur);
    return Number.isFinite(nombre) ? Math.trunc(nombre) : null;
};

export const formatNombre = (nombre) => nombre.toLocaleString("fr-FR");

// Durée réelle d'un trajet en jeu (secondes) → temps RP : « 9 jours 17 h », « 1 jour », « 5 h », « moins d'une heure »
export function dureeRp(secondes) {
    const heures = Math.round((secondes * ECHELLE_RP / DUREE_JOUR_MINECRAFT) * 24);
    if (heures < 1) return "moins d'une heure";
    const jours = Math.floor(heures / 24);
    const reste = heures % 24;
    const texteJours = jours ? `${jours} jour${jours > 1 ? "s" : ""}` : "";
    return [texteJours, reste ? `${reste} h` : ""].filter(Boolean).join(" ");
}

// Fiche d'un de ses personnages, mise en forme pour un message Discord (Markdown de Discord) : identité, résidence,
// dates RP, histoire et lien vers la fiche du site. L'histoire est raccourcie pour tenir dans un seul message.
export function ficheDiscord(fiche, origine = window.location.origin) {
    const { personnage, maison } = fiche;
    const statut = PERSONNAGE_STATUTS[personnage.status];
    const lignes = [`## ${personnage.name}`];
    const identite = identityText(fiche);
    if (identite) lignes.push(`*${identite}*`);
    if (statut) lignes.push(`**Statut** : ${statut.label}`);
    const residence = residenceText(fiche);
    if (residence) lignes.push(`**Résidence** : ${residence}`);
    if (maison) lignes.push(`**Maison** : ${maison.title}`);
    const naissance = dateRp(personnage.date_naissance);
    if (naissance) lignes.push(`**Naissance** : ${naissance}`);
    const deces = personnage.status === "mort" ? dateRp(personnage.date_deces) : null;
    if (deces) lignes.push(`**Décès** : ${deces}`);
    const lien = `${origine}/personnage/${personnage.id}`;

    const histoire = (personnage.description || "").trim();
    if (!histoire) return [...lignes, "", lien].join("\n");

    // Place laissée à l'histoire : la limite de Discord, moins le reste de la fiche et les « > » de citation
    const entete = `${lignes.join("\n")}\n\n`;
    const pied = `\n\n${lien}`;
    const lignesHistoire = histoire.split("\n").length;
    const place = LIMITE_DISCORD - entete.length - pied.length - lignesHistoire * 2;
    const coupee = histoire.length > place ? `${histoire.slice(0, Math.max(place - 1, 0)).trimEnd()}…` : histoire;
    return `${entete}${coupee.split("\n").map((ligne) => `> ${ligne}`).join("\n")}${pied}`;
}
