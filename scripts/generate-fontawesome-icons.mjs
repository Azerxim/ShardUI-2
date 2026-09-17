// Liste les icônes FontAwesome citées dans src/ et écrit src/config/fontawesome.icons.js (imports icône par icône,
// enregistrés au démarrage par main.jsx). Les icônes choisies par les joueurs (religions, couvertures) viennent des
// packs complets, chargés à la demande (src/utils/fontawesomeFull.js, DynamicIcon).
// Lancé avant dev et build (npm run icons) ; une icône citée mais absente des packs est signalée.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const output = path.join(srcDir, "config", "fontawesome.icons.js");

const PREFIXES = { "fa-solid": "fas", fas: "fas", "fa-regular": "far", far: "far", "fa-brands": "fab", fab: "fab" };
const PACKS = { fas: "free-solid-svg-icons", far: "free-regular-svg-icons", fab: "free-brands-svg-icons" };

// Icônes construites dynamiquement (`fa-solid fa-${…}`) ou utilisées comme repli : invisibles pour la recherche
const EXTRA_ICONS = [
    "fa-solid fa-archway", "fa-solid fa-city", // ville capitale ou non (Commerce, Religion, VilleDetail, QuartierDetail)
    "fa-solid fa-circle-question", // repli de DynamicIcon
];

const ICON_PATTERN = /\b(fa-solid|fa-regular|fa-brands|fas|far|fab)\s+fa-([a-z0-9]+(?:-[a-z0-9]+)*)\b/g;
const SOURCE_FILES = /\.(jsx?|json)$/;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return SOURCE_FILES.test(entry.name) && full !== output ? [full] : [];
});

// "person-walking" -> "faPersonWalking" (nom du fichier d'icône dans le paquet)
const exportName = (iconName) => `fa${iconName.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")}`;

const found = new Map(); // "fas:cross" -> { prefix, iconName }
const collect = (text) => {
    for (const match of text.matchAll(ICON_PATTERN)) {
        const prefix = PREFIXES[match[1]];
        found.set(`${prefix}:${match[2]}`, { prefix, iconName: match[2] });
    }
};
walk(srcDir).forEach((file) => collect(fs.readFileSync(file, "utf-8")));
EXTRA_ICONS.forEach(collect);

const imports = [];
const variables = [];
const missing = [];
for (const { prefix, iconName } of [...found.values()].sort((a, b) => `${a.prefix}${a.iconName}`.localeCompare(`${b.prefix}${b.iconName}`))) {
    const name = exportName(iconName);
    const file = path.join(root, "node_modules", "@fortawesome", PACKS[prefix], `${name}.js`);
    if (!fs.existsSync(file)) {
        missing.push(`${prefix} fa-${iconName}`);
        continue;
    }
    const variable = `${prefix}${name.slice(2)}`;
    imports.push(`import { definition as ${variable} } from "@fortawesome/${PACKS[prefix]}/${name}";`);
    variables.push(variable);
}

const content = [
    "// Généré par scripts/generate-fontawesome-icons.mjs (npm run icons) : ne pas modifier à la main.",
    "// Icônes citées dans le code, enregistrées au démarrage (main.jsx).",
    ...imports,
    "",
    "export default [",
    ...variables.map((variable) => `    ${variable},`),
    "];",
    "",
].join("\n");

// Réécrit seulement si la liste change (évite de relancer le rechargement à chaud de Vite)
if (!fs.existsSync(output) || fs.readFileSync(output, "utf-8") !== content) {
    fs.writeFileSync(output, content);
}
console.log(`FontAwesome : ${variables.length} icônes enregistrées dans ${path.relative(root, output)}`);
if (missing.length > 0) {
    console.warn(`FontAwesome : icônes introuvables dans les packs, ignorées : ${missing.join(", ")}`);
    if (process.argv.includes("--strict")) process.exit(1);
}
