// Monnaie officielle du serveur, présentée dans le Codex (#monnaie) et sur la page des commerces
export const MONNAIE = {
    nom: "tetra",
    pluriel: "tetras",
    icon: "fa-solid fa-gem",
    valeur: "1 tetra = 1 diamant",
    equivalence: "Un bloc de diamant vaut 9 tetras.",
    cours: "Seule monnaie admise dans les échanges entre joueurs, partout sur le serveur.",
    obtention: [
        { icon: "fa-solid fa-handshake", titre: "Commerce", texte: "En vendant des biens et des services aux autres joueurs." },
        { icon: "fa-solid fa-person-digging", titre: "Minage", texte: "En extrayant des diamants dans les profondeurs du monde." },
        { icon: "fa-solid fa-landmark", titre: "Trésor de civilisation", texte: "Par les salaires et dépenses versés par le gouvernement d'une civilisation." },
    ],
};
