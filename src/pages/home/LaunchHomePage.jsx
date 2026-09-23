import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import NavbarLaunch from "@/components/layout/NavbarLaunch";
import ImageHero from '@/components/layout/ImageHero';
import { SAISON, LANCEMENT_DATE } from '@/config/saison';

// ===== Accueil « Lancement de la saison 3 prochainement » =====
// Affiché à la place de l'accueil tant que VITE_SAISON_LANCEMENT l'annonce (voir config/saison.js),
// et toujours visible sur /lancement.

const DISCORD_URL = "https://discord.gg/pcVFzYA534";

const preparatifs = [
    { icon: "fa-solid fa-scroll", title: "Lisez le Codex", description: "La loi du serveur et les règles du rôle-play, à connaître avant le premier bloc posé.", link: "/codex" },
    // { icon: "fa-solid fa-user-plus", title: "Créez votre compte", description: "Inscrivez-vous et liez votre compte Minecraft pour retrouver pseudo et skin.", link: "/register" },
    { icon: "fa-brands fa-discord", title: "Rejoignez le Discord", description: "La date d'ouverture et l'adresse du serveur y seront annoncées en premier.", link: DISCORD_URL, target: "_blank" },
];

const saisonsPassees = [
    { saison: 2, link: "https://s2.tetrago.fr/rp" },
    { saison: 1, link: "https://s1.tetrago.fr/" },
];

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

function tempsRestant(cible, maintenant) {
    const total = Math.max(0, Math.floor((cible - maintenant) / 1000));
    return {
        total,
        jours: Math.floor(total / 86400),
        heures: Math.floor(total / 3600) % 24,
        minutes: Math.floor(total / 60) % 60,
        secondes: total % 60,
    };
}

function CompteARebours({ cible }) {
    const [maintenant, setMaintenant] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setMaintenant(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const reste = tempsRestant(cible.getTime(), maintenant);

    if (reste.total === 0) {
        return (
            <a className="btn btn-success btn-lg flex items-center gap-2" href="/">
                <FontAwesomeIcon icon="fa-solid fa-book-open" />
                La saison {SAISON} est ouverte : entrer
            </a>
        );
    }

    const unites = [
        { valeur: reste.jours, label: "jours" },
        { valeur: reste.heures, label: "heures" },
        { valeur: reste.minutes, label: "min" },
        { valeur: reste.secondes, label: "sec" },
    ];

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="grid grid-flow-col gap-3 text-center auto-cols-max" role="timer" aria-label="Temps restant avant l'ouverture">
                {unites.map(({ valeur, label }) => (
                    <div key={label} className="flex flex-col p-3 bg-base-100/15 backdrop-blur-sm rounded-2xl min-w-16">
                        <span className="countdown font-mono text-4xl md:text-5xl justify-center">
                            {/* daisyUI n'anime que de 0 à 999 : au-delà, le nombre de jours s'affiche tel quel */}
                            {valeur > 999
                                ? valeur
                                : <span style={{ '--value': valeur }} aria-hidden="true">{valeur}</span>}
                        </span>
                        <span className="text-sm opacity-80">{label}</span>
                    </div>
                ))}
            </div>
            <p className="text-sm opacity-80 first-letter:uppercase">{dateFormat.format(cible)}</p>
        </div>
    );
}

export default function LaunchHomePage() {
    // Lu une fois au montage : la page est rechargée après connexion ou déconnexion
    const [isLoggedIn] = useState(() => Boolean(localStorage.getItem("user")));

    return (
        <>
            <NavbarLaunch active="home" />
            <div className="bg-base-100">
                <main className="container mx-auto p-4">
                    <ImageHero
                        image="/images/minecraft/spawn_01.png"
                        blur={4}
                        icon="fa-solid fa-hourglass-half"
                        title={`La saison ${SAISON} arrive`}
                        description="Un nouveau chapitre du Grimoire de Tetrago s'apprête à s'ouvrir. Préparez votre personnage, relisez le Codex et tenez-vous prêts : le monde attend ses bâtisseurs."
                        className="rounded-3xl mb-14 py-24 px-4 w-full"
                    >
                        <span className="badge badge-warning badge-lg gap-2 font-semibold">
                            <FontAwesomeIcon icon="fa-solid fa-bullhorn" />
                            Lancement prochainement
                        </span>

                        {LANCEMENT_DATE && <CompteARebours cible={LANCEMENT_DATE} />}

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                            <a className="btn btn-primary flex items-center gap-2" href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon="fa-brands fa-discord" />
                                Suivre l'annonce sur Discord
                            </a>
                            <a className="btn btn-error flex items-center gap-2" href="/codex">
                                <FontAwesomeIcon icon="fa-solid fa-scroll" />
                                Règlement
                            </a>
                        </div>
                    </ImageHero>

                    {/* Préparatifs */}
                    <section className="mb-14">
                        <h2 className="text-2xl font-bold mb-2 text-center">Préparez votre arrivée</h2>
                        <p className="text-center opacity-70 mb-8">Le serveur n'est pas encore ouvert, mais tout peut déjà se préparer.</p>
                        <div className="grid gap-4 grid-cols-2">
                            {preparatifs.map((etape, index) => (
                                <a
                                    key={etape.title}
                                    href={etape.link}
                                    target={etape.target}
                                    rel={etape.target ? "noopener noreferrer" : undefined}
                                    className="bg-base-200 rounded-3xl p-5 shadow-md flex flex-col gap-2 hover:shadow-xl hover:-translate-y-1 transition"
                                >
                                    <div className="flex flex-row items-center gap-3">
                                        <span className="badge badge-primary badge-lg font-bold">{index + 1}</span>
                                        <FontAwesomeIcon icon={etape.icon} className="text-primary text-xl" />
                                    </div>
                                    <h3 className="font-bold text-lg">{etape.title}</h3>
                                    <p className="text-sm opacity-80">{etape.description}</p>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* Saisons passées */}
                    <section className="mb-16 text-center">
                        <h2 className="text-2xl font-bold mb-2">En attendant, relisez les saisons passées</h2>
                        <p className="opacity-70 mb-6">Leurs civilisations, leurs guerres et leurs récits restent consultables.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {saisonsPassees.map(({ saison, link }) => (
                                <a key={saison} className="btn btn-outline btn-secondary rounded-3xl flex items-center gap-2" href={link}>
                                    <FontAwesomeIcon icon="fa-solid fa-clock-rotate-left" />
                                    Saison {saison}
                                </a>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
