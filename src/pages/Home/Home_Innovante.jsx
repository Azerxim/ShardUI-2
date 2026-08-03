import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "../../components/Navigation/Navbar";
import CopyBtn from '../../components/Buttons/CopyButton'
import { getApiURL } from "../../services/api"

const serverURL = import.meta.env.VITE_SERVER_URL || "play.tetrago.fr";
const link_serv = 'https://mcapi.us/server/status?ip=mbu-tetrago.minesr.com';

const sections = [
    { id: "hero", label: "Accueil", icon: "fa-solid fa-house" },
    { id: "stats", label: "En direct", icon: "fa-solid fa-chart-line" },
    { id: "decouvrir", label: "Découvrir", icon: "fa-solid fa-compass" },
    { id: "parcours", label: "Parcours", icon: "fa-solid fa-route" },
    { id: "rejoindre", label: "Rejoindre", icon: "fa-solid fa-door-open" },
];

const tabs = [
    { id: "bibliotheque", icon: "fa-solid fa-book", title: "Bibliothèque", description: "Plongez dans les journaux et ouvrages écrits par la communauté au fil des aventures.", link: "/bibliotheque" },
    { id: "civilisations", icon: "fa-solid fa-flag", title: "Civilisations", description: "Découvrez les factions fondées par les joueurs et leurs territoires.", link: "/civilisations" },
    { id: "cartographie", icon: "fa-solid fa-map", title: "Cartographie", description: "Explorez la carte du monde et repérez les territoires en temps réel.", link: "https://map.beta.tetrago.fr" },
    { id: "api", icon: "fa-solid fa-server", title: "API", description: "Accédez aux données publiques du serveur via notre API ouverte.", link: "https://api.beta.tetrago.fr" },
];

const steps = [
    { icon: "fa-solid fa-user-plus", title: "Créez votre compte", description: "Inscrivez-vous en quelques secondes." },
    { icon: "fa-solid fa-network-wired", title: "Rejoignez le serveur", description: "Connectez-vous avec l'IP copiée." },
    { icon: "fa-solid fa-feather-pointed", title: "Écrivez votre histoire", description: "Faites vivre votre personnage et sa civilisation." },
];

