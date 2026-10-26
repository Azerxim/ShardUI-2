import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "@/components/layout/Navbar";
import GrimoireHero from "@/components/layout/GrimoireHero";
import TitleH2 from "@/components/ui/TitleH2";
import EtatVide from "@/components/ui/EtatVide";
import ScrutinCard from "@/components/elections/ScrutinCard";
import { ENTITES_ELECTIONS } from "@/config/elections";
import { getScrutins } from "@/services/api";

// ===== Élections RP =====
// Les scrutins de toutes les civilisations, religions et alliances publiques (Shard-API crud_elections) : en cours,
// à venir, puis terminés. Un scrutin s'ouvre depuis la section « Élections » de la fiche qui l'organise.

const GROUPES = [
    { id: "en-cours", titre: "Vote en cours", icon: "fas fa-check-to-slot", phases: ["vote", "second_tour"] },
    { id: "a-venir", titre: "Candidatures ouvertes", icon: "fas fa-user-plus", phases: ["candidatures"] },
    { id: "termines", titre: "Résultats", icon: "fas fa-box-archive", phases: ["clos", "annule"] },
];

export default function ElectionsPage() {
    const [scrutins, setScrutins] = useState(null);
    const [filtre, setFiltre] = useState("");

    useEffect(() => {
        getScrutins().then((liste) => setScrutins(Array.isArray(liste) ? liste : [])).catch(() => setScrutins([]));
    }, []);

    const visibles = (scrutins || []).filter((s) => !filtre || s.entite.type === filtre);

    return (
        <>
            <Navbar active="elections" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col gap-4">
                    <GrimoireHero
                        icon="fa-solid fa-check-to-slot"
                        title="Les élections"
                        description="Rois élus, grands prêtres désignés, chefs de file d'alliance : les scrutins des civilisations, des religions et des alliances. Le fondateur ou un admin les ouvre depuis la fiche."
                    />

                    <div role="group" aria-label="Filtrer par organisateur" className="flex flex-wrap gap-2">
                        <button type="button" aria-pressed={!filtre} onClick={() => setFiltre("")} className={`btn btn-sm rounded-full ${!filtre ? "btn-primary" : "bg-base-200"}`}>Tous</button>
                        {Object.entries(ENTITES_ELECTIONS).map(([type, entite]) => (
                            <button key={type} type="button" aria-pressed={filtre === type} onClick={() => setFiltre(type)} className={`btn btn-sm rounded-full gap-2 ${filtre === type ? "btn-primary" : "bg-base-200"}`}>
                                <FontAwesomeIcon icon={entite.icon} />
                                {entite.label}s
                            </button>
                        ))}
                    </div>

                    {scrutins === null ? (
                        <span className="loading loading-dots loading-md self-center" aria-label="Chargement"></span>
                    ) : visibles.length === 0 ? (
                        <EtatVide
                            icon="fa-solid fa-check-to-slot"
                            texte="Aucun scrutin pour l'instant."
                            aide="Le fondateur ou un admin d'une civilisation, d'une religion ou de la civilisation chef de file d'une alliance ouvre un scrutin depuis la section « Élections » de sa fiche."
                        />
                    ) : (
                        GROUPES.map((groupe) => {
                            const liste = visibles.filter((s) => groupe.phases.includes(s.phase));
                            if (liste.length === 0) return null;
                            return (
                                <section key={groupe.id} id={groupe.id} aria-label={groupe.titre} className="flex flex-col gap-2 scroll-mt-24">
                                    <TitleH2 text={`${groupe.titre} (${liste.length})`} icon={groupe.icon} />
                                    <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {liste.map((scrutin) => <ScrutinCard key={scrutin.id} scrutin={scrutin} avecEntite />)}
                                    </ul>
                                </section>
                            );
                        })
                    )}
                </div>
            </main>
        </>
    );
}
