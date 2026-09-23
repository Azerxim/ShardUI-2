import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "@/components/layout/Navbar";
import { MAPS_BASE_URL } from "@/config/maps";
import CopyBtn from '@/components/ui/CopyButton'
import GrimoireHero from '@/components/layout/GrimoireHero';
import ImageHero from '@/components/layout/ImageHero';
import LaunchHomePage from '@/pages/home/LaunchHomePage';
import { lancementAVenir } from '@/config/saison';

const serverURL = import.meta.env.VITE_SERVER_URL;

const books = [
  { icon: "fa-solid fa-scroll", title: "Codex", description: "Les règles du monde de Tetrago", link: "/codex", color: "var(--color-error)", tilt: "1deg", target: "" },
  { icon: "fa-solid fa-book", title: "Bibliothèque", description: "Les journaux et récits de la communauté.", link: "/bibliotheque", color: "var(--color-primary)", tilt: "-3deg", target: "" },
  { icon: "fa-solid fa-flag", title: "Civilisations", description: "Les factions qui façonnent le monde.", link: "/civilisations", color: "var(--color-secondary)", tilt: "2deg", target: "" },
  { icon: "fa-solid fa-cross", title: "Religions", description: "Les croyances qui influencent le monde.", link: "/religions", color: "var(--color-warning)", tilt: "3deg", target: "" },
  { icon: "fa-solid fa-shop", title: "Commerces", description: "Les lieux d'échange et de commerce.", link: "/commerces", color: "var(--color-info)", tilt: "2deg", target: "" },
  { icon: "fa-solid fa-handshake", title: "Alliances", description: "Les pactes entre civilisations.", link: "/alliances", color: "var(--color-success)", tilt: "1deg", target: "" },
  { icon: "fa-solid fa-shield-halved", title: "Guerres", description: "Les conflits qui ont marqué le monde.", link: "/guerres", color: "#991b1b", tilt: "-2deg", target: "" },
  { icon: "fa-solid fa-masks-theater", title: "Personnages", description: "Les héros et figures du monde.", link: "/personnages", color: "#6d28d9", tilt: "2deg", target: "" },
  { icon: "fa-solid fa-map", title: "Cartographie", description: "Le monde de Tetrago à explorer.", link: MAPS_BASE_URL, color: "var(--color-accent)", tilt: "-1deg", target: "" },
  { icon: "fa-brands fa-discord", title: "Discord", description: "Rejoignez la communauté.", link: "https://discord.gg/pcVFzYA534",color: "var(--color-neutral)", tilt: "-2deg", target: "_blank" },
];

const steps = [
  { icon: "fa-solid fa-scroll", title: "Lisez les règles", description: "Le Codex du serveur, à parcourir avant toute chose.", link: "/codex", priority: true },
  { icon: "fa-solid fa-user-plus", title: "Créez votre compte", description: "Inscrivez-vous en quelques secondes.", link: "/register" },
  { icon: "fa-solid fa-network-wired", title: "Rejoignez le serveur", description: `Connectez-vous avec l'IP copiée: <b class="text-primary">${serverURL}</b>` },
  { icon: "fa-solid fa-feather-pointed", title: "Écrivez votre histoire", description: "Faites vivre votre personnage et sa civilisation." },
];


export default function HomePage() {
  // Annonce de la saison à venir tant que VITE_SAISON_LANCEMENT la déclare (config/saison.js)
  if (lancementAVenir()) return <LaunchHomePage />;
  return <AccueilSaison />;
}

function AccueilSaison() {
  // Lu une fois au montage : la page est rechargée après connexion ou déconnexion
  const [isLoggedIn] = useState(() => Boolean(localStorage.getItem("user")));

  return (
    <>
      <Navbar active="home" />
      <div className="bg-base-100">
        <main className="container mx-auto p-4">
          {/* Hero façon grimoire étoilé, cohérent avec le reste du site */}
          <ImageHero
            image="/images/minecraft/spawn_01.png"
            blur={2}
            icon="fa-solid fa-book-open"
            title="Ouvrez le Grimoire de Tetrago"
            description="Chaque joueur y écrit un chapitre. Factions, récits, cartes et légendes : votre histoire commence ici, sous les étoiles d'un monde à bâtir ensemble."
            className="rounded-3xl mb-14 py-24 px-4 w-full"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <a className="btn btn-error flex items-center gap-2" href="/codex">
                <FontAwesomeIcon icon="fa-solid fa-scroll" />
                Règlement
              </a>
              {isLoggedIn ? (
                <a className="btn btn-success flex items-center gap-2" href="/profil">
                  <FontAwesomeIcon icon="fa-solid fa-user" />
                  Profil
                </a>
              ) : (
                <>
                  <a className="btn btn-success flex items-center gap-2" href="/login">
                    <FontAwesomeIcon icon="fa-solid fa-sign-in-alt" />
                    Se connecter
                  </a>
                  <a className="btn btn-info flex items-center gap-2" href="/register">
                    <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                    Créer un compte
                  </a>
                </>
              )}
              <CopyBtn
                text="Copier l'IP du serveur"
                textCopy={serverURL}
                icon={<FontAwesomeIcon icon="fa-solid fa-hat-wizard" />}
                classes="btn btn-warning flex items-center gap-2 w-full sm:w-auto"
                style={{}}
                tooltip={{ text: `Copier l'adresse du serveur (${serverURL})`, position: "bottom" }}
              />
              <a className="btn btn-base-100 flex items-center gap-2" href="/civilisations">
                <FontAwesomeIcon icon="fa-solid fa-pen" />
                Ecrire mon histoire
              </a>
            </div>
          </ImageHero>

          {/* Parcours */}
          <section id="parcours" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-6 text-center">Votre parcours</h2>
            <ul className="steps steps-vertical md:steps-horizontal w-full">
              {steps.map((step) => {
                const Wrapper = step.link ? 'a' : 'div';
                return (
                  <li key={step.title} className="step step-primary">
                    <Wrapper
                      {...(step.link ? { href: step.link } : {})}
                      className={`flex flex-col items-center gap-2 py-4 ${step.link ? 'hover:opacity-80 transition-opacity' : ''}`}
                    >
                      <FontAwesomeIcon icon={step.icon} size="lg" className="text-primary" />
                      <span className="font-semibold flex items-center gap-2">
                        {step.title}
                        {step.priority && <span className="badge badge-warning badge-xs">Prioritaire</span>}
                      </span>
                      <span className="text-sm opacity-70 max-w-48 text-center" dangerouslySetInnerHTML={{ __html: step.description }}></span>
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Étagère interactive */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">L'étagère du voyageur</h2>
            <div className="grimoire-shelf flex flex-wrap justify-center gap-6">
              {books.map((book) => (
                <a
                  key={book.title}
                  href={book.link}
                  className="grimoire-book card w-44 p-5 shadow-xl text-center items-center"
                  style={{ '--tilt': book.tilt, backgroundColor: book.color, color: '#fff' }}
                  target={book.target}
                >
                  <FontAwesomeIcon icon={book.icon} size="2x" className="mb-3" />
                  <h3 className="font-semibold">{book.title}</h3>
                  <p className="text-xs opacity-90 mt-1">{book.description}</p>
                </a>
              ))}
            </div>
          </section>

        </main>
      </div>
    </>
  )
}