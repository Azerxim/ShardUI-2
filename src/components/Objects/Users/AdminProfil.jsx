import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getUserById, getApiURL } from "../../../services/api"

export default function AdminProfil({ user_id }) {
    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [isVisible, setIsVisible] = useState(false)
    const [isDisabled, setIsDisabled] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const apiURL = getApiURL()

    const fillForm = (data) => {
        setFullName(data?.full_name || "")
        setImageUrl(data?.image_url || "")
        setEmail(data?.email || "")
        setUsername(data?.username || "")
        setIsVisible(data?.is_visible || false)
        setIsDisabled(data?.is_disabled || false)
        setIsAdmin(data?.is_admin || false)
    }

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getUserById(user_id)
                setUserData(data)
                fillForm(data)
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

    const handleSaveProfile = async (e) => {
        e.preventDefault()

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${apiURL}/users/update/${user_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    full_name: fullName,
                    image_url: imageUrl,
                    email: email,
                    username: username,
                    is_visible: isVisible,
                    is_disabled: isDisabled,
                    is_admin: isAdmin,
                }),
            })

            if (response.ok) {
                const updated = await response.json()
                setUserData(updated)
                fillForm(updated)
                setIsEditing(false)

                Swal.fire({
                    icon: 'success',
                    title: 'Profil mis à jour',
                    text: "Les informations de l'utilisateur ont été mises à jour avec succès",
                    timer: 2000,
                    showConfirmButton: false
                })
            } else {
                throw new Error("Erreur lors de la mise à jour")
            }
        } catch (error) {
            console.error("Erreur:", error)
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de mettre à jour le profil',
            })
        }
    }

    const handleCancelEdit = () => {
        fillForm(userData)
        setIsEditing(false)
    }

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
                <Link to="/users" className="btn btn-primary mt-4">
                    Retour à la liste
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
                            <p className="text-sky-200 mt-2">
                                <FontAwesomeIcon icon="fa-solid fa-envelope" className="mr-2" />
                                {userData.email}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                <span className="badge badge-lg badge-ghost">
                                    <FontAwesomeIcon icon="fa-solid fa-calendar" className="mr-2" />
                                    Membre depuis {new Date(userData.created_at || Date.now()).toLocaleDateString('fr-FR')}
                                </span>
                                {userData.is_admin && (
                                    <span className="badge badge-lg badge-primary">Admin</span>
                                )}
                                {userData.is_disabled && (
                                    <span className="badge badge-lg badge-warning">Désactivé</span>
                                )}
                                {userData.is_visible ? (
                                    <span className="badge badge-lg badge-success">Public</span>
                                ) : (
                                    <span className="badge badge-lg badge-error">Privé</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Modifier le profil */}
            <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="card-title text-2xl">
                            <FontAwesomeIcon icon="fa-solid fa-user-pen" className="mr-2" />
                            Informations du profil
                        </h2>
                        {!isEditing && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setIsEditing(true)}
                            >
                                <FontAwesomeIcon icon="fa-solid fa-edit" />
                                Modifier
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Nom complet</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered ml-5"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Pseudo</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered ml-5"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered ml-5"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">URL de l'image de profil</span>
                                </label>
                                <input
                                    type="url"
                                    className="input input-bordered ml-5"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://exemple.com/image.jpg"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer">
                                    <span className="label-text">Visible</span>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary ml-5"
                                        checked={isVisible}
                                        onChange={(e) => setIsVisible(e.target.checked)}
                                    />
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer">
                                    <span className="label-text">Compte désactivé</span>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-warning ml-5"
                                        checked={isDisabled}
                                        onChange={(e) => setIsDisabled(e.target.checked)}
                                    />
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer">
                                    <span className="label-text">Admin</span>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary ml-5"
                                        checked={isAdmin}
                                        onChange={(e) => setIsAdmin(e.target.checked)}
                                    />
                                </label>
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={handleCancelEdit}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success"
                                >
                                    <FontAwesomeIcon icon="fa-solid fa-check" />
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <div className="text-sm opacity-70">Nom complet</div>
                                <div className="text-lg font-semibold">{userData.full_name || "Non renseigné"}</div>
                            </div>
                            <div className="divider"></div>
                            <div className="flex flex-col gap-2">
                                <div className="text-sm opacity-70">Email</div>
                                <div className="text-lg font-semibold">{userData.email || "Non renseigné"}</div>
                            </div>
                            <div className="divider"></div>
                            <div className="flex flex-col gap-2">
                                <div className="text-sm opacity-70">Image de profil</div>
                                <div className="text-lg">{userData.image_url ? "Définie" : "Non définie"}</div>
                            </div>
                            <div className="divider"></div>
                            <div className="flex flex-col gap-2">
                                <div className="text-sm opacity-70">Visible</div>
                                <div className="text-lg">{userData.is_visible ? "Oui" : "Non"}</div>
                            </div>
                            <div className="divider"></div>
                            <div className="flex flex-col gap-2">
                                <div className="text-sm opacity-70">Compte désactivé</div>
                                <div className="text-lg">{userData.is_disabled ? "Oui" : "Non"}</div>
                            </div>
                            <div className="divider"></div>
                            <div className="flex flex-col gap-2">
                                <div className="text-sm opacity-70">Admin</div>
                                <div className="text-lg">{userData.is_admin ? "Oui" : "Non"}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
