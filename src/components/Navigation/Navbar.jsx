import React from 'react'
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import './Navbar.css';

export default function Navbar2({ active = '' }) {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'light';
    });

    useEffect(() => {
        const savedtheme = localStorage.getItem('theme');
        if (savedtheme) {
            setTheme(savedtheme);
        } else {
            // Use system preference
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;
            const systemTheme = prefersDark ? "dark" : "light";
            setTheme(systemTheme);
        }
        console.log("Current theme:", theme);
    }, [theme]);

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
        const html = document.documentElement;
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        console.log("Theme updated to:", newTheme);
    }

    const User = JSON.parse(localStorage.getItem('user'));
    const HTMLMenu = (
        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-box rounded-3xl z-1 p-2 m-1 mb-2 shadow-xl flex-col-reverse gap-1">
            <li>
                <a href="/" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'home' ? 'bg-primary text-primary-content' : ''}`}>
                    <span>Accueil</span>
                    <FontAwesomeIcon icon="house" className="ml-2" />
                </a>
            </li>
            <li>
                <a href="/bibliotheque" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'bibliotheque' ? 'bg-primary text-primary-content' : ''}`}>
                    <span>Bibliothèque</span>
                    <FontAwesomeIcon icon="book" className="ml-2" />
                </a>
            </li>
            <li>
                <a href="/test" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'test' ? 'bg-primary text-primary-content' : ''}`}>
                    <span>Test</span>
                    <FontAwesomeIcon icon="vial" className="ml-2" />
                </a>
            </li>
        </ul>
    );

    return (
        <>
            <div className='fixed flex flex-row-reverse justify-between items-center gap-2 px-2 z-999 bottom-3 right-0 w-full'>
                <div className="flex flex-row-reverse items-center flex-wrap-reverse gap-2">
                    {/* <!-- NavBar --> */}
                    <div className="dropdown dropdown-top dropdown-end">
                        <div tabIndex="0" role="button" className="btn bg-base-200 rounded-box rounded-3xl btn-ghost shadow-xl">
                            <FontAwesomeIcon icon="fa-solid fa-bars-staggered" />
                        </div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-box rounded-3xl z-1 p-2 m-1 mb-2 shadow-xl flex-col-reverse gap-1">
                            <li>
                                <a href="/" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'home' ? 'bg-primary text-primary-content' : ''}`}>
                                    <span>Accueil</span>
                                    <FontAwesomeIcon icon="house" className="ml-2" />
                                </a>
                            </li>
                            <li>
                                <a href="/bibliotheque" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'bibliotheque' ? 'bg-primary text-primary-content' : ''}`}>
                                    <span>Bibliothèque</span>
                                    <FontAwesomeIcon icon="book" className="ml-2" />
                                </a>
                            </li>
                            <li>
                                <a href="/test" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'test' ? 'bg-primary text-primary-content' : ''}`}>
                                    <span>Test</span>
                                    <FontAwesomeIcon icon="vial" className="ml-2" />
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* <!-- Profil --> */}
                    <div className="dropdown dropdown-top dropdown-end">
                        <div tabIndex="0" role="button" className="btn bg-base-200 rounded-box rounded-3xl btn-ghost shadow-xl">
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
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-box rounded-3xl z-1 p-2 m-1 mb-2 shadow-xl flex-col-reverse gap-1">
                            {User ? (
                                <>
                                    <li>
                                        <a href="/profil" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'profil' ? 'bg-primary text-primary-content' : ''}`}>
                                            <span>Profil</span><FontAwesomeIcon icon="user" className="ml-2" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/parametres" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'parametres' ? 'bg-primary text-primary-content' : ''}`}>
                                            <span className="badge">New</span>
                                            <span>Paramètres</span>
                                            <FontAwesomeIcon icon="fa-solid fa-gear" className="ml-2" />
                                        </a>
                                    </li>
                                    <li>
                                        <button className={`justify-end flex-row gap-2 rounded-box rounded-3xl hover:bg-error`} onClick={() => {
                                            localStorage.removeItem('user')
                                            window.location.reload()
                                        }}>
                                            <span>Déconnexion</span>
                                            <FontAwesomeIcon icon="right-from-bracket" className="ml-2" />
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>                                    
                                        <a href="/login" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'login' ? 'bg-primary text-primary-content' : ''}`}>
                                            <span>Connexion</span>
                                            <FontAwesomeIcon icon="right-to-bracket" className="ml-2" />
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/register" className={`justify-end flex-row gap-2 rounded-box rounded-3xl ${active === 'register' ? 'bg-primary text-primary-content' : ''}`}>
                                            <span>Inscription</span>
                                            <FontAwesomeIcon icon="user-plus" className="ml-2" />
                                        </a>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* <!-- Themes --> */}
                    <div className="dropdown dropdown-top dropdown-end">
                        <div tabIndex="0" role="button" className="btn bg-base-200 rounded-box rounded-3xl btn-ghost shadow-xl">
                        <FontAwesomeIcon icon="fa-solid fa-palette" />
                        </div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-box rounded-3xl z-1 p-2 m-1 mb-2 shadow-xl flex-col gap-1">
                            <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('light')}}>
                                    <span>Clair</span>
                                    <FontAwesomeIcon icon="sun" className="ml-2" />
                                </a>
                            </li>
                            {/* <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('winter')}}>
                                    <span>Winter</span>
                                    <FontAwesomeIcon icon="snowflake" className="ml-2" />
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('lemonade')}}>
                                    <span>Lemonade</span>
                                    <FontAwesomeIcon icon="lemon" className="ml-2" />
                                </a>
                            </li> */}
                            <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('dark')}}>
                                    <span>Sombre</span>
                                    <FontAwesomeIcon icon="moon" className="ml-2" />
                                </a>
                            </li>
                            {/* <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('night')}}>
                                    <span>Night</span>
                                    <FontAwesomeIcon icon="star" className="ml-2" />
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('dim')}}>
                                    <span>Dim</span>
                                    <FontAwesomeIcon icon="eye-slash" className="ml-2" />
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('synthwave')}}>
                                    <span>Synthwave</span>
                                    <FontAwesomeIcon icon="music" className="ml-2" />
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('aqua')}}>
                                    <span>Aqua</span>
                                    <FontAwesomeIcon icon="water" className="ml-2" />
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-end flex-row gap-2 rounded-box rounded-3xl" onClick={() => {updateTheme('coffee')}}>
                                    <span>Coffee</span>
                                    <FontAwesomeIcon icon="mug-hot" className="ml-2" />
                                </a>
                            </li> */}
                        </ul>
                    </div>

                    {/* <!-- Options Buttons --> */}
                    {/* <div className="flex flex-row-reverse flex-wrap-reverse gap-2"></div> */}
                </div>
                <div>
                    <div className="flex flex-row-reverse flex-wrap-reverse gap-2">
                        <a href='' className="btn bg-base-200 rounded-box rounded-3xl btn-ghost shadow-xl">
                            <FontAwesomeIcon icon="fa-solid fa-circle-info" />
                        </a>
                    </div>
                </div>
                
            </div>
        </>
    )
}