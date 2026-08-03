import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navbar from "../../components/Navigation/Navbar";
import CopyBtn from '../../components/Buttons/CopyButton'
import './Home_Creative.css'

const serverURL = import.meta.env.VITE_SERVER_URL || "play.tetrago.fr";

const books = [
    { icon: "fa-solid fa-book", title: "Bibliothèque", description: "Les journaux et récits de la communauté.", link: "/bibliotheque", color: "var(--color-primary)", tilt: "-3deg" },
    { icon: "fa-solid fa-flag", title: "Civilisations", description: "Les factions qui façonnent le monde.", link: "/civilisations", color: "var(--color-secondary)", tilt: "2deg" },
    { icon: "fa-solid fa-map", title: "Cartographie", description: "Le monde de Tetrago à explorer.", link: "https://map.beta.tetrago.fr", color: "var(--color-accent)", tilt: "-1deg" },
    { icon: "fa-solid fa-server", title: "API", description: "Les archives ouvertes du serveur.", link: "https://api.beta.tetrago.fr", color: "var(--color-info)", tilt: "3deg" },
    { icon: "fa-brands fa-discord", title: "Discord", description: "Rejoignez la communauté.", link: "https://discord.gg/nUFwE9S", color: "var(--color-neutral)", tilt: "-2deg" },
];

// Proposition "créative" : un grimoire nocturne où chaque page du site devient un livre posé sur une étagère.
export default function Home_Creative() {
    return (
        <>
            <Navbar active="home" />
            <div className="bg-base-100">
                {/* Hero façon grimoire étoilé */}
                <section className="grimoire-hero rounded-3xl mb-14 py-24 px-4">
                    <div className="grimoire-stars"></div>
                    <div className="grimoire-stars2"></div>
                    <div className="grimoire-stars3"></div>
                    <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-5 text-neutral-content">
                        <FontAwesomeIcon icon="fa-solid fa-book-open" size="3x" className="text-warning" />
                        <h1 className="text-4xl md:text-5xl font-bold">Ouvrez le Grimoire de Tetrago</h1>
                        <p className="text-lg opacity-90">
                            Chaque joueur y écrit un chapitre. Factions, récits, cartes et légendes : votre histoire commence
                            ici, sous les étoiles d'un monde à bâtir ensemble.
                        </p>
                        <CopyBtn
                            text="Franchir le portail"
                            textCopy={serverURL}
                            icon={<FontAwesomeIcon icon="fa-solid fa-hat-wizard" />}
                            classes="btn btn-warning"
                        />
                    </div>
                </section>

                <main className="container mx-auto p-4">
                    {/* Étagère interactive */}
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold mb-8 text-center">L'étagère du voyageur</h2>
                        <div className="grimoire-shelf flex flex-wrap justify-center gap-6">
                            {books.map((book) => (
                                <a
                                    key={book.title}
                                    href={book.link}
                                    className="grimoire-book card w-44 p-5 shadow-xl text-center"
                                    style={{ '--tilt': book.tilt, backgroundColor: book.color, color: '#fff' }}
                                >
                                    <FontAwesomeIcon icon={book.icon} size="2x" className="mb-3" />
                                    <h3 className="font-semibold">{book.title}</h3>
                                    <p className="text-xs opacity-90 mt-1">{book.description}</p>
                                </a>
                            ))}
                        </div>
                    </section>

                    {/* Extrait de légende */}
                    <section className="mb-16">
                        <div className="mockup-code max-w-3xl mx-auto">
                            <pre data-prefix="§"><code>Chapitre I — L'arrivée</code></pre>
                            <pre data-prefix=">" className="text-warning"><code>Un voyageur pose le pied sur les terres de Tetrago...</code></pre>
                            <pre data-prefix=">" className="text-success"><code>Il choisit sa civilisation, écrit son premier journal.</code></pre>
                            <pre data-prefix=">"><code>Son histoire ne fait que commencer.</code></pre>
                        </div>
                    </section>

                    {/* Signature finale */}
                    <section className="text-center py-12 mb-4 rounded-3xl bg-neutral text-neutral-content">
                        <FontAwesomeIcon icon="fa-solid fa-feather-pointed" size="2x" className="mb-4 text-warning" />
                        <h2 className="text-2xl font-bold mb-4">Écrivez votre propre légende</h2>
                        <p className="mb-6 opacity-90">L'encre est prête, la page est blanche. À vous de jouer.</p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <CopyBtn text="Rejoindre le serveur" textCopy={serverURL} classes="btn btn-warning" style={{}} />
                            <a className="btn btn-outline btn-neutral-content" href="/login">Se connecter</a>
                        </div>
                    </section>
                </main>
            </div>
        </>
    )
}
