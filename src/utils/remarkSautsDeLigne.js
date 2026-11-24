// Plugin remark : sauts de ligne forcés dans les lecteurs Markdown (MarkdownContent, DiscordMarkdown).
// - La balise <br> (<br/>, <br />, sans casse) devient un vrai saut de ligne. Seule cette balise est reconnue : le reste
//   du HTML brut reste ignoré par react-markdown, aucun HTML n'est injecté. Elle sert aussi dans un tableau, où un
//   retour à la ligne est impossible. Seule sur sa ligne, entre deux lignes vides, elle ajoute une ligne vide.
// - Option retoursSimples : un retour à la ligne simple (Entrée) est lui aussi un saut de ligne, comme sur Discord,
//   au lieu d'être fondu dans le paragraphe (CommonMark). Le code (`…` et ```) n'est jamais touché.

const BR = /<br\s*\/?>/gi;
const SEULEMENT_BR = /^(\s*<br\s*\/?>\s*)+$/i;

function sautsDeLigne(texte, position) {
    const morceaux = [];
    texte.split("\n").forEach((ligne, index) => {
        if (index > 0) morceaux.push({ type: "break" });
        if (ligne) morceaux.push({ type: "text", value: ligne, position });
    });
    return morceaux;
}

function parcourir(noeud, retoursSimples) {
    if (!Array.isArray(noeud.children)) return;
    noeud.children = noeud.children.flatMap((enfant) => {
        if (enfant.type === "html" && SEULEMENT_BR.test(enfant.value)) {
            const sauts = enfant.value.match(BR).map(() => ({ type: "break" }));
            // Bloc HTML (seul entre deux lignes vides) : un paragraphe qui ne contient que les sauts
            return noeud.type === "root" || noeud.type === "blockquote" || noeud.type === "listItem"
                ? [{ type: "paragraph", children: sauts }]
                : sauts;
        }
        if (retoursSimples && enfant.type === "text" && enfant.value.includes("\n")) {
            return sautsDeLigne(enfant.value, enfant.position);
        }
        parcourir(enfant, retoursSimples);
        return [enfant];
    });
}

export default function remarkSautsDeLigne({ retoursSimples = false } = {}) {
    return (arbre) => parcourir(arbre, retoursSimples);
}
