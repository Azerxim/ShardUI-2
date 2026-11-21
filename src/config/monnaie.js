// Monnaie officielle du serveur, présentée dans le Codex (#monnaie) et sur la page des commerces.
// Frappée en jeu par la Monnaie de Tetrago, un marchand placé par l'équipe (datapack Minted Coins) :
// elle échange 1 diamant contre 8 tetras, 1 tetra contre 9 petits tetras (et inversement), et rachète 9 tetras pour
// 1 diamant. Le catalogue des boutiques enregistre ses prix en petits tetras (Shard-API crud_catalogue).
const TETRAS_PAR_DIAMANT = 8;
const TETRAS_PAR_DIAMANT_RACHAT = 9;
const PETITS_PAR_TETRA = 9;

export const MONNAIE = {
    nom: "tetra",
    pluriel: "tetras",
    petit: { nom: "petit tetra", pluriel: "petits tetras" },
    icon: "fa-solid fa-coins",
    // Pièces de diamant du pack de ressources Minted Coins (github.com/Azerxim/MC-Minted-Coins-RP, textures item/
    // diamond_coin et small_diamond_coin), copiées dans public/images/monnaie
    pieces: {
        tetra: { image: "/images/monnaie/tetra.png", nom: "Tetra", objet: "Pièce de diamant", texte: `${TETRAS_PAR_DIAMANT} frappés pour 1 diamant` },
        petit: { image: "/images/monnaie/petit-tetra.png", nom: "Petit tetra", objet: "Petite pièce de diamant", texte: `${PETITS_PAR_TETRA} pour 1 tetra` },
    },
    atelier: "la Monnaie de Tetrago",
    tetrasParDiamant: TETRAS_PAR_DIAMANT,
    tetrasParDiamantRachat: TETRAS_PAR_DIAMANT_RACHAT,
    petitsParTetra: PETITS_PAR_TETRA,
    valeur: `1 diamant = ${TETRAS_PAR_DIAMANT} tetras`,
    equivalence: `1 tetra = ${PETITS_PAR_TETRA} petits tetras`,
    cours: "Seule monnaie admise dans les échanges entre joueurs, partout sur le serveur.",
    // Ce que montre la Monnaie en jeu, dans l'ordre de ses échanges
    frappe: [
        { icon: "fa-solid fa-gem", texte: `1 diamant → ${TETRAS_PAR_DIAMANT} tetras` },
        { icon: "fa-solid fa-coins", texte: `1 tetra → ${PETITS_PAR_TETRA} petits tetras, et ${PETITS_PAR_TETRA} petits tetras → 1 tetra` },
        { icon: "fa-solid fa-rotate-left", texte: `${TETRAS_PAR_DIAMANT_RACHAT} tetras → 1 diamant (rachat)` },
    ],
    authenticite: "Chaque pièce porte la mention « Frappé par » suivie du nom de la Monnaie qui l'a frappée : seules les pièces de la Monnaie de Tetrago ont cours. Une pièce renommée à l'enclume s'affiche en italique, sans cette mention, et n'a aucune valeur.",
    obtention: [
        { icon: "fa-solid fa-handshake", titre: "Commerce", texte: "En vendant des biens et des services aux autres joueurs." },
        { icon: "fa-solid fa-gem", titre: "Frappe", texte: `En apportant des diamants à la Monnaie de Tetrago : ${TETRAS_PAR_DIAMANT} tetras par diamant.` },
        { icon: "fa-solid fa-landmark", titre: "Trésor de civilisation", texte: "Par les salaires et dépenses versés par le gouvernement d'une civilisation." },
    ],
};

// Montant en petits tetras → { tetras, petits }
export const decomposer = (petits) => ({ tetras: Math.floor(petits / PETITS_PAR_TETRA), petits: petits % PETITS_PAR_TETRA });

// { tetras, petits } → montant en petits tetras
export const enPetits = (tetras = 0, petits = 0) => tetras * PETITS_PAR_TETRA + petits;

// « 3 tetras », « 1 tetra et 4 petits tetras », « 5 petits tetras », « 0 tetra »
export const montantTexte = (petitsTotal) => {
    const { tetras, petits } = decomposer(petitsTotal);
    const nombre = (n, nom, pluriel) => `${n.toLocaleString("fr-FR")} ${n > 1 ? pluriel : nom}`;
    const parties = [];
    if (tetras > 0 || petits === 0) parties.push(nombre(tetras, MONNAIE.nom, MONNAIE.pluriel));
    if (petits > 0) parties.push(nombre(petits, MONNAIE.petit.nom, MONNAIE.petit.pluriel));
    return parties.join(" et ");
};
