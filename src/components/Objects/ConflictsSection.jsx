import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import TitleH2 from "./TitleH2";
import { ALLIANCE_ROLE_BADGES, GUERRE_STATUTS, GUERRE_TYPES } from "../Functions/conflits";
import { getAlliancesOfCivilisation, getGuerresOfEntity } from "../../services/api";

// Fiche d'une civilisation (alliances et guerres) ou d'une religion (guerres de religion)
export default function ConflictsSection({ entityType, entityId }) {
    const [alliances, setAlliances] = useState([]);
    const [guerres, setGuerres] = useState([]);

    useEffect(() => {
        if (!entityId) return;
        if (entityType === "civilisation") {
            getAlliancesOfCivilisation(entityId)
                .then((list) => setAlliances(Array.isArray(list) ? list : []))
                .catch((error) => console.error("Error fetching alliances:", error));
        }
        getGuerresOfEntity(entityType, entityId)
            .then((list) => setGuerres(Array.isArray(list) ? list : []))
            .catch((error) => console.error("Error fetching guerres:", error));
    }, [entityType, entityId]);

    const sortedGuerres = [...guerres].sort((a, b) => Number(b.guerre.status === "en_cours") - Number(a.guerre.status === "en_cours"));

    return (
        <>
            {entityType === "civilisation" ? (
                <>
                    <TitleH2 text="Alliances" icon="fas fa-handshake" />
                    {alliances.length === 0 ? (
                        <div className="flex flex-row flex-wrap items-center gap-2 w-full">
                            <i className="flex-1">Cette civilisation ne fait partie d'aucune alliance.</i>
                            <a href="/alliances" className="btn btn-sm btn-ghost bg-base-200">Voir les alliances</a>
                        </div>
                    ) : (
                        <div className="flex flex-row flex-wrap gap-2 w-full">
                            {alliances.map(({ alliance, role }) => (
                                <a key={alliance.id} href={`/alliance/${alliance.id}`} className="flex flex-row items-center gap-2 bg-base-200 hover:bg-base-300 transition-colors rounded-full px-3 py-1.5">
                                    <FontAwesomeIcon icon={alliance.icon || "fa-solid fa-handshake"} style={{ color: alliance.color || undefined }} />
                                    <span>{alliance.title}</span>
                                    <span className={`badge badge-sm ${ALLIANCE_ROLE_BADGES[role] ?? "badge-ghost"}`}>{role}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </>
            ) : null}

            <TitleH2 text={entityType === "religion" ? "Guerres de religion" : "Guerres"} icon="fas fa-shield-halved" />
            {sortedGuerres.length === 0 ? (
                <i className="w-full">{entityType === "religion" ? "Cette religion n'a mené aucune guerre." : "Cette civilisation n'a pris part à aucune guerre."}</i>
            ) : (
                <ul className="flex flex-col gap-2 w-full">
                    {sortedGuerres.map(({ guerre, camps }) => {
                        const statut = GUERRE_STATUTS[guerre.status] ?? { label: guerre.status, badge: "badge-ghost" };
                        const camp = ["attaquant", "defenseur"].find((key) => (camps?.[key] ?? []).some((b) => b.entite.type === entityType && b.entite.id === entityId));
                        return (
                            <li key={guerre.id}>
                                <a href={`/guerre/${guerre.id}`} className="flex flex-row flex-wrap items-center gap-2 bg-base-200 hover:bg-base-300 transition-colors rounded-2xl p-3">
                                    <FontAwesomeIcon icon={(GUERRE_TYPES[guerre.type] ?? GUERRE_TYPES.Militaire).icon} className="opacity-80" />
                                    <span className="font-bold flex-1 min-w-0 break-words">{guerre.title}</span>
                                    {camp ? <span className="badge badge-sm badge-ghost">{camp === "attaquant" ? "Attaquant" : "Défenseur"}</span> : null}
                                    <span className={`badge badge-sm ${statut.badge}`}>{statut.label}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
