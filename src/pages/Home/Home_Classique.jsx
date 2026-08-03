import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "../../components/Navigation/Navbar";
import CopyBtn from '../../components/Buttons/CopyButton'

const serverURL = import.meta.env.VITE_SERVER_URL || "play.tetrago.fr";

const features = [
    { icon: "fa-solid fa-hat-wizard", title: "Role-play profond", description: "Des systèmes conçus pour encourager l'histoire et l'immersion entre joueurs." },
    { icon: "fa-solid fa-coins", title: "Économie & métiers", description: "Gagnez votre vie, commercez et grimpez dans la hiérarchie sociale." },
    { icon: "fa-solid fa-calendar-days", title: "Événements réguliers", description: "Des events hebdomadaires organisés par une équipe active pour animer la communauté." },
];

const explore = [
    { icon: "fa-solid fa-book", title: "Bibliothèque", description: "Journaux et ouvrages écrits par la communauté.", link: "/bibliotheque" },
    { icon: "fa-solid fa-flag", title: "Civilisations", description: "Les factions fondées par les joueurs.", link: "/civilisations" },
    { icon: "fa-solid fa-map", title: "Cartographie", description: "La carte du monde en temps réel.", link: "https://map.beta.tetrago.fr" },
    { icon: "fa-solid fa-server", title: "API", description: "Les données publiques du serveur.", link: "https://api.beta.tetrago.fr" },
];

// Proposition "classique" : mise en page traditionnelle en sections empilées, sans animation ni interactivité particulière.
export default function Home_Classique() {
    return (
        <>
            <Navbar active="home" />
            <div className="bg-base-100">
                <main className="container mx-auto p-4">
                    {/* Hero */}
                    <section className="hero bg-base-200 rounded-3xl mb-8 py-16">
                        <div className="hero-content text-center">
                            <div className="max-w-xl">
                                <h1 className="text-4xl font-bold mb-4">Bienvenue sur Tetrago</h1>
                                <p className="mb-6">
                                    Un serveur Minecraft axé role-play où l'immersion, la narration et la communauté priment.
                                    Construisez votre histoire, rejoignez des factions, et participez à des événements organisés.
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                    <CopyBtn text="Rejoindre le serveur" textCopy={serverURL} classes="btn btn-primary" style={{}} />
                                    <a className="btn btn-success" href="/login">Se connecter</a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* À propos */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">À propos</h2>
                        <div className="grid gap-6 md:grid-cols-2 items-center">
                            <div>
                                <p className="mb-4">
                                    Bienvenue sur notre serveur Minecraft axé role-play. Ici, l'immersion, la narration et la
                                    communauté priment. Construisez votre histoire, rejoignez des factions, et participez à des
                                    événements organisés.
                                </p>
                                <ul className="list-disc list-inside">
                                    <li>Système économique complet</li>
                                    <li>Quêtes et événements role-play</li>
                                    <li>Équipe active et modération</li>
                                </ul>
                            </div>
                            <div className="card bg-base-200 p-6">
                                <FontAwesomeIcon icon="fa-solid fa-network-wired" size="2x" className="text-primary mb-3" />
                                <p className="font-semibold">IP du serveur</p>
                                <p className="text-sm opacity-70">{serverURL}</p>
                            </div>
                        </div>
                    </section>

                    {/* Fonctionnalités */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Fonctionnalités</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.title} className="card p-4 bg-base-200">
                                    <FontAwesomeIcon icon={feature.icon} className="text-primary mb-2" size="lg" />
                                    <h3 className="font-semibold">{feature.title}</h3>
                                    <p className="text-sm">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Explorer le site */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Explorer</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {explore.map((item) => (
                                <a key={item.title} href={item.link} className="card p-4 bg-base-200 hover:bg-base-300 transition-colors">
                                    <FontAwesomeIcon icon={item.icon} className="text-secondary mb-2" size="lg" />
                                    <h3 className="font-semibold">{item.title}</h3>
                                    <p className="text-sm">{item.description}</p>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="text-center py-8">
                        <h2 className="text-2xl font-bold mb-4">Prêt à nous rejoindre ?</h2>
                        <p className="mb-6">Rejoignez la communauté et commencez votre aventure role-play aujourd'hui.</p>
                        <div className="flex flex-col gap-3 md:flex-row md:justify-center">
                            <CopyBtn text="Rejoindre le serveur" textCopy={serverURL} classes="btn btn-primary" style={{}} />
                            <a className="btn btn-success" href="/login">Se connecter</a>
                        </div>
                    </section>
                </main>
            </div>
        </>
    )
}
