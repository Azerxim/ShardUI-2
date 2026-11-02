import DynamicIcon from "@/components/ui/DynamicIcon";

// Médaillon d'un en-tête de fiche : l'icône de l'élément (religion, alliance, journal…) ou des initiales (personnage),
// sur un disque de métal cerné d'encre. forme : "rond" ou "carre" (journaux) ; titre : nom lu par les lecteurs d'écran.
export default function Medaillon({ fond, encre, icon = null, iconFallback = "fa-solid fa-circle-question", initiales = null, forme = "rond", titre }) {
    return (
        <span
            role="img"
            aria-label={titre}
            className={`flex items-center justify-center shrink-0 w-24 h-24 md:w-28 md:h-28 border-[3px] border-[#17131f] ${forme === "carre" ? "rounded-2xl" : "rounded-full"} ${initiales ? "font-display font-bold text-4xl md:text-5xl" : "text-5xl"}`}
            style={{ background: fond, color: encre }}
        >
            {initiales ?? <DynamicIcon icon={icon} fallback={iconFallback} />}
        </span>
    );
}
