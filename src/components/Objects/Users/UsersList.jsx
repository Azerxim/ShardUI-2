import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getUsers } from "../../../services/api"

export default function UsersList() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getUsers()
                setUsers(data)
            } catch (err) {
                console.error("Erreur lors de la récupération des utilisateurs:", err)
                setError(err)
                setUsers([])
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <span>Impossible de récupérer la liste des utilisateurs.</span>
            </div>
        )
    }

    if (users.length === 0) {
        return <p>Aucun utilisateur disponible.</p>
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {users.map((user) => (
                <Link
                    key={user.id}
                    to={`/users/${user.id}`}
                    className="user-card flex items-center gap-4 p-4 bg-base-200 rounded-lg shadow-md w-full hover:bg-base-300 transition-colors"
                >
                    <div className="avatar">
                        <div className="w-12 h-12 rounded-full ring ring-base-100 ring-offset-base-100 ring-offset-1">
                            {user.image_url ? (
                                <img src={user.image_url} alt="Avatar" />
                            ) : (
                                <div className="w-full h-full bg-sky-700 flex items-center justify-center text-white">
                                    <FontAwesomeIcon icon="fa-solid fa-user" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold">{user.full_name || user.username}</h2>
                        <p className="text-sm opacity-70">#{user.username}</p>
                        <p className="text-sm opacity-70">{user.email}</p>
                        <p className="text-sm opacity-70">
                            Membre depuis le <b>{new Date(user.created_at).toLocaleDateString('fr-FR')}</b>
                        </p>
                    </div>

                    {user.is_admin && (
                        <span className="badge badge-primary">Admin</span>
                    )}

                    {user.is_disabled && (
                        <span className="badge badge-warning">Désactivé</span>
                    )}

                    {user.is_visible ? (
                        <span className="badge badge-success">Public</span>
                    ) : (
                        <span className="badge badge-error">Privé</span>
                    )}
                </Link>
            ))}
            <div style={{ width: '100%' }}>
                <i>{users.length} utilisateur(s) disponible.</i>
            </div>
        </div>
    )
}
