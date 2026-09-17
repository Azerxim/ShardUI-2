import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getMesGuerres, getMesInvitationsAlliances } from "@/services/api";

// Profil : invitations d'alliance, appels aux armes et déclarations de guerre qui attendent l'utilisateur
export default function PendingActions() {
    const [invitations, setInvitations] = useState([]);
    const [guerres, setGuerres] = useState({ a_valider: [], mes_guerres: [], appels: [] });

    useEffect(() => {
        if (!localStorage.getItem("token")) return;
        getMesInvitationsAlliances()
            .then((list) => setInvitations(Array.isArray(list) ? list : []))
            .catch((error) => console.error("Error fetching invitations:", error));
        getMesGuerres()
            .then((data) => setGuerres({ a_valider: [], mes_guerres: [], appels: [], ...data }))
            .catch((error) => console.error("Error fetching guerres:", error));
    }, []);

    const aValiderIds = new Set(guerres.a_valider.map(({ guerre }) => guerre.id));
    const items = [
        ...invitations.map((invitation) => ({
            key: `invitation-${invitation.id}`,
            icon: invitation.direction === "invitation" ? "fa-solid fa-envelope" : "fa-solid fa-hand",
            text: invitation.direction === "invitation"
                ? `${invitation.civilisation.title} est invitée à rejoindre l'alliance ${invitation.alliance.title}`
                : `${invitation.civilisation.title} demande à rejoindre l'alliance ${invitation.alliance.title}`,
            href: `/alliance/${invitation.alliance.id}`,
        })),
        ...guerres.appels.map((appel) => ({
            key: `appel-${appel.belligerant_id}`,
            icon: "fa-solid fa-bullhorn",
            text: `Appel aux armes : ${appel.entite.title} est appelée dans « ${appel.guerre.title} »`,
            href: `/guerre/${appel.guerre.id}`,
        })),
        ...guerres.a_valider.map(({ guerre }) => ({
            key: `valider-${guerre.id}`,
            icon: "fa-solid fa-gavel",
            text: `Déclaration de guerre à valider : « ${guerre.title} »`,
            href: `/guerre/${guerre.id}`,
        })),
        ...guerres.mes_guerres.filter(({ guerre }) => !aValiderIds.has(guerre.id)).map(({ guerre }) => ({
            key: `declaration-${guerre.id}`,
            icon: guerre.status === "refusee" ? "fa-solid fa-ban" : "fa-solid fa-hourglass-half",
            text: guerre.status === "refusee" ? `Déclaration refusée : « ${guerre.title} »` : `« ${guerre.title} » attend la validation d'un modérateur RP`,
            href: `/guerre/${guerre.id}`,
        })),
    ];

    if (items.length === 0) return null;

    return (
        <section className="card bg-base-200 shadow-xl">
            <div className="card-body gap-4">
                <h2 className="card-title text-2xl">
                    <FontAwesomeIcon icon="fa-solid fa-bell" />
                    À traiter
                    <span className="badge badge-primary">{items.length}</span>
                </h2>
                <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                        <li key={item.key}>
                            <a href={item.href} className="flex flex-row items-center gap-3 bg-base-100 hover:bg-base-300 transition-colors rounded-2xl p-3">
                                <FontAwesomeIcon icon={item.icon} className="text-primary w-5" />
                                <span className="flex-1 min-w-0 break-words">{item.text}</span>
                                <FontAwesomeIcon icon="fa-solid fa-chevron-right" className="opacity-50" />
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
