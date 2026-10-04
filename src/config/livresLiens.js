// Ce à quoi un livre peut être lié (Shard-API crud_livres) : libellé, icône et page.
// Seul un lien vers une civilisation donne des droits : ses dirigeants peuvent modifier le livre.
export const LIENS_LIVRES = {
    civilisation: { label: "Civilisation", icon: "fa-solid fa-flag", href: (id) => `/civilisation/${id}` },
    religion: { label: "Religion", icon: "fa-solid fa-cross", href: (id) => `/religion/${id}` },
    commerce: { label: "Commerce", icon: "fa-solid fa-shop", href: (id) => `/commerce/${id}` },
    alliance: { label: "Alliance", icon: "fa-solid fa-handshake", href: (id) => `/alliance/${id}` },
    personnage: { label: "Personnage", icon: "fa-solid fa-masks-theater", href: (id) => `/personnage/${id}` },
};
