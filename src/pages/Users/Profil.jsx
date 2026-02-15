import { useNavigate } from "react-router-dom"

import Navbar from "../../components/Navigation/Navbar";
import './Profil.css'
import Profil from "../../components/Sections/Users/Profil";

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function ProfilPage() {
  const User = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate()
  if (!User) {
    navigate("/login")
  }
  return (
    <>
      <Navbar active="profil" />
      <main className="container mx-auto p-4">
        <Profil User={User} />
      </main>
    </>
  );
}