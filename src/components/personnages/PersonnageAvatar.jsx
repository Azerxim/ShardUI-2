import { useState } from "react";

import { minecraftHead } from "@/utils/personnages";

const SIZES = { sm: "w-8 h-8 text-sm", md: "w-10 h-10", lg: "w-16 h-16 text-2xl", xl: "w-24 h-24 text-4xl" };

// Couleur stable par personnage
const colorOf = (id) => `hsl(${((Number(id) || 0) * 137) % 360} 45% 40%)`;

// Portrait d'un personnage, sinon la tête de son skin Minecraft, sinon son initiale (aussi si l'image ne se charge pas)
export default function PersonnageAvatar({ personnage, size = "md" }) {
    const [failed, setFailed] = useState(false);
    const classes = `flex items-center justify-center rounded-full shrink-0 overflow-hidden font-bold text-white shadow-md ${SIZES[size] ?? SIZES.md}`;
    const head = !personnage?.image_url && personnage?.minecraft_uuid;
    const src = personnage?.image_url || (head ? minecraftHead(personnage.minecraft_uuid, 128) : null);

    if (src && !failed) {
        return (
            <span className={`${classes} ${head ? "bg-base-300" : ""}`}>
                <img
                    src={src}
                    alt={`Portrait de ${personnage.name}`}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="w-full h-full object-cover"
                    style={head ? { imageRendering: "pixelated" } : undefined}
                />
            </span>
        );
    }
    return (
        <span className={classes} style={{ backgroundColor: colorOf(personnage?.id) }} aria-hidden="true">
            {(personnage?.name || "?").charAt(0).toUpperCase()}
        </span>
    );
}
