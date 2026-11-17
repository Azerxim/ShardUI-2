// Markdown de Discord -> Markdown standard (GFM), interprété ensuite par react-markdown (DiscordMarkdown).
// Discord diffère du CommonMark sur plusieurs points, repris ici :
// - un retour à la ligne simple est un vrai saut de ligne ;
// - une citation « > » ne vaut que pour sa ligne, « >>> » cite tout le reste du message ;
// - __texte__ est souligné, ||texte|| est masqué (spoiler), « -# texte » est un petit texte ;
// - émojis personnalisés <:nom:id>, dates <t:horodatage:style>, mentions <@id>, <#id>, <@&id>.
// Les éléments propres à Discord deviennent des liens à ancre réservée (#spoiler…), rendus à part par DiscordMarkdown :
// aucun HTML n'est injecté. Le code (``` et `) n'est jamais transformé.

export const ANCRES = { spoiler: "#discord-spoiler", souligne: "#discord-souligne", sousTexte: "#discord-sous-texte", mention: "#discord-mention" };

// Styles des dates Discord (<t:1700000000:F>)
const FORMATS_DATE = {
    t: { timeStyle: "short" },
    T: { timeStyle: "medium" },
    d: { dateStyle: "short" },
    D: { dateStyle: "long" },
    f: { dateStyle: "long", timeStyle: "short" },
    F: { dateStyle: "full", timeStyle: "short" },
};

function dateRelative(date) {
    const secondes = Math.round((date.getTime() - Date.now()) / 1000);
    const unites = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
    const [unite, duree] = unites.find(([, valeur]) => Math.abs(secondes) >= valeur) || ["second", 1];
    return new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" }).format(Math.round(secondes / duree), unite);
}

export function formaterDateDiscord(horodatage, style = "f") {
    const date = new Date(Number(horodatage) * 1000);
    if (Number.isNaN(date.getTime())) return horodatage;
    if (style === "R") return dateRelative(date);
    return date.toLocaleString("fr-FR", FORMATS_DATE[style] || FORMATS_DATE.f);
}

// Texte d'une ligne hors code : syntaxes propres à Discord
function transformerTexte(texte) {
    return texte
        // Émojis personnalisés (animés ou non) : image du CDN de Discord
        .replace(/<(a?):(\w{2,32}):(\d{5,25})>/g, (_, anime, nom, id) =>
            `![:${nom}:](https://cdn.discordapp.com/emojis/${id}.${anime ? "gif" : "webp"}?size=48 "emoji")`)
        // Dates
        .replace(/<t:(-?\d{1,13})(?::([tTdDfFR]))?>/g, (_, horodatage, style) => formaterDateDiscord(horodatage, style || "f"))
        // Mentions encore brutes (utilisateur, rôle, salon) : le nom n'est pas connu ici
        .replace(/<@!?(\d{5,25})>/g, `[@utilisateur](${ANCRES.mention})`)
        .replace(/<@&(\d{5,25})>/g, `[@rôle](${ANCRES.mention})`)
        .replace(/<#(\d{5,25})>/g, `[#salon](${ANCRES.mention})`)
        // Spoiler et souligné (avant que __ ne soit lu comme du gras)
        .replace(/\|\|(?=\S)([\s\S]*?\S)\|\|/g, `[$1](${ANCRES.spoiler})`)
        .replace(/(?<![_\\])__(?=[^\s_])([\s\S]*?[^\s_])__(?!_)/g, `[$1](${ANCRES.souligne})`);
}

// Transforme une ligne en laissant intact le code en ligne (`…`)
function transformerLigne(ligne) {
    return ligne
        .split(/(`[^`\n]+`)/)
        .map((morceau, index) => (index % 2 ? morceau : transformerTexte(morceau)))
        .join("");
}

export function discordVersMarkdown(contenu = "") {
    const lignes = String(contenu).replace(/\r\n?/g, "\n").split("\n");
    const sortie = [];
    let dansCode = false;
    let citationLongue = false; // « >>> » : tout le reste du message est cité
    let precedenteCitation = false;

    lignes.forEach((brute, index) => {
        if (/^\s*```/.test(brute)) {
            if (!dansCode && precedenteCitation && !citationLongue) sortie.push("");
            dansCode = !dansCode;
            sortie.push(citationLongue ? `> ${brute}` : brute);
            precedenteCitation = citationLongue;
            return;
        }
        if (dansCode) {
            sortie.push(citationLongue ? `> ${brute}` : brute);
            return;
        }

        let ligne = brute;
        let citation = citationLongue;
        if (!citationLongue && /^>>> ?/.test(ligne)) {
            citationLongue = true;
            citation = true;
            ligne = ligne.replace(/^>>> ?/, "");
        } else if (!citationLongue && /^> /.test(ligne)) {
            citation = true;
            ligne = ligne.slice(2);
        }

        // Petit texte « -# … »
        const sousTexte = ligne.match(/^-# (.+)$/);
        ligne = sousTexte ? `[${transformerLigne(sousTexte[1])}](${ANCRES.sousTexte})` : transformerLigne(ligne);

        // Une citation Discord s'arrête à la fin de sa ligne : une ligne vide l'isole du texte qui suit
        if (precedenteCitation && !citation) sortie.push("");
        // Saut de ligne simple conservé (deux espaces en fin de ligne), sauf en fin de message
        // et après un petit texte, déjà affiché en bloc
        const fin = index < lignes.length - 1 && ligne.trim() && !sousTexte ? "  " : "";
        sortie.push(citation ? `> ${ligne}${fin}` : `${ligne}${fin}`);
        precedenteCitation = citation && ligne.trim() !== "";
    });

    return sortie.join("\n");
}
