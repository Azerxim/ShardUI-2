import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Stat from "../Stat";
import DynamicIcon from "../DynamicIcon";
import { MEMBERSHIP_GROUPS, loadMemberships } from "../../Functions/memberships";
import { getJournauxOfUser, getLivresOfUser, getPersonnagesOfUser } from "../../../services/api";

const asList = (value) => (Array.isArray(value) ? value : []);
const ROLE_BADGES = { Fondateur: "badge-primary", Admin: "badge-secondary" };

// Chiffres clés, appartenances et écrits d'un joueur : mêmes blocs sur son profil et sur son profil public.
// own : son propre profil (ses entités privées sont incluses et les libellés sont à la première personne).
export default function ProfilInfos({ userId, own = false }) {
    const [details, setDetails] = useState(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        Promise.all([
            loadMemberships(userId, { publicOnly: !own }),
            getJournauxOfUser(userId).then(asList).catch(() => []),
            getLivresOfUser(userId).then(asList).catch(() => []),
            getPersonnagesOfUser(userId).then(asList).catch(() => []),
        ]).then(([groups, journaux, livres, personnages]) => {
            if (cancelled) return;
            const visible = (item) => own || item.is_public !== false;
            setDetails({
                groups,
                journaux: journaux.filter(visible),
                livres: livres.filter(visible),
                personnagesCount: personnages.length,
            });
        });
        return () => {
            cancelled = true;
        };
    }, [userId, own]);

    const memberships = details ? details.groups.reduce((sum, list) => sum + list.length, 0) : null;
    const ecrits = details ? [
        ...details.journaux.map((journal) => ({ key: `journal-${journal.id}`, title: journal.title, href: `/bibliotheque/journal/${journal.id}`, icon: journal.cover_icon, fallback: "fa-solid fa-newspaper", kind: "Journal", prive: journal.is_public === false })),
        ...details.livres.map((livre) => ({ key: `livre-${livre.id}`, title: livre.title, href: `/bibliotheque/livre/${livre.id}`, icon: livre.cover_icon, fallback: "fa-solid fa-book", kind: "Livre", prive: livre.is_public === false })),
    ] : [];
    const statValue = (value) => (details ? value : "…");

    return (
        <div className="flex flex-col gap-6">
            {/* Chiffres clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat icon="fa-solid fa-masks-theater" label={details?.personnagesCount > 1 ? "Personnages" : "Personnage"} value={statValue(details?.personnagesCount)} />
                <Stat icon="fa-solid fa-users" label={memberships > 1 ? "Appartenances" : "Appartenance"} value={statValue(memberships)} />
                <Stat icon="fa-solid fa-newspaper" label={details?.journaux.length > 1 ? "Journaux" : "Journal"} value={statValue(details?.journaux.length)} />
                <Stat icon="fa-solid fa-book" label={details?.livres.length > 1 ? "Livres" : "Livre"} value={statValue(details?.livres.length)} />
            </div>

            {/* Civilisations, religions et commerces */}
            <section className="card bg-base-200 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl">
                        <FontAwesomeIcon icon="fa-solid fa-users" />
                        {own ? "Mes appartenances" : "Appartenances"}
                    </h2>
                    {details === null ? (
                        <span className="loading loading-spinner"></span>
                    ) : memberships === 0 ? (
                        <p className="opacity-80">
                            {own
                                ? "Vous ne faites encore partie d'aucune civilisation, religion ou commerce."
                                : "Ce joueur ne fait partie d'aucune civilisation, religion ou commerce public."}
                        </p>
                    ) : MEMBERSHIP_GROUPS.map((group, index) => details.groups[index].length > 0 ? (
                        <div key={group.key} className="flex flex-col gap-2">
                            <span className="flex flex-row items-center gap-2 font-semibold">
                                <FontAwesomeIcon icon={group.icon} className="opacity-70" />
                                {own ? group.title : group.publicTitle}
                            </span>
                            <div className="flex flex-row flex-wrap gap-2">
                                {details.groups[index].map(({ entity, role }) => (
                                    <a key={entity.id} href={group.href(entity)} className="flex flex-row items-center gap-2 bg-base-100 hover:bg-base-300 transition-colors rounded-full px-3 py-1.5">
                                        <span>{entity.title}</span>
                                        {own && entity.is_public === false ? <span className="badge badge-sm badge-warning">Privé</span> : null}
                                        <span className={`badge badge-sm ${ROLE_BADGES[role] ?? "badge-ghost"}`}>{role}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ) : null)}
                </div>
            </section>

            {/* Journaux et livres de la bibliothèque */}
            <section className="card bg-base-200 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl">
                        <FontAwesomeIcon icon="fa-solid fa-feather" />
                        {own ? "Mes écrits" : "Écrits"}
                    </h2>
                    {details === null ? (
                        <span className="loading loading-spinner"></span>
                    ) : ecrits.length === 0 ? (
                        <p className="opacity-80">
                            {own ? "Vous n'avez encore publié ni journal ni livre." : "Ce joueur n'a encore publié ni journal ni livre."}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ecrits.map((ecrit) => (
                                <a key={ecrit.key} href={ecrit.href} className="flex flex-row items-center gap-3 bg-base-100 hover:bg-base-300 transition-colors rounded-2xl p-3 min-w-0">
                                    <DynamicIcon icon={ecrit.icon || ecrit.fallback} fallback={ecrit.fallback} className="text-lg opacity-80" />
                                    <span className="flex flex-col min-w-0">
                                        <span className="font-semibold break-words">{ecrit.title}</span>
                                        <span className="text-xs opacity-60">{ecrit.kind}{ecrit.prive ? " · privé" : ""}</span>
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
