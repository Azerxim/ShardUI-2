import { useParams } from "react-router-dom"

import Navbar from "../../components/Navigation/Navbar";
import '../Users/Profil.css'
import PublicProfil from "../../components/Sections/Users/PublicProfil";

export default function UserProfilPage() {
    const { user_id } = useParams()

    return (
        <>
            <Navbar active="profil" />
            <main className="container mx-auto p-4">
                <PublicProfil user_id={user_id} />
            </main>
        </>
    );
}
