import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getUserById } from "../../../services/api"

export default function PublicProfil({ user_id }) {
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold">{userData.full_name || userData.username}</h1>
                            <p className="text-sky-200 mt-2">
                                <FontAwesomeIcon icon="fa-solid fa-user" className="mr-2" />
                                #{userData.username}
                            </p>
                            <div className="mt-4">
                                <span className="badge badge-lg badge-ghost">
                                    <FontAwesomeIcon icon="fa-solid fa-calendar" className="mr-2" />
                                    Membre depuis {new Date(userData.created_at || Date.now()).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
