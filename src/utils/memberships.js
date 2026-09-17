import { getCivilisations, getCommerces, getReligions } from "@/services/api";

// Civilisations, religions et commerces dont un utilisateur est membre (profil et profil public)
export const MEMBERSHIP_GROUPS = [
    { key: "civilisations", title: "Mes civilisations", publicTitle: "Civilisations", icon: "fa-solid fa-flag", load: getCivilisations, pick: (item) => item.civilisation, href: (entity) => `/civilisation/${entity.id}` },
    { key: "religions", title: "Mes religions", publicTitle: "Religions", icon: "fa-solid fa-cross", load: getReligions, pick: (item) => item.religion, href: (entity) => `/religion/${entity.id}` },
    { key: "commerces", title: "Mes commerces", publicTitle: "Commerces", icon: "fa-solid fa-shop", load: getCommerces, pick: (item) => item.commerce, href: (entity) => `/commerce/${entity.id}` },
];

// [[{ entity, role }], …] dans l'ordre de MEMBERSHIP_GROUPS ; publicOnly : sans les entités privées
export const loadMemberships = (userId, { publicOnly = false } = {}) => Promise.all(MEMBERSHIP_GROUPS.map((group) => group.load()
    .then((list) => (Array.isArray(list) ? list : []).flatMap((item) => {
        const member = (item.members || []).find((m) => m.user_id === userId);
        const entity = group.pick(item);
        if (!member || !entity || (publicOnly && entity.is_public === false)) return [];
        return [{ entity, role: member.role }];
    }))
    .catch((error) => {
        console.error(`Error fetching ${group.key}:`, error);
        return [];
    })));
