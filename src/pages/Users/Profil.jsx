import Navbar from "../../components/Navigation/Navbar";
import './Profil.css'
import Profil from "../../components/Objects/Users/Profil";
import UserMemberships from "../../components/Objects/Users/UserMemberships";
import LinkedAccounts from "../../components/Objects/Users/LinkedAccounts";
import UserPersonnages from "../../components/Objects/Users/UserPersonnages";

export default function ProfilPage() {
  // Sans compte, le composant Profil affiche « Vous n'êtes pas connecté » avec un lien de connexion
  const User = JSON.parse(localStorage.getItem('user'));
  return (
    <>
      <Navbar active="profil" />
      <main className="container mx-auto p-4">
        <Profil User={User} />
        {User ? (
          <>
            <LinkedAccounts />
            <UserPersonnages userId={User.id} own />
            <UserMemberships userId={User.id} />
          </>
        ) : null}
      </main>
    </>
  );
}
