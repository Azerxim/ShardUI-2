import PersonnageAvatar from "@/components/personnages/PersonnageAvatar";
import { PERSONNAGE_STATUTS } from "@/utils/personnages";

// Lien compact vers un personnage (profil, habitants d'un lieu)
export default function PersonnageChip({ fiche, detail = null }) {
    const { personnage } = fiche;
    const statut = PERSONNAGE_STATUTS[personnage.status];
    return (
        <a href={`/personnage/${personnage.id}`} className="flex flex-row items-center gap-3 bg-base-100 hover:bg-base-300 transition-colors rounded-2xl p-2 pr-3 min-w-0">
            <PersonnageAvatar personnage={personnage} />
            <span className="flex flex-col min-w-0 flex-1">
                <span className="flex flex-row flex-wrap items-center gap-2">
                    <span className="font-semibold break-words">{personnage.name}</span>
                    {personnage.status !== "vivant" && statut ? <span className={`badge badge-sm ${statut.badge}`}>{statut.label}</span> : null}
                </span>
                {detail ? <span className="text-sm opacity-70 truncate">{detail}</span> : null}
            </span>
        </a>
    );
}
