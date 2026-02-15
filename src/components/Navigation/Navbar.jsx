import React from 'react'
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import './Navbar.css';

// ===== Constantes =====
const link_network = 'https://mcapi.us/server/status?ip=spinelle-network.minesr.com';
const link_serv = 'https://mcapi.us/server/status?ip=mbu-tetrago.minesr.com';

// Default Skin
const MHF = ["MHF_Steve", "MHF_Alex"];

// Skin Render Type
const SRT = ["default", "crouching", "crossed", "criss_cross", "cheering", "relaxing", "trudging", "cowering", "pointing", "lunging", "archer", "kicking", "ultimate"];

let SRTsize = SRT.length

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export default function Navbar({ active = '' }) {
    // Server Statistics
    const [Playerlist, setPlayerlist] = useState(false);
    const [NetworkData, setNetworkData] = useState(null);
    const [ServerData, setServerData] = useState(null);

    useEffect(() => {
        setPlayerlist(false);
    }, []);

    useEffect(() => {
        fetch(link_network)
            .then((response) => response.json())
            .then((data) => {
                setNetworkData(data);
            })
            .catch((error) => {
                console.error('Error fetching network data:', error);
            });
    }, []);

    useEffect(() => {
        fetch(link_serv)
            .then((response) => response.json())
            .then((data) => {
                setServerData(data);
            })
            .catch((error) => {
                console.error('Error fetching server data:', error);
            }
            );
    }, []);

    const reloadComponent = () => {
        // Rafraîchir les données du réseau
        fetch(link_network)
            .then((response) => response.json())
            .then((data) => {
                setNetworkData(data);
            })
            .catch((error) => {
                console.error('Error fetching network data:', error);
            });

        // Rafraîchir les données du serveur
        fetch(link_serv)
            .then((response) => response.json())
            .then((data) => {
                setServerData(data);
            })
            .catch((error) => {
                console.error('Error fetching server data:', error);
            });
    };

    const ServerStatisticsLoading = (
        <>
            <div className='flex gap-2'>
                <div className='flex gap-2 items-center bg-base-200' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                    <strong className='flex gap-1'><span className='hidden sm:flex'>Loading</span></strong>
                </div>
                <div className='loading loading-spinner loading-lg'></div>
            </div>
        </>
    )

    // Theme
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved;
        }
        // Use system preference
        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
        return prefersDark ? "dark" : "light";
    });

    useEffect(() => {
        // Apply the theme to the DOM whenever it changes
        const html = document.documentElement;
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // console.log("Current theme:", theme);
    }, [theme]);

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
    }

    // User Data
    const User = JSON.parse(localStorage.getItem('user'));

    // Render
    return (
        <>
            <div className="navbar fixed flex flex-row justify-between items-center gap-2 px-2 py-3 z-999 top-0 left-0 w-full bg-base-200 shadow-lg">
                <div className="navbar-start">
                    {/* <!-- Navigation --> */}
                    <div className="dropdown dropdown-bottom dropdown-start">
                        <div tabIndex={0} role="button" className="btn bg-base-200 rounded-3xl btn-ghost">
                            <FontAwesomeIcon icon="fa-solid fa-bars-staggered" />
                        </div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                            <li>
                                <a href="/" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active === 'home' ? 'bg-primary text-primary-content' : ''}`}>
                                    <FontAwesomeIcon icon="house" />
                                    <span>Accueil</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://map.amethyst.spinelle.eu" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl`}>
                                    <FontAwesomeIcon icon="map" />
                                    <span>Cartographie</span>
                                </a>
                            </li>
                            <li>
                                <a href="/bibliotheque" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active === 'bibliotheque' ? 'bg-primary text-primary-content' : ''}`}>
                                    <FontAwesomeIcon icon="book" />
                                    <span>Bibliothèque</span>
                                </a>
                            </li>
                            <li>
                                <a href="/civilisations" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active === 'civilisations' ? 'bg-primary text-primary-content' : ''}`}>
                                    <FontAwesomeIcon icon="flag" />
                                    <span>Civilisations</span>
                                </a>
                            </li>
                            <li>
                                <a href="/test" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${active === 'test' ? 'bg-primary text-primary-content' : ''}`}>
                                    <FontAwesomeIcon icon="vial" />
                                    <span>Test</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* <!-- Profil --> */}
                    <div className="dropdown dropdown-bottom dropdown-start">
                        <div tabIndex="0" role="button" className="btn bg-base-200 rounded-3xl btn-ghost">
                            {User ? (
                                <FontAwesomeIcon icon="fa-solid fa-user-check" />
                            ) : (
                                <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                            )}
                        </div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                            {User ? (
                                <>
                                    <li>
                                        <a href="/profil" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'profil' ? 'bg-primary text-primary-content' : ''}`}>
                                            <FontAwesomeIcon icon="fa-solid fa-user" />
                                            <span>Profil</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/parametres" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'parametres' ? 'bg-primary text-primary-content' : ''}`}>
                                            <FontAwesomeIcon icon="fa-solid fa-gear" />
                                            <span>Paramètres</span>
                                            <span className="badge">New</span>
                                        </a>
                                    </li>
                                    <li>
                                        <button className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl hover:bg-error`} onClick={() => {
                                            localStorage.removeItem('user')
                                            window.location.reload()
                                        }}>
                                            <FontAwesomeIcon icon="right-from-bracket" />
                                            <span>Déconnexion</span>
                                        </button>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <a href="/login" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'login' ? 'bg-primary text-primary-content' : ''}`}>
                                            <FontAwesomeIcon icon="right-to-bracket" />
                                            <span>Connexion</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/register" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'register' ? 'bg-primary text-primary-content' : ''}`}>
                                            <FontAwesomeIcon icon="user-plus" />
                                            <span>Inscription</span>
                                        </a>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* <!-- Themes --> */}
                    <div className="dropdown dropdown-bottom dropdown-start">
                        <div tabIndex="0" role="button" className="btn bg-base-200 rounded-3xl btn-ghost">
                            <FontAwesomeIcon icon="fa-solid fa-palette" />
                        </div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1">
                            <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => { updateTheme('light') }}>
                                    <FontAwesomeIcon icon="sun" />
                                    <span>Clair</span>
                                </a>
                            </li>
                            {/* <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => {updateTheme('winter')}}>
                                    <FontAwesomeIcon icon="snowflake" />
                                    <span>Winter</span>
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => {updateTheme('lemonade')}}>
                                    <FontAwesomeIcon icon="lemon" />
                                    <span>Lemonade</span>
                                </a>
                            </li> */}
                            <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => { updateTheme('dark') }}>
                                    <FontAwesomeIcon icon="moon" />
                                    <span>Sombre</span>
                                </a>
                            </li>
                            {/* <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => {updateTheme('night')}}>
                                    <FontAwesomeIcon icon="star" />
                                    <span>Night</span>
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => {updateTheme('dim')}}>
                                    <FontAwesomeIcon icon="eye-slash" />
                                    <span>Dim</span>
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => {updateTheme('synthwave')}}>
                                    <FontAwesomeIcon icon="music" />
                                    <span>Synthwave</span>
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => {updateTheme('aqua')}}>
                                    <FontAwesomeIcon icon="water" />
                                    <span>Aqua</span>
                                </a>
                            </li> */}
                            {/* <li>
                                <a className="justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl" onClick={() => {updateTheme('coffee')}}>
                                    <FontAwesomeIcon icon="mug-hot" />
                                    <span>Coffee</span>
                                </a>
                            </li> */}
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
                <div className="navbar-end">
                    {(ServerData && NetworkData ? (
                        <div className='flex gap-2'>
                            <div className='btn flex gap-2 items-center bg-base-200 btn-ghost rounded-3xl' onClick={() => reloadComponent()}>
                                <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
                            </div>

                            {ServerData.online === true ?
                                <div className='btn btn-ghost flex gap-2 items-center bg-base-200 rounded-3xl' style={{ paddingLeft: "0px", paddingRight: "15px" }} onClick={() => setPlayerlist(!Playerlist)}>
                                    <div className='flex gap-2 items-center bg-accent' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                                        <div className='flex text-accent-content'><FontAwesomeIcon icon="fa-regular fa-circle-check" /></div>
                                        <span className='hidden md:flex text-accent-content'>En ligne</span>
                                    </div>
                                    <div className='flex'><FontAwesomeIcon icon="fa-solid fa-people-group" /></div>
                                    <div className='flex gap-1'>
                                        <span id="player">{NetworkData.players.now}</span>
                                        <span className='hidden sm:flex'>/</span>
                                        <span id="players" className='hidden sm:flex'>{NetworkData.players.max}</span>
                                    </div>
                                </div>
                                :
                                <div className='btn btn-ghost flex gap-2 items-center bg-base-200 rounded-3xl' style={{ padding: "0" }} onClick={() => setPlayerlist(false)}>
                                    <div className='flex gap-2 items-center bg-error' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                                        <div className='flex text-error-content'><FontAwesomeIcon icon="fa-regular fa-circle-xmark" /></div>
                                        <span className='hidden md:flex text-error-content'>Éteint</span>
                                    </div>
                                </div>
                            }
                        </div>
                    ) : ServerStatisticsLoading)}
                </div>
            </div>

            <div className='fixed top-17 left-0 w-full z-990'>
                {Playerlist && <div id='servplayers' className='flex gap-5 items-center flex-col bg-base-200 shadow-lg' style={{ borderRadius: "20px", paddingTop: "1rem", margin: "0.5rem 1rem" }}>
                    <FontAwesomeIcon icon="fa-solid fa-people-group" />
                    <div id="playerslist" className='flex gap-10 items-center bg-base-200' style={{ padding: "10px 30px" }}>
                        {ServerData.players.now == 0 && <div id="list" className='flex items-center'>Il n'y a personne !</div>}
                        {ServerData.players.sample.map((player, index) => {
                            // console.log(player, index)
                            return (
                                <div key={index} className='flex flex-col gap-2 items-center' style={{ margin: "0 10px" }}>
                                    <img src={`https://starlightskins.lunareclipse.studio/render/${SRT[getRandomInt(SRTsize)]}/${player.name}/face/`} alt={`${player.name} head`} className='h-16' />
                                    <span>{player.name}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>}
            </div>

        </>
    )
}