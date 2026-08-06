import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import Navbar from "../../components/Navigation/Navbar";
import UsersList from "../../components/Objects/Users/UsersList";

export default function UsersPage() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        return (
            <>
                <Navbar active="users" />
                <div className="text-center py-12">
                    <p className="text-xl">Vous devez être connecté pour accéder à cette page.</p>
                    <Link to="/login" className="btn btn-primary mt-4">
                        Se connecter
                    </Link>
                </div>
            </>
        );
    }

    if (!user.is_admin) {
        return (
            <>
                <Navbar active="users" />
                <div className="text-center py-12">
                    <p className="text-xl">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
                    <Link to="/" className="btn btn-primary mt-4">
                        Retour à l'accueil
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar active="users" />
            <main className="container mx-auto p-4">
                <UsersList />
            </main>
        </>
    );
}
