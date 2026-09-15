import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import DynamicIcon from "./DynamicIcon";
import { isIconRegistered, loadAllIcons } from "../Functions/fontawesomeFull";

// Toutes les icônes FontAwesome : les packs complets sont chargés à la demande (fontawesomeFull.js)
const STYLES = [
    { key: "fa-solid", label: "Solid", prefix: "fas" },
    { key: "fa-regular", label: "Regular", prefix: "far" },
    { key: "fa-brands", label: "Brands", prefix: "fab" },
];

const MAX_RESULTS = 240;

// Liste unique des icônes (les packs contiennent aussi les alias sous d'autres clés)
const buildIcons = (packs) => STYLES.flatMap(({ key, prefix }) => {
    const seen = new Set();
    return Object.values(packs[prefix])
        .filter((definition) => definition.prefix === prefix && !seen.has(definition.iconName) && seen.add(definition.iconName))
        .map((definition) => {
            const aliases = (definition.icon?.[2] || []).filter((alias) => typeof alias === "string");
            return {
                value: `${key} fa-${definition.iconName}`,
                style: key,
                name: definition.iconName,
                search: [definition.iconName, ...aliases].join(" ").toLowerCase(),
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
});

export default function IconPicker({ value = "", onChange = () => { }, placeholder = "Choisir une icône" }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [style, setStyle] = useState("all");
    const [icons, setIcons] = useState(null);

    // Packs chargés à l'ouverture de la liste, ou pour vérifier l'icône déjà choisie
    useEffect(() => {
        if (!open && !value) return;
        let cancelled = false;
        loadAllIcons().then((packs) => {
            if (!cancelled) setIcons(buildIcons(packs));
        });
        return () => {
            cancelled = true;
        };
    }, [open, value]);

    const unknown = Boolean(value && icons && !isIconRegistered(value));

    const results = useMemo(() => {
        const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
        return (icons || []).filter((icon) => (style === "all" || icon.style === style) && terms.every((term) => icon.search.includes(term)));
    }, [icons, search, style]);

    const select = (icon) => {
        onChange(icon);
        setOpen(false);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-row items-center gap-2 w-full">
                <button
                    type="button"
                    className="flex flex-row items-center gap-3 flex-1 min-w-0 bg-base-100 brightness-98 rounded-3xl px-4 h-10 text-left cursor-pointer"
                    onClick={() => setOpen((isOpen) => !isOpen)}
                    aria-expanded={open}
                >
                    <span className="flex items-center justify-center w-6 shrink-0">
                        {value && !unknown ? <DynamicIcon icon={value} fallback="fa-regular fa-image" /> : <FontAwesomeIcon icon="fa-regular fa-image" className="opacity-40" />}
                    </span>
                    <span className={`truncate flex-1 ${value ? "" : "opacity-50"}`}>{value || placeholder}</span>
                    <FontAwesomeIcon icon={open ? "fa-solid fa-chevron-up" : "fa-solid fa-chevron-down"} className="opacity-60" />
                </button>
                {value ? (
                    <button type="button" className="btn btn-sm btn-ghost btn-circle tooltip" data-tip="Retirer l'icône" onClick={() => onChange("")}>
                        <FontAwesomeIcon icon="fa-solid fa-xmark" />
                    </button>
                ) : null}
            </div>

            {unknown ? (
                <p className="label text-warning">Icône introuvable : l'icône par défaut sera affichée.</p>
            ) : null}

            {open ? (
                <div className="flex flex-col gap-2 bg-base-200 rounded-3xl p-3">
                    <label className="input input-ghost bg-base-100 brightness-98 w-full rounded-3xl">
                        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="opacity-60" />
                        <input
                            type="search"
                            placeholder="Rechercher (ex. cross, church, star...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                        />
                    </label>

                    <div className="flex flex-row flex-wrap gap-1">
                        {[{ key: "all", label: "Toutes" }, ...STYLES].map((option) => (
                            <button
                                key={option.key}
                                type="button"
                                className={`btn btn-xs rounded-3xl ${style === option.key ? "btn-primary" : "btn-ghost"}`}
                                onClick={() => setStyle(option.key)}
                            >
                                {option.label}
                            </button>
                        ))}
                        <span className="text-xs opacity-60 self-center ml-auto">
                            {icons ? `${results.length} icône${results.length > 1 ? "s" : ""}` : "Chargement…"}
                        </span>
                    </div>

                    {icons ? (
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 max-h-64 overflow-y-auto pr-1">
                            {results.slice(0, MAX_RESULTS).map((icon) => (
                                <button
                                    key={icon.value}
                                    type="button"
                                    title={icon.value}
                                    aria-label={icon.value}
                                    className={`btn btn-ghost btn-square h-11 w-full text-lg ${icon.value === value ? "btn-active text-primary" : ""}`}
                                    onClick={() => select(icon.value)}
                                >
                                    <FontAwesomeIcon icon={icon.value} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center py-6">
                            <span className="loading loading-spinner"></span>
                        </div>
                    )}

                    {icons && results.length > MAX_RESULTS ? (
                        <p className="text-xs opacity-60 text-center">
                            {MAX_RESULTS} premiers résultats affichés : affinez la recherche.
                        </p>
                    ) : icons && results.length === 0 ? (
                        <p className="text-sm opacity-60 text-center">Aucune icône trouvée.</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
