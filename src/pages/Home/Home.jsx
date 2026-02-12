import './Home.css'

import Navbar from "../../components/Navigation/Navbar";
import Hero from '../../components/Layouts/Hero'
import CopyBtn from '../../components/Buttons/CopyButton'


export default function HomePage() {
  return (
    <>
      <Navbar active="home" />
      <div className="bg-base-100">
        <main className="container mx-auto p-4">
          {/* About / Roleplay */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">À propos</h2>
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div>
                <p className="mb-4">Bienvenue sur notre serveur Minecraft axé role-play. Ici, l'immersion, la narration et la communauté priment. Construisez votre histoire, rejoignez des factions, et participez à des événements organisés.</p>
                <ul className="list-disc list-inside">
                  <li>Système économique complet</li>
                  <li>Quêtes et événements role-play</li>
                  <li>Équipe active et modération</li>
                </ul>
              </div>
              <div>
                {/* <img src="/baniere.png" alt="Bannière du serveur" className="rounded-lg shadow-md w-full" onError={(e) => { e.target.src = '/images/baniere.png' }} /> */}
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Fonctionnalités</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card p-4 bg-base-200">
                <h3 className="font-semibold">Role-play profond</h3>
                <p className="text-sm">Systèmes conçus pour encourager l'histoire et le RP entre joueurs.</p>
              </div>
              <div className="card p-4 bg-base-200">
                <h3 className="font-semibold">Économie & métiers</h3>
                <p className="text-sm">Gagnez votre vie, commercer et grimper dans la hiérarchie sociale.</p>
              </div>
              <div className="card p-4 bg-base-200">
                <h3 className="font-semibold">Événements réguliers</h3>
                <p className="text-sm">Des events hebdomadaires pour animer la communauté.</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Prêt à nous rejoindre ?</h2>
            <p className="mb-6">Rejoignez la communauté et commencez votre aventure role-play aujourd'hui.</p>
            <div className="flex flex-col gap-3 md:flex-row md:justify-center">
              <CopyBtn text="Rejoindre le serveur" textCopy="play.tetrago.fr" classes="btn btn-primary" style={{}} />
              <a className="btn btn-success" href="/login">Se connecter</a>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}