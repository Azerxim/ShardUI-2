import { useParams, Link } from "react-router-dom"

import Navbar from "../../components/Navigation/Navbar";
import '../Users/Profil.css'
import AdminProfil from "../../components/Sections/Users/AdminProfil";
import TitleH1 from "../../components/Sections/TitleH1";

export default function AdminProfilPage() {
    const { user_id } = useParams()
    const user = JSON.parse(localStorage.getItem("user"))

    const btnReturn = { text: 'Retour aux utilisateurs', icon: "fas fa-arrow-left", class: "btn-ghost bg-base-200 hover:bg-base-300", link: '/users' };

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
                <div className="flex flex-col items-center justify-center gap-2">
                    <TitleH1 text="Editeur de profil" btn={btnReturn} />
                    <AdminProfil user_id={user_id} />
                </div>
            </main>
        </>
    );
}
