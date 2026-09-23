import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import '@/components/layout/Navbar.css';

// ===== Barre de navigation des pages de lancement =====
// Version allégée de Navbar pour l'annonce de la saison (pages/home/LaunchHomePage.jsx) :
// ni état du serveur (pas encore ouvert), ni menu de profil. Garde le menu, le logo et le thème.

const liens = [
    { id: 'home', href: '/', icon: 'fa-solid fa-house', text: 'Accueil' },
    { id: 'codex', href: '/codex', icon: 'fa-solid fa-scroll', text: 'Codex' },
];

export default function NavbarLaunch({ active = '' }) {
    // Theme
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved;
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <div className="navbar fixed flex flex-row justify-between items-center gap-2 px-2 py-3 z-999 top-3 left-3 right-3 w-auto rounded-3xl bg-base-200 shadow-lg">
            <div className="navbar-start gap-2">
                {/* <!-- Navigation --> */}
                <div className="dropdown dropdown-bottom dropdown-start tooltip tooltip-right" data-tip="Menu">
                    <div tabIndex={0} role="button" aria-label="Menu" className="btn bg-base-200 rounded-3xl btn-ghost">
                        <FontAwesomeIcon icon="fa-solid fa-bars-staggered" />
                        <span className="hidden lg:inline">Menu</span>
                    </div>
                    <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                        {liens.map((lien) => (
                            <li key={lien.id}>
                                <a href={lien.href} className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active === lien.id ? 'bg-secondary text-secondary-content' : ''}`}>
                                    <FontAwesomeIcon icon={lien.icon} />
                                    <span>{lien.text}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* <!-- Themes --> */}
                <div className="dropdown dropdown-bottom dropdown-start tooltip tooltip-right" data-tip="Theme">
                    <div tabIndex="0" role="button" aria-label="Thème" className="btn bg-base-200 rounded-3xl btn-ghost">
                        <FontAwesomeIcon icon="fa-solid fa-palette" />
                        <span className="hidden lg:inline">Thème</span>
                    </div>
                    <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                        <li>
                            <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => setTheme('light')}>
                                <FontAwesomeIcon icon="sun" />
                                <span>Clair</span>
                            </a>
                        </li>
                        <li>
                            <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => setTheme('dark')}>
                                <FontAwesomeIcon icon="moon" />
                                <span>Sombre</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="navbar-center">
                <a href='/' className="btn btn-ghost text-xl rounded-3xl">
                    <img
                        src={theme === 'dark' ? "/images/logo/tetrago_white_contour.png" : "/images/logo/tetrago_black_contour.png"}
                        alt="logo"
                        width={36}
                        height={36}
                    />
                    <span className="hidden sm:flex">Tetrago</span>
                </a>
            </div>

            {/* Équilibre la barre pour garder le logo centré */}
            <div className="navbar-end"></div>
        </div>
    );
}
