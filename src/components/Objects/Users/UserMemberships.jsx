import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getCivilisations, getReligions, getCommerces } from "../../../services/api";
import PendingActions from "./PendingActions";

const GROUPS = [
    { key: "civilisations", title: "Mes civilisations", icon: "fa-solid fa-flag", load: getCivilisations, pick: (item) => item.civilisation, href: (entity) => `/civilisation/${entity.id}` },
    { key: "religions", title: "Mes religions", icon: "fa-solid fa-cross", load: getReligions, pick: (item) => item.religion, href: (entity) => `/religion/${entity.id}` },
    { key: "commerces", title: "Mes commerces", icon: "fa-solid fa-shop", load: getCommerces, pick: (item) => item.commerce, href: (entity) => `/commerce/${entity.id}` },
];

const NEXT_STEPS = [
    { icon: "fa-solid fa-scroll", title: "Lire le Codex", text: "Les règles du serveur et du rôle-play.", href: "/codex" },
    { icon: "fa-solid fa-flag", title: "Rejoindre une civilisation", text: "Parcourez-les et contactez leur fondateur, ou fondez la vôtre.", href: "/civilisations" },
    { icon: "fa-solid fa-cross", title: "Découvrir les religions", text: "Rejoignez un culte ou fondez le vôtre.", href: "/religions" },
    { icon: "fa-solid fa-shop", title: "Ouvrir un commerce", text: "Créez votre enseigne, puis ajoutez vos magasins.", href: "/commerces" },
];

// Profil : civilisations, religions et commerces de l'utilisateur, et pistes pour bien commencer
export default function UserMemberships({ userId }) {
    const [groups, setGroups] = useState(null);

    useEffect(() => {
        let cancelled = false;

        Promise.all(GROUPS.map((group) => group.load()
            .then((list) => (Array.isArray(list) ? list : []).flatMap((item) => {
                const member = (item.members || []).find((m) => m.user_id === userId);
                return member ? [{ entity: group.pick(item), role: member.role }] : [];
            }))
            .catch((error) => {
                console.error(`Error fetching ${group.key}:`, error);
                return [];
            })))
            .then((results) => {
                if (!cancelled) setGroups(results);
            });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const total = groups ? groups.reduce((sum, list) => sum + list.length, 0) : 0;

    return (
        <div className="max-w-4xl mx-auto mt-6 flex flex-col gap-6">
            <PendingActions />
            <section className="card bg-base-200 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl">
                        <FontAwesomeIcon icon="fa-solid fa-users" />
                        Mes appartenances
                    </h2>
                    {groups === null ? (
                        <span className="loading loading-spinner"></span>
                    ) : total === 0 ? (
                        <p className="opacity-80">Vous ne faites encore partie d'aucune civilisation, religion ou commerce.</p>
                    ) : GROUPS.map((group, index) => groups[index].length > 0 ? (
                        <div key={group.key} className="flex flex-col gap-2">
                            <span className="flex flex-row items-center gap-2 font-semibold">
                                <FontAwesomeIcon icon={group.icon} className="opacity-70" />
                                {group.title}
                            </span>
                            <div className="flex flex-row flex-wrap gap-2">
                                {groups[index].map(({ entity, role }) => (
                                    <a key={entity.id} href={group.href(entity)} className="flex flex-row items-center gap-2 bg-base-100 hover:bg-base-300 transition-colors rounded-full px-3 py-1.5">
                                        <span>{entity.title}</span>
                                        <span className={`badge badge-sm ${role === "Fondateur" ? "badge-primary" : "badge-ghost"}`}>{role}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ) : null)}
                </div>
            </section>

            <section className="card bg-base-200 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl">
                        <FontAwesomeIcon icon="fa-solid fa-signs-post" />
                        Prochaines étapes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {NEXT_STEPS.map((step) => (
                            <a key={step.href} href={step.href} className="flex flex-row items-start gap-3 bg-base-100 hover:bg-base-300 transition-colors rounded-2xl p-3">
                                <FontAwesomeIcon icon={step.icon} className="text-xl mt-1 text-primary" />
                                <span className="flex flex-col">
                                    <span className="font-semibold">{step.title}</span>
                                    <span className="text-sm opacity-70">{step.text}</span>
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
