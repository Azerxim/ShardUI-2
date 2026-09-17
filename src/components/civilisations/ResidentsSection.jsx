import { useEffect, useState } from "react";

import TitleH2 from "@/components/ui/TitleH2";
import PersonnageChip from "@/components/personnages/PersonnageChip";
import { getPersonnagesOfResidence } from "@/services/api";

const EMPTY_TEXT = {
    civilisation: "Aucun personnage ne vit encore dans cette civilisation.",
    ville: "Aucun personnage ne réside encore dans cette ville.",
    quartier: "Aucun personnage ne réside encore dans ce quartier.",
};

// Habitants d'une civilisation, d'une ville ou d'un quartier (résidence choisie par les joueurs sur leurs personnages)
export default function ResidentsSection({ type, id }) {
    const [fiches, setFiches] = useState([]);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        getPersonnagesOfResidence(type, id)
            .then((list) => { if (!cancelled) setFiches(Array.isArray(list) ? list : []); })
            .catch((error) => console.error("Error fetching habitants:", error));
        return () => { cancelled = true; };
    }, [type, id]);

    return (
        <>
            <TitleH2 text="Habitants" icon="fas fa-people-group" />
            {fiches.length === 0 ? (
                <div className="flex flex-row flex-wrap items-center gap-2 w-full">
                    <i className="flex-1">{EMPTY_TEXT[type]}</i>
                    <a href="/personnages" className="btn btn-sm btn-ghost bg-base-200">Voir les personnages</a>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full">
                    {fiches.map((fiche) => (
                        <PersonnageChip
                            key={fiche.personnage.id}
                            fiche={fiche}
                            detail={[type !== "quartier" ? fiche.quartier?.title : null, type === "civilisation" ? fiche.ville?.title : null, fiche.joueur ? `Joué par ${fiche.joueur.full_name || fiche.joueur.username}` : null].filter(Boolean).join(" · ") || null}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
