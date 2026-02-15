import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Profil({ User }) {
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [fullName, setFullName] = useState(User?.full_name || "")
    const [imageUrl, setImageUrl] = useState(User?.image_url || "")
    const [email, setEmail] = useState(User?.email || "")
    const [username, setUsername] = useState(User?.username || "")
    const [isVisible, setIsVisible] = useState(User?.is_visible || false)
    const [userData, setUserData] = useState(User)

    useEffect(() => {
        // Récupérer les données utilisateur à jour
        const fetchUserData = async () => {
            if (User?.id) {
                try {
                    const response = await fetch(`/api/users/id/${User.id}/`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })

                    if (response.ok) {
                        const data = await response.json()
                        setUserData(data)
                        setFullName(data.full_name)
                        setImageUrl(data.image_url)
                        setEmail(data.email)
                        setUsername(data.username)
                        setIsVisible(data.is_visible)
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération des données:", error)
                }
            }
        }

        fetchUserData()
    }, [User?.id])

    const handleLogout = () => {
        Swal.fire({
            title: 'Déconnexion',
            text: "Êtes-vous sûr de vouloir vous déconnecter ?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, déconnecter',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('user')
                navigate('/login')
                Swal.fire({
                    icon: 'success',
                    title: 'Déconnecté',
                    text: 'Vous avez été déconnecté avec succès',
                    timer: 1500,
                    showConfirmButton: false
                })
            }
        })
    }

    const handleSaveProfile = async (e) => {
        e.preventDefault()

        try {
            const response = await fetch(`/api/users/update/${User.id}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    full_name: fullName,
                    image_url: imageUrl,
                    email: email,
                    username: username,
                    is_visible: isVisible,
                }),
            })

            if (response.ok) {
                const updatedUser = { ...User, full_name: fullName, image_url: imageUrl, email: email, username: username, is_visible: isVisible }
                localStorage.setItem('user', JSON.stringify(updatedUser))
                setUserData(updatedUser)
                setIsEditing(false)

                Swal.fire({
                    icon: 'success',
                    title: 'Profil mis à jour',
                    text: 'Vos informations ont été mises à jour avec succès',
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
        setFullName(userData?.full_name || "")
        setImageUrl(userData?.image_url || "")
        setEmail(userData?.email || "")
        setUsername(userData?.username || "")
        setIsVisible(userData?.is_visible || false)
        setIsEditing(false)
    }

    return (
        <>
            {User ? (
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* En-tête du profil */}
                    <div className="card bg-gradient-to-br from-sky-800 to-sky-900 text-white shadow-xl">
                        <div className="card-body">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Avatar */}
                                <div className="avatar">
                                    <div className="w-32 h-32 rounded-full ring ring-white ring-offset-base-100 ring-offset-2">
                                        {userData?.image_url ? (
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
                                    <h1 className="text-3xl font-bold">{userData?.full_name || "Utilisateur"}</h1>
                                    <p className="text-sky-200 mt-2">
                                        <FontAwesomeIcon icon="fa-solid fa-user" className="mr-2" />
                                        #{userData?.username || username}
                                    </p>
                                    <p className="text-sky-200 mt-2">
                                        <FontAwesomeIcon icon="fa-solid fa-envelope" className="mr-2" />
                                        {userData?.email || email}
                                    </p>
                                    <div className="mt-4">
                                        <span className="badge badge-lg badge-ghost">
                                            <FontAwesomeIcon icon="fa-solid fa-calendar" className="mr-2" />
                                            Membre depuis {new Date(userData?.created_at || Date.now()).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                </div>

                                {/* Bouton de déconnexion */}
                                <div>
                                    <button
                                        className="btn btn-error btn-outline"
                                        onClick={handleLogout}
                                    >
                                        <FontAwesomeIcon icon="fa-solid fa-right-from-bracket" />
                                        Déconnexion
                                    </button>
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
                                        <FontAwesomeIcon icon="fa-solid fa-pen" />
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
                                        <div className="text-lg font-semibold">{userData?.full_name || "Non renseigné"}</div>
                                    </div>
                                    <div className="divider"></div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sm opacity-70">Email</div>
                                        <div className="text-lg font-semibold">{userData?.email || email}</div>
                                    </div>
                                    <div className="divider"></div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sm opacity-70">Image de profil</div>
                                        <div className="text-lg">{userData?.image_url ? "Définie" : "Non définie"}</div>
                                    </div>
                                    <div className="divider"></div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sm opacity-70">Visible</div>
                                        <div className="text-lg">{userData?.is_visible ? "Oui" : "Non"}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <FontAwesomeIcon icon="fa-solid fa-user-slash" className="text-6xl text-gray-400 mb-4" />
                    <p className="text-xl">Vous n'êtes pas connecté.</p>
                    <a href="/login" className="btn btn-primary mt-4">
                        Se connecter
                    </a>
                </div>
            )}
        </>
    );
}