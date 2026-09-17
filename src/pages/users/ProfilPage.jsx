import Navbar from "@/components/layout/Navbar";
import '@/pages/users/Profil.css'
import Profil from "@/components/users/Profil";
import UserMemberships from "@/components/users/UserMemberships";
import LinkedAccounts from "@/components/users/LinkedAccounts";
import UserPersonnages from "@/components/users/UserPersonnages";
import ProfilInfos from "@/components/users/ProfilInfos";

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
            <div className="max-w-4xl mx-auto mt-6">
              <ProfilInfos userId={User.id} own />
            </div>
            <UserPersonnages userId={User.id} own />
            <UserMemberships />
          </>
        ) : null}
      </main>
    </>
  );
}
