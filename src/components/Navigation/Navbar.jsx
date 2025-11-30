import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Navbar({ active = '' }) {
    const [theme, setTheme] = React.useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'light';
    });

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        const html = document.documentElement;
        if (newTheme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        localStorage.setItem('theme', newTheme);
    };

    const User = JSON.parse(localStorage.getItem('user'));
    const HTMLMenu = (
        <>
            <li><a href='/bibliotheque' className={active === 'bibliotheque' ? 'bg-base-300' : ''}>Bibliothèque</a></li>
            <li><a href='/test' className={active === 'test' ? 'bg-base-300' : ''}>Test</a></li>
            {/* <li>
                <a>Parent</a>
                <ul className="p-2">
                    <li><a>Submenu 1</a></li>
                    <li><a>Submenu 2</a></li>
                </ul>
            </li>
            <li><a>Item 3</a></li> */}
        </>
    );
    return (
        <div className="navbar bg-base-200 shadow-sm">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-200 rounded-box z-1 mt-4 w-52 p-2 shadow">
                        {HTMLMenu}
                    </ul>
                </div>
                <a href='/' className="btn btn-ghost text-xl">
                    <img src="/galaxie.png" alt="logo" width={24} height={24} />
                    <span>Tetrago</span>
                </a>
                <div className='hidden lg:flex' style={{ marginLeft: '20px' }}>
                    <ul className="menu menu-horizontal px-1 gap-2">
                        {HTMLMenu}
                    </ul>
                </div>
            </div>
            {/* <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    {HTMLMenu}
                </ul>
            </div> */}
            <div className="navbar-end gap-2">
                <button
                    onClick={toggleTheme}
                    className="btn btn-ghost btn-circle"
                    title={`Basculer au thème ${theme === 'light' ? 'sombre' : 'clair'}`}
                >
                    {theme === 'light' ? (
                        <span className="text-xl"><FontAwesomeIcon icon="fa-solid fa-moon" /></span>
                    ) : (
                        <span className="text-xl"><FontAwesomeIcon icon="fa-solid fa-sun" /></span>
                    )}
                </button>
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        {User && User.image_url != "" && User.image_url != null ? (
                            <div className="w-10 rounded-full">
                                <img
                                    alt="Profile Menu"
                                    src={User.image_url} />
                            </div>
                        ) : (
                            <FontAwesomeIcon icon="fa-solid fa-user" />
                        )}
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-200 rounded-box z-[1] mt-5 w-52 p-2 shadow">
                        {User ? (
                            <>
                                <li>
                                    <a href='/profil' className="justify-between"><span>Profil</span></a>
                                </li>
                                {/* <li>
                                <a className="justify-between">
                                    <span>Paramètres</span>
                                    <span className="badge">New</span>
                                </a>
                            </li> */}
                                <li>
                                    <button className="" onClick={() => {
                                        localStorage.removeItem('user')
                                        window.location.reload()
                                    }}>Déconnexion</button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><a href='/login' className={active === 'login' ? 'bg-base-300' : ''}>Connexion</a></li>
                                <li><a href='/register' className={active === 'register' ? 'bg-base-300' : ''}>Inscription</a></li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}