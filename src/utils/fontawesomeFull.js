import { findIconDefinition, library } from "@fortawesome/fontawesome-svg-core";

// Packs FontAwesome complets (≈ 1,8 Mo), chargés à la demande : icônes choisies par les joueurs (religions, couvertures)
// et sélecteur d'icônes. Les icônes citées dans le code sont enregistrées au démarrage (main.jsx, fontawesome.icons.js).
let packsPromise = null;
let packsLoaded = false;

export function loadAllIcons() {
    packsPromise ??= Promise.all([
        import("@fortawesome/free-solid-svg-icons"),
        import("@fortawesome/free-regular-svg-icons"),
        import("@fortawesome/free-brands-svg-icons"),
    ]).then(([solid, regular, brands]) => {
        const packs = { fas: solid.fas, far: regular.far, fab: brands.fab };
        library.add(packs.fas, packs.far, packs.fab);
        packsLoaded = true;
        return packs;
    });
    return packsPromise;
}

export const allIconsLoaded = () => packsLoaded;

const PREFIXES = { "fa-solid": "fas", fas: "fas", "fa-regular": "far", far: "far", "fa-brands": "fab", fab: "fab" };

// "fa-solid fa-cross" ou "fas fa-cross" -> { prefix: "fas", iconName: "cross" } ; null sans nom d'icône
export function parseIcon(value) {
    const tokens = String(value || "").trim().split(/\s+/);
    const name = tokens.find((token) => token.startsWith("fa-") && !PREFIXES[token]);
    if (!name) return null;
    return { prefix: PREFIXES[tokens.find((token) => PREFIXES[token])] ?? "fas", iconName: name.slice(3) };
}

// L'icône est-elle déjà dans la bibliothèque (icônes du code, ou packs complets une fois chargés) ?
export function isIconRegistered(value) {
    const icon = parseIcon(value);
    return Boolean(icon && findIconDefinition(icon));
}
