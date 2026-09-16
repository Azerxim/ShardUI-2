import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import Stat from "../Stat"
import DynamicIcon from "../DynamicIcon"
import UserPersonnages from "./UserPersonnages"
import { MEMBERSHIP_GROUPS, loadMemberships } from "../../Functions/memberships"
import { minecraftHead } from "../../Functions/personnages"
import { getJournauxOfUser, getLivresOfUser, getPersonnagesOfUser, getPublicPlatforms, getUserById } from "../../../services/api"

const asList = (value) => (Array.isArray(value) ? value : [])
const ROLE_BADGES = { Fondateur: "badge-primary", Admin: "badge-secondary" }

// Profil public : identité et rôles, compte Minecraft, appartenances et écrits publics, personnages.
// L'adresse e-mail et les comptes Discord ne sont jamais affichés.
export default function PublicProfil({ user_id }) {
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [details, setDetails] = useState(null)

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getUserById(user_id)
                setUserData(data)
            } catch (err) {
                console.error("Erreur lors de la récupération du profil:", err)
                setError(err)
                setUserData(null)
            } finally {
                setLoading(false)
            }
        }

        if (user_id) {
            fetchUserData()
        }
    }, [user_id])

    // Informations complémentaires, seulement pour un profil public
    const visibleId = userData?.is_visible ? userData.id : null
    useEffect(() => {
        if (!visibleId) return
        let cancelled = false
        Promise.all([
            loadMemberships(visibleId, { publicOnly: true }),
            getJournauxOfUser(visibleId).then(asList).catch(() => []),
            getLivresOfUser(visibleId).then(asList).catch(() => []),
            getPersonnagesOfUser(visibleId).then(asList).catch(() => []),
            getPublicPlatforms(visibleId).then(asList).catch(() => []),
        ]).then(([groups, journaux, livres, personnages, platforms]) => {
            if (cancelled) return
            setDetails({
                groups,
                journaux: journaux.filter((journal) => journal.is_public !== false),
                livres: livres.filter((livre) => livre.is_public !== false),
                personnagesCount: personnages.length,
                minecraft: platforms.find((platform) => platform.platform === "microsoft") ?? null,
            })
        })
        return () => {
            cancelled = true
        }
    }, [visibleId])

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    if (error || !userData) {
        return (
            <div className="text-center py-12">
                <FontAwesomeIcon icon="fa-solid fa-user-slash" className="text-6xl text-gray-400 mb-4" />
                <p className="text-xl">Cet utilisateur n'existe pas.</p>
                <Link to="/" className="btn btn-primary mt-4">
                    Retour à l'accueil
                </Link>
            </div>
        )
    }

    if (!userData.is_visible) {
        return (
            <div className="text-center py-12">
                <FontAwesomeIcon icon="fa-solid fa-lock" className="text-6xl text-gray-400 mb-4" />
                <p className="text-xl">Ce profil est privé.</p>
                <Link to="/" className="btn btn-primary mt-4">
                    Retour à l'accueil
                </Link>
            </div>
        )
    }

    const memberships = details ? details.groups.reduce((sum, list) => sum + list.length, 0) : null
    const ecrits = details ? [
        ...details.journaux.map((journal) => ({ key: `journal-${journal.id}`, title: journal.title, href: `/bibliotheque/journal/${journal.id}`, icon: journal.cover_icon, fallback: "fa-solid fa-newspaper", kind: "Journal" })),
        ...details.livres.map((livre) => ({ key: `livre-${livre.id}`, title: livre.title, href: `/bibliotheque/livre/${livre.id}`, icon: livre.cover_icon, fallback: "fa-solid fa-book", kind: "Livre" })),
    ] : []
    const statValue = (value) => (details ? value : "…")

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* En-tête du profil */}
            <div className="card bg-gradient-to-br from-sky-800 to-sky-900 text-white shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="avatar">
                            <div className="w-32 h-32 rounded-full ring ring-white ring-offset-base-100 ring-offset-2">
                                {userData.image_url ? (
                                    <img src={userData.image_url} alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-sky-700 flex items-center justify-center">
                                        <FontAwesomeIcon icon="fa-solid fa-user" className="text-6xl" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Informations utilisateur */}
                        <div className="flex-1 min-w-0 text-center md:text-left">
                            <h1 className="text-3xl font-bold break-words">{userData.full_name || userData.username}</h1>
                            <p className="text-sky-200 mt-2">
                                <FontAwesomeIcon icon="fa-solid fa-user" className="mr-2" />
                                #{userData.username}
                            </p>
                            {details?.minecraft ? (
                                <p className="text-sky-100 mt-1 flex flex-row items-center justify-center md:justify-start gap-2">
                                    <img src={minecraftHead(details.minecraft.uid, 32)} alt="" className="w-5 h-5 rounded-sm" style={{ imageRendering: "pixelated" }} />
                                    <span>Minecraft : <strong>{details.minecraft.username}</strong></span>
                                </p>
                            ) : null}
                            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                {userData.created_at ? (
                                    <span className="badge badge-lg badge-ghost">
                                        <FontAwesomeIcon icon="fa-solid fa-calendar" className="mr-2" />
                                        Membre depuis {new Date(userData.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                ) : null}
                                {userData.is_admin ? <span className="badge badge-lg badge-primary">Admin</span> : null}
                                {userData.is_moderateur ? <span className="badge badge-lg badge-secondary">Modérateur RP</span> : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chiffres clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat icon="fa-solid fa-masks-theater" label={details?.personnagesCount > 1 ? "Personnages" : "Personnage"} value={statValue(details?.personnagesCount)} />
                <Stat icon="fa-solid fa-users" label={memberships > 1 ? "Appartenances" : "Appartenance"} value={statValue(memberships)} />
                <Stat icon="fa-solid fa-newspaper" label={details?.journaux.length > 1 ? "Journaux" : "Journal"} value={statValue(details?.journaux.length)} />
                <Stat icon="fa-solid fa-book" label={details?.livres.length > 1 ? "Livres" : "Livre"} value={statValue(details?.livres.length)} />
            </div>

            {/* Appartenances publiques */}
            <section className="card bg-base-200 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl">
                        <FontAwesomeIcon icon="fa-solid fa-users" />
                        Appartenances
                    </h2>
                    {details === null ? (
                        <span className="loading loading-spinner"></span>
                    ) : memberships === 0 ? (
                        <p className="opacity-80">Ce joueur ne fait partie d'aucune civilisation, religion ou commerce public.</p>
                    ) : MEMBERSHIP_GROUPS.map((group, index) => details.groups[index].length > 0 ? (
                        <div key={group.key} className="flex flex-col gap-2">
                            <span className="flex flex-row items-center gap-2 font-semibold">
                                <FontAwesomeIcon icon={group.icon} className="opacity-70" />
                                {group.publicTitle}
                            </span>
                            <div className="flex flex-row flex-wrap gap-2">
                                {details.groups[index].map(({ entity, role }) => (
                                    <a key={entity.id} href={group.href(entity)} className="flex flex-row items-center gap-2 bg-base-100 hover:bg-base-300 transition-colors rounded-full px-3 py-1.5">
                                        <span>{entity.title}</span>
                                        <span className={`badge badge-sm ${ROLE_BADGES[role] ?? "badge-ghost"}`}>{role}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ) : null)}
                </div>
            </section>

            {/* Écrits de la bibliothèque */}
            <section className="card bg-base-200 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl">
                        <FontAwesomeIcon icon="fa-solid fa-feather" />
                        Écrits
                    </h2>
                    {details === null ? (
                        <span className="loading loading-spinner"></span>
                    ) : ecrits.length === 0 ? (
                        <p className="opacity-80">Ce joueur n'a encore publié ni journal ni livre.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ecrits.map((ecrit) => (
                                <a key={ecrit.key} href={ecrit.href} className="flex flex-row items-center gap-3 bg-base-100 hover:bg-base-300 transition-colors rounded-2xl p-3 min-w-0">
                                    <DynamicIcon icon={ecrit.icon || ecrit.fallback} fallback={ecrit.fallback} className="text-lg opacity-80" />
                                    <span className="flex flex-col min-w-0">
                                        <span className="font-semibold break-words">{ecrit.title}</span>
                                        <span className="text-xs opacity-60">{ecrit.kind}</span>
                                    </span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <UserPersonnages userId={userData.id} className="" />
        </div>
    )
}
