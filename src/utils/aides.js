import { PERSONNAGE_STATUTS, identityText, residenceText } from "@/utils/personnages";
import { dateRp } from "@/config/chroniques";
import { LIMITE_DISCORD } from "@/config/aides";

// Calculs des outils de la page des aides (components/aides/)

// Valeur saisie → entier, ou null si le champ est vide ou invalide
export const entier = (valeur) => {
    if (valeur === "" || valeur == null) return null;
    const nombre = Number(valeur);
    return Number.isFinite(nombre) ? Math.trunc(nombre) : null;
};

export const formatNombre = (nombre) => nombre.toLocaleString("fr-FR");

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
