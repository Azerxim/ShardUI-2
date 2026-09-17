import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import PersonnageChip from "@/components/personnages/PersonnageChip";
import { residenceText } from "@/utils/personnages";
import { plural } from "@/utils/plural";
import { getPersonnagesOfUser } from "@/services/api";

// Personnages d'un joueur : « Mes personnages » sur son profil (own), « Personnages » sur son profil public
export default function UserPersonnages({ userId, own = false, className = "max-w-4xl mx-auto mt-6" }) {
    const [fiches, setFiches] = useState(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        getPersonnagesOfUser(userId)
            .then((list) => { if (!cancelled) setFiches(Array.isArray(list) ? list : []); })
            .catch((error) => {
                console.error("Error fetching personnages:", error);
                if (!cancelled) setFiches([]);
            });
        return () => { cancelled = true; };
    }, [userId]);

    return (
        <section className={`card bg-base-200 shadow-xl ${className}`}>
            <div className="card-body gap-4">
                <div className="flex flex-row flex-wrap items-center gap-2">
                    <h2 className="card-title text-2xl flex-1">
                        <FontAwesomeIcon icon="fa-solid fa-masks-theater" />
                        {own ? "Mes personnages" : "Personnages"}
                    </h2>
                    {own ? (
                        <a href="/personnages?nouveau=1" className="btn btn-sm btn-primary rounded-3xl gap-2">
                            <FontAwesomeIcon icon="fas fa-plus" />
                            Nouveau personnage
                        </a>
                    ) : null}
                </div>
                {fiches === null ? (
                    <span className="loading loading-spinner"></span>
                ) : fiches.length === 0 ? (
                    <p className="opacity-80">
                        {own
                            ? "Vous n'avez encore aucun personnage. Créez-en autant que vous le souhaitez, sans validation, puis associez-leur vos messages de journaux."
                            : "Ce joueur n'a pas encore de personnage."}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {fiches.map((fiche) => (
                            <PersonnageChip
                                key={fiche.personnage.id}
                                fiche={fiche}
                                detail={[residenceText(fiche), fiche.messages_count > 0 ? plural(fiche.messages_count, "message") : null].filter(Boolean).join(" · ") || null}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
