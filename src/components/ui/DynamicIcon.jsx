import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { allIconsLoaded, isIconRegistered, loadAllIcons } from "@/utils/fontawesomeFull";

// Icône dont le nom peut venir des données (religion, couverture de livre…). Si elle ne fait pas partie des icônes
// du code, les packs complets sont chargés puis elle s'affiche ; introuvable même là, l'icône de repli la remplace.
export default function DynamicIcon({ icon, fallback = "fa-solid fa-circle-question", ...props }) {
    const [, setLoadedCount] = useState(0);
    const registered = isIconRegistered(icon);

    useEffect(() => {
        if (!icon || registered || allIconsLoaded()) return;
        let cancelled = false;
        loadAllIcons().then(() => {
            if (!cancelled) setLoadedCount((count) => count + 1);
        });
        return () => {
            cancelled = true;
        };
    }, [icon, registered]);

    if (registered) return <FontAwesomeIcon icon={icon} {...props} />;
    if (!icon || allIconsLoaded()) return <FontAwesomeIcon icon={fallback} {...props} />;
    // Packs en cours de chargement : emplacement invisible de la même taille
    return <FontAwesomeIcon icon={fallback} {...props} style={{ ...props.style, visibility: "hidden" }} />;
}
