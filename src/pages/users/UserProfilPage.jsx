import { useParams } from "react-router-dom"

import Navbar from "@/components/layout/Navbar";
import '@/pages/users/Profil.css'
import PublicProfil from "@/components/users/PublicProfil";

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
