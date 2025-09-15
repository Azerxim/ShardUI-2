import { useNavigate } from "react-router-dom"

import UserButton from '../../components/Base/UserButton'
import './Profil.css'

// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function ProfilPage() {
  const User = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate()
  if (!User) {
    navigate("/login")
  }
  return (
    <div>
      <main className="container mx-auto px-4 py-2">
      {User ? (
        <div className="py-2 bg-sky-800 text-base-200 rounded-3xl">
          <div className='flex flex-col justify-items-center items-center space-x-4 space-y-2 mb-4'>
            <h2 className="">Bienvenue</h2>
            <UserButton userid={User.id} link={`/profil`} />
            {/* <button className="btn btn-neutral" onClick={() => {
              localStorage.removeItem('user')
              window.location.reload()
              }}>Déconnexion</button> */}
          </div>
        </div>
      ) : (
        <div>
          <p>Vous n'êtes pas connecté.</p>
        </div>
      )}
      </main>
    </div>
  );
}