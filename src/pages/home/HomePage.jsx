import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "@/components/layout/Navbar";
import { MAPS_BASE_URL } from "@/config/maps";
import CopyBtn from '@/components/ui/CopyButton'
import GrimoireHero from '@/components/layout/GrimoireHero';
import TemporaliteRp from '@/components/temps/TemporaliteRp';
import ImageHero from '@/components/layout/ImageHero';
import LaunchHomePage from '@/pages/home/LaunchHomePage';
import { lancementAVenir } from '@/config/saison';
import { DISCORD_INVITE, useParcours } from '@/utils/parcours';
import ActionsEnAttente from '@/components/users/ActionsEnAttente';

const serverURL = import.meta.env.VITE_SERVER_URL;

const books = [
  { icon: "fa-solid fa-scroll", title: "Codex", description: "Les règles du monde de Tetrago", link: "/codex", color: "var(--color-error)", tilt: "1deg", target: "" },
  { icon: "fa-solid fa-book", title: "Bibliothèque", description: "Les journaux et récits de la communauté.", link: "/bibliotheque", color: "var(--color-primary)", tilt: "-3deg", target: "" },
  { icon: "fa-solid fa-flag", title: "Civilisations", description: "Les factions qui façonnent le monde.", link: "/civilisations", color: "var(--color-secondary)", tilt: "2deg", target: "" },
  { icon: "fa-solid fa-cross", title: "Religions", description: "Les croyances qui influencent le monde.", link: "/religions", color: "var(--color-warning)", tilt: "3deg", target: "" },
  { icon: "fa-solid fa-shop", title: "Commerces", description: "Les lieux d'échange et de commerce.", link: "/commerces", color: "var(--color-info)", tilt: "2deg", target: "" },
  { icon: "fa-solid fa-handshake", title: "Alliances", description: "Les pactes entre civilisations.", link: "/alliances", color: "var(--color-success)", tilt: "1deg", target: "" },
  { icon: "fa-solid fa-shield-halved", title: "Guerres", description: "Les conflits qui ont marqué le monde.", link: "/guerres", color: "#8f1d2e", tilt: "-2deg", target: "" },
  { icon: "fa-solid fa-masks-theater", title: "Personnages", description: "Les héros et figures du monde.", link: "/personnages", color: "#8932b8", tilt: "2deg", target: "" },
  { icon: "fa-solid fa-map", title: "Cartographie", description: "Le monde de Tetrago à explorer.", link: MAPS_BASE_URL, color: "var(--color-accent)", tilt: "-1deg", target: "" },
  { icon: "fa-brands fa-discord", title: "Discord", description: "Rejoignez la communauté.", link: DISCORD_INVITE, color: "var(--color-neutral)", tilt: "-2deg", target: "_blank" },
];

// Textes des étapes du parcours (ordre, numéros et chemins : utils/parcours.js) ; la prochaine à faire devient le bouton principal du héros
const steps = {
  codex: { icon: "fa-solid fa-scroll", title: "Lisez le Codex", description: "Les règles du serveur et du rôle-play, à parcourir avant toute chose.", link: "/codex", action: "Lire le Codex" },
  discord: { icon: "fa-brands fa-discord", title: "Candidatez sur le Discord", description: "Rejoignez le Discord et déposez votre candidature pour être ajouté à la whitelist du serveur.", link: DISCORD_INVITE, externe: true, action: "Candidater sur le Discord", complement: { icon: "fa-solid fa-file-signature", label: "Préparer ma candidature", link: "/outils#candidature" } },
  serveur: { icon: "fa-solid fa-network-wired", title: "Rejoignez le serveur", description: <>Ajoutez l'adresse <b className="text-primary">{serverURL}</b> dans Minecraft Java.</>, action: "Copier l'IP du serveur" },
  compte: { icon: "fa-solid fa-user-plus", title: "Créez votre compte", description: "Inscrivez-vous en quelques secondes pour entrer dans l'histoire.", link: "/register", action: "Créer un compte" },
  civilisation: { icon: "fa-solid fa-flag", title: "Fondez une civilisation ou rejoignez-en une", description: "Fondez la vôtre, ou demandez à rejoindre une civilisation existante depuis sa page.", link: "/civilisations", action: "Fonder ou rejoindre une civilisation" },
  personnage: { icon: "fa-solid fa-masks-theater", title: "Créez votre personnage", description: "Son nom, son espèce, sa ville : c'est lui qui signera vos récits.", link: "/personnages?nouveau=1", action: "Créer mon personnage" },
};

// Les deux chemins du parcours après la candidature (branche des étapes dans utils/parcours.js)
const BRANCHES = [
  { id: "a", icon: "fa-solid fa-cube", titre: "En jeu", classe: "" },
  { id: "b", icon: "fa-solid fa-globe", titre: "Sur le site", classe: "md:col-span-2" },
];

// Boutons secondaires du héros : discrets, pour ne pas concurrencer l'étape à faire
const secondaryClass = "btn btn-ghost flex items-center gap-2 border border-neutral-content/40 text-neutral-content hover:bg-neutral-content/10";


export default function HomePage() {
  // Annonce de la saison à venir tant que VITE_SAISON_LANCEMENT la déclare (config/saison.js)
  if (lancementAVenir()) return <LaunchHomePage />;
  return <AccueilSaison />;
}

function AccueilSaison() {
  // Lu une fois au montage : la page est rechargée après connexion ou déconnexion
  const { user, etapes, aFaire, prochaine, chargement, copierIp, ouvrirDiscord } = useParcours();
  const faites = etapes.filter((etape) => etape.fait).length;

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
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:items-center">
              <BoutonPrincipal prochaine={prochaine} chargement={chargement} copierIp={copierIp} ouvrirDiscord={ouvrirDiscord} />
              {!user && prochaine !== "compte" && (
                <a className={secondaryClass} href="/register">
                  <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                  Créer un compte
                </a>
              )}
              {!user && (
                <a className={secondaryClass} href="/login">
                  <FontAwesomeIcon icon="fa-solid fa-sign-in-alt" />
                  Se connecter
                </a>
              )}
              {user && prochaine !== "termine" && (
                <a className={secondaryClass} href="/profil">
                  <FontAwesomeIcon icon="fa-solid fa-user" />
                  Mon profil
                </a>
              )}
              {prochaine === "discord" && (
                <a className={secondaryClass} href={steps.discord.complement.link}>
                  <FontAwesomeIcon icon={steps.discord.complement.icon} />
                  {steps.discord.complement.label}
                </a>
              )}
              {prochaine !== "codex" && (
                <a className={secondaryClass} href="/codex">
                  <FontAwesomeIcon icon="fa-solid fa-scroll" />
                  Codex
                </a>
              )}
              {prochaine !== "serveur" && (
                <CopyBtn
                  text="Copier l'IP"
                  textCopy={serverURL}
                  icon={<FontAwesomeIcon icon="fa-solid fa-network-wired" />}
                  classes={`${secondaryClass} w-full sm:w-auto`}
                  style={{}}
                  tooltip={{ text: `Copier l'adresse du serveur (${serverURL})`, position: "bottom" }}
                  onCopy={copierIp}
                />
              )}
            </div>
          </ImageHero>

          {/* Appels aux armes et déclarations en attente du joueur connecté */}
          <ActionsEnAttente className="mb-12 -mt-6" />

          {/* Date du jour dans le RP et règle du temps (1 semaine réelle = 2 ans RP) */}
          <TemporaliteRp className="mb-12" />

          {/* Parcours : étapes faites cochées, étapes à faire mises en avant */}
          <section id="parcours" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mb-2 text-center">Votre parcours</h2>
            <p className="text-center opacity-70 mb-6">
              {prochaine === "termine"
                ? "Parcours terminé : le monde vous attend. Bonne aventure !"
                : `${faites} étape${faites > 1 ? "s" : ""} sur ${etapes.length}${aFaire.length ? ` · ${aFaire.length > 1 ? "Prochaines étapes" : "Prochaine étape"} : ${aFaire.map((id) => steps[id].title).join(" · ")}` : ""}`}
            </p>

            <ListeEtapes etapes={etapes.filter((etape) => !etape.branche)} aFaire={aFaire} ouvrirDiscord={ouvrirDiscord} className="grid max-w-2xl mx-auto" />

            <div className="divider my-6 text-sm font-semibold">
              <FontAwesomeIcon icon="fa-solid fa-circle-check" className="text-success" />
              Après la validation de votre candidature
            </div>
            <p className="text-center text-sm opacity-70 -mt-2 mb-6">Deux chemins à suivre en parallèle, dans l'ordre que vous voulez.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BRANCHES.map((branche) => (
                <div key={branche.id} className={`flex flex-col gap-1 bg-base-200 rounded-3xl p-4 ${branche.classe}`}>
                  <h3 className="flex items-center justify-center gap-2 font-bold">
                    <FontAwesomeIcon icon={branche.icon} className="text-secondary" />
                    {branche.titre}
                  </h3>
                  <ListeEtapes etapes={etapes.filter((etape) => etape.branche === branche.id)} aFaire={aFaire} ouvrirDiscord={ouvrirDiscord} />
                </div>
              ))}
            </div>
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

// Une rangée d'étapes : la pastille porte l'icône de l'étape, puis ✓ une fois faite
function ListeEtapes({ etapes, aFaire, ouvrirDiscord, className = "" }) {
  return (
    <ul className={`steps steps-vertical md:steps-horizontal w-full ${className}`}>
      {etapes.map(({ id, fait }) => {
        const step = steps[id];
        const active = aFaire.includes(id);
        const Wrapper = step.link ? 'a' : 'div';
        return (
          <li key={id} className={`step ${fait ? 'step-success' : active ? 'step-primary' : ''}`} data-content={fait ? '✓' : undefined}>
            {!fait ? <span className="step-icon"><FontAwesomeIcon icon={step.icon} /></span> : null}
            {/* Le lien de l'étape, puis son éventuel lien complémentaire (deux liens côte à côte, jamais imbriqués) */}
            <div className="flex flex-col items-center gap-2 py-4 md:self-start">
              <Wrapper
                {...(step.link ? { href: step.link } : {})}
                {...(step.externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...(id === "discord" ? { onClick: ouvrirDiscord } : {})}
                className={`flex flex-col items-center gap-2 ${step.link ? 'hover:opacity-80 transition-opacity' : ''} ${fait ? 'opacity-60' : ''}`}
              >
                {/* Pastille « À faire » ; espace réservé sur les autres étapes pour garder les titres alignés */}
                <span className={`badge badge-primary badge-sm ${active ? '' : 'invisible'}`} aria-hidden={!active}>À faire</span>
                <span className="font-semibold text-center">{step.title}</span>
                <span className="text-sm opacity-70 max-w-48 text-center">{step.description}</span>
              </Wrapper>
              {step.complement ? (
                <a href={step.complement.link} className="btn btn-xs btn-outline btn-primary">
                  <FontAwesomeIcon icon={step.complement.icon} />
                  {step.complement.label}
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Bouton principal du héros : la prochaine étape du parcours, ou le profil une fois tout fait
function BoutonPrincipal({ prochaine, chargement, copierIp, ouvrirDiscord }) {
  const classes = "btn btn-primary btn-lg flex items-center gap-2 shadow-lg";
  if (chargement) {
    return (
      <span className={`${classes} btn-disabled`}>
        <span className="loading loading-spinner loading-sm"></span>
        Chargement…
      </span>
    );
  }
  if (prochaine === "termine") {
    return (
      <a className={classes} href="/profil">
        <FontAwesomeIcon icon="fa-solid fa-user" />
        Mon profil
      </a>
    );
  }
  const step = steps[prochaine];
  if (prochaine === "serveur") {
    return (
      <CopyBtn
        text={step.action}
        textCopy={serverURL}
        icon={<FontAwesomeIcon icon={step.icon} />}
        classes={`${classes} w-full sm:w-auto`}
        style={{}}
        tooltip={{ text: `Adresse du serveur : ${serverURL}`, position: "bottom" }}
        onCopy={copierIp}
      />
    );
  }
  return (
    <a
      className={classes}
      href={step.link}
      {...(step.externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...(prochaine === "discord" ? { onClick: ouvrirDiscord } : {})}
    >
      <FontAwesomeIcon icon={step.icon} />
      {step.action}
    </a>
  );
}
