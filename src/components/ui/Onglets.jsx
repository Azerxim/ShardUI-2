import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Barre d'onglets au motif ARIA (tablist) : flèches, Début et Fin passent d'un onglet à l'autre.
// Chaque onglet porte l'id `${prefixe}-${id}-titre` et commande le panneau `${prefixe}-${id}` (voir PanneauOnglet).
// variante « boite » : grands onglets en pastilles ; « bordure » : onglets soulignés, défilants sur téléphone.
export default function Onglets({ onglets, actif, onChange, label, prefixe, variante = "boite", className = "" }) {
    const refs = useRef({});

    const surTouche = (event) => {
        const index = onglets.findIndex((onglet) => onglet.id === actif);
        const cibles = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: onglets.length - 1 };
        if (!(event.key in cibles)) return;
        event.preventDefault();
        const suivant = onglets[(cibles[event.key] + onglets.length) % onglets.length];
        onChange(suivant.id);
        refs.current[suivant.id]?.focus();
    };

    const boite = variante === "boite";
    return (
        <div
            role="tablist"
            aria-label={label}
            onKeyDown={surTouche}
            className={`tabs flex-nowrap ${boite ? "tabs-box bg-base-200 rounded-3xl p-1.5 w-full sm:w-fit" : "tabs-border overflow-x-auto overflow-y-hidden w-full"} ${className}`}
        >
            {onglets.map((onglet) => (
                <button
                    key={onglet.id}
                    ref={(element) => { refs.current[onglet.id] = element; }}
                    id={`${prefixe}-${onglet.id}-titre`}
                    type="button"
                    role="tab"
                    aria-selected={actif === onglet.id}
                    aria-controls={`${prefixe}-${onglet.id}`}
                    tabIndex={actif === onglet.id ? 0 : -1}
                    onClick={() => onChange(onglet.id)}
                    className={`tab gap-2 whitespace-nowrap ${boite ? "rounded-3xl flex-1 sm:flex-none" : "shrink-0"} ${actif === onglet.id ? "tab-active" : ""}`}
                >
                    {onglet.icon ? <FontAwesomeIcon icon={onglet.icon} /> : null}
                    {onglet.text}
                </button>
            ))}
        </div>
    );
}

// Panneau commandé par un onglet ; les panneaux fermés restent montés (saisies conservées)
export function PanneauOnglet({ prefixe, id, actif, className, children }) {
    return (
        <div id={`${prefixe}-${id}`} role="tabpanel" aria-labelledby={`${prefixe}-${id}-titre`} hidden={actif !== id} className={className}>
            {children}
        </div>
    );
}