// Proposition "innovante" : navigation par ancres, statistiques en direct et onglets interactifs.
export default function Home_Innovante() {
    const apiURL = getApiURL();

    const [serverStatus, setServerStatus] = useState(null);
    const [civCount, setCivCount] = useState(null);
    const [bookCount, setBookCount] = useState(null);
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    useEffect(() => {
        fetch(link_serv)
            .then((res) => res.json())
            .then((data) => setServerStatus(data))
            .catch(() => setServerStatus(null));

        fetch(`${apiURL}/civilisations/list`)
            .then((res) => res.json())
            .then((data) => setCivCount(Array.isArray(data) ? data.length : null))
            .catch(() => setCivCount(null));

        fetch(`${apiURL}/bibliotheque/livres/list`)
            .then((res) => res.json())
            .then((data) => setBookCount(Array.isArray(data) ? data.length : null))
            .catch(() => setBookCount(null));
    }, [apiURL]);

    const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

    return (
        <>
            <Navbar active="home" />
            <div className="bg-base-100 relative">
                {/* Navigation par ancres */}
                <nav className="hidden xl:flex flex-col gap-3 fixed right-6 top-1/2 -translate-y-1/2 z-40">
                    {sections.map((section) => (
                        <a
                            key={section.id}
                            href={`#${section.id}`}
                            className="btn btn-circle btn-sm bg-base-200 hover:bg-primary hover:text-primary-content tooltip tooltip-left"
                            data-tip={section.label}
                        >
                            <FontAwesomeIcon icon={section.icon} />
                        </a>
                    ))}
                </nav>

                <main className="container mx-auto p-4">
                    {/* Hero */}
                    <section id="hero" className="hero min-h-[60vh] rounded-3xl bg-base-200 mb-12 scroll-mt-24">
                        <div className="hero-content text-center">
                            <div className="max-w-xl flex flex-col items-center gap-4">
                                <h1 className="text-4xl md:text-5xl font-bold">Tetrago, votre prochaine histoire</h1>
                                <p className="text-lg">
                                    Un monde vivant, façonné par ses joueurs. Statistiques en direct, exploration interactive, et une
                                    communauté qui écrit son propre récit.
                                </p>
                                <div className="flex items-center gap-2 badge badge-lg" style={{ background: serverStatus ? undefined : 'transparent' }}>
                                    <span className={`w-2 h-2 rounded-full ${serverStatus ? 'bg-success' : 'bg-error'} inline-block`}></span>
                                    {serverStatus ? `Serveur en ligne · ${serverStatus.players?.now ?? 0} joueur(s)` : "Statut du serveur indisponible"}
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                    <CopyBtn text="Rejoindre le serveur" textCopy={serverURL} style={{}} icon={<FontAwesomeIcon icon="fa-solid fa-network-wired" />} classes="btn btn-primary" />
                                    <a className="btn btn-success" href="/login">
                                        <FontAwesomeIcon icon="right-to-bracket" />
                                        Se connecter
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Statistiques en direct */}
                    <section id="stats" className="mb-12 scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-center">En direct</h2>
                        <div className="stats stats-vertical sm:stats-horizontal shadow w-full bg-base-200">
                            <div className="stat place-items-center">
                                <div className="stat-figure text-primary"><FontAwesomeIcon icon="fa-solid fa-users" size="xl" /></div>
                                <div className="stat-title">Joueurs connectés</div>
                                <div className="stat-value">{serverStatus?.players?.now ?? "–"}</div>
                            </div>
                            <div className="stat place-items-center">
                                <div className="stat-figure text-secondary"><FontAwesomeIcon icon="fa-solid fa-flag" size="xl" /></div>
                                <div className="stat-title">Civilisations</div>
                                <div className="stat-value">{civCount ?? "–"}</div>
                            </div>
                            <div className="stat place-items-center">
                                <div className="stat-figure text-accent"><FontAwesomeIcon icon="fa-solid fa-book" size="xl" /></div>
                                <div className="stat-title">Livres publiés</div>
                                <div className="stat-value">{bookCount ?? "–"}</div>
                            </div>
                        </div>
                    </section>

                    {/* Onglets interactifs */}
                    <section id="decouvrir" className="mb-12 scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-center">Découvrir</h2>
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`btn btn-sm rounded-full ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
                                >
                                    <FontAwesomeIcon icon={tab.icon} />
                                    {tab.title}
                                </button>
                            ))}
                        </div>
                        <div className="card bg-base-200 p-8 max-w-2xl mx-auto text-center">
                            <FontAwesomeIcon icon={currentTab.icon} size="2x" className="text-primary mb-4" />
                            <h3 className="text-xl font-semibold mb-2">{currentTab.title}</h3>
                            <p className="mb-4">{currentTab.description}</p>
                            <a href={currentTab.link} className="btn btn-outline btn-primary self-center">
                                Explorer <FontAwesomeIcon icon="fa-solid fa-arrow-right" />
                            </a>
                        </div>
                    </section>

                    {/* Parcours */}
                    <section id="parcours" className="mb-12 scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-6 text-center">Votre parcours</h2>
                        <ul className="steps steps-vertical md:steps-horizontal w-full">
                            {steps.map((step) => (
                                <li key={step.title} className="step step-primary">
                                    <div className="flex flex-col items-center gap-2 py-4">
                                        <FontAwesomeIcon icon={step.icon} size="lg" className="text-primary" />
                                        <span className="font-semibold">{step.title}</span>
                                        <span className="text-sm opacity-70 max-w-48 text-center">{step.description}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* CTA */}
                    <section id="rejoindre" className="text-center py-10 mb-4 bg-base-200 rounded-3xl scroll-mt-24">
                        <h2 className="text-2xl font-bold mb-4">Prêt à nous rejoindre ?</h2>
                        <p className="mb-6">Rejoignez la communauté et commencez votre aventure role-play aujourd'hui.</p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <CopyBtn text="Rejoindre le serveur" textCopy={serverURL} classes="btn btn-primary" style={{}} />
                            <a className="btn btn-success" href="/login">Se connecter</a>
                            <a className="btn btn-secondary" href="https://discord.gg/nUFwE9S" target="_blank" rel="noopener noreferrer">
                                <FontAwesomeIcon icon="fa-brands fa-discord" />
                                Discord
                            </a>
                        </div>
                    </section>
                </main>
            </div>
        </>
    )
}
