import DynamicIcon from "@/components/ui/DynamicIcon";

// Blason d'une fiche : un écu (champ) chargé d'un meuble, l'icône FontAwesome de l'élément (souvent choisie par les joueurs).
// largeur : en pixels, la hauteur suit les proportions de l'écu ; titre : nom lu par les lecteurs d'écran (sinon décoratif) ;
// contour : trait de l'écu (encre ; de l'or pour détacher un blason posé sur un aplat de sa propre couleur).
export default function Blason({ champ, meuble, icon, iconFallback = "fa-solid fa-flag", largeur = 104, titre = null, contour = "#17131f" }) {
    const hauteur = Math.round(largeur * 70 / 58);
    return (
        <span
            className="relative inline-flex shrink-0"
            style={{ width: largeur, height: hauteur }}
            role={titre ? "img" : undefined}
            aria-label={titre ?? undefined}
            aria-hidden={titre ? undefined : true}
        >
            <svg width={largeur} height={hauteur} viewBox="0 0 58 70" aria-hidden="true" className="absolute inset-0">
                <path d="M3 3H55V36C55 53 42 63 29 67C16 63 3 53 3 36Z" fill={champ} stroke={contour} strokeWidth="3" strokeLinejoin="round" />
            </svg>
            <span className="absolute inset-x-0 flex justify-center" style={{ top: "26%", color: meuble, fontSize: largeur * 0.36 }}>
                <DynamicIcon icon={icon} fallback={iconFallback} />
            </span>
        </span>
    );
}
