import React from 'react'
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import '@/components/layout/Navbar.css';
import { syncSessionUser } from '@/services/session';
import { CARTE, DECOUVRIR, MONDE } from '@/config/navbar';
import NavbarLaunch from '@/components/layout/NavbarLaunch';
import RechercheGlobale from '@/components/layout/RechercheGlobale';
import { ouvrirRecherche } from '@/utils/recherche';
import { lancementAVenir } from '@/config/saison';

// ===== Constantes =====
const link_network = 'https://mcapi.us/server/status?ip=spinelle-network.minesr.com';
const link_serv = 'https://mcapi.us/server/status?ip=mbu-tetrago.minesr.com';

// Sections du site (config/navbar.js) : menu burger groupé, et liens visibles de la barre sur grand écran (xl)
// Listes déroulantes de la barre : sur un écran trop bas, elles défilent au lieu de sortir de l'écran.
// 7rem : barre fixe (top-3 + hauteur) et marge mt-6 ; flex-nowrap, sinon .menu de DaisyUI repasserait en colonnes.
const DEROULANT_DEFILANT = 'max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain flex-nowrap';
const menuItemClass = (actif) => `justify-start flex-row gap-2 pr-5 pl-4 rounded-box rounded-3xl ${actif ? 'bg-secondary text-secondary-content' : ''}`;
const barItemClass = (actif) => `btn btn-ghost btn-sm rounded-3xl gap-2 ${actif ? 'bg-secondary text-secondary-content' : ''}`;

const MenuLien = ({ lien, active }) => (
    <li>
        <a href={lien.href} className={menuItemClass(active === lien.id)}>
            <FontAwesomeIcon icon={lien.icon} />
            <span>{lien.text}</span>
        </a>
    </li>
);

// Default Skin
const MHF = ["MHF_Steve", "MHF_Alex"];

// Skin Render Type
const SRT = ["default", "crouching", "crossed", "criss_cross", "cheering", "relaxing", "trudging", "cowering", "pointing", "lunging", "archer", "kicking", "ultimate"];

let SRTsize = SRT.length

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export default function Navbar({ active = '' }) {
    // Barre allégée tant que VITE_SAISON_LANCEMENT annonce la saison à venir (config/saison.js)
    if (lancementAVenir()) return <NavbarLaunch active={active} />;
    return <NavbarSaison active={active} />;
}

function NavbarSaison({ active }) {
    // Server Statistics
    const [Playerlist, setPlayerlist] = useState(false);
    const [NetworkData, setNetworkData] = useState(null);
    const [ServerData, setServerData] = useState(null);

    useEffect(() => {
        // Réaligne le profil stocké sur celui de l'API, et efface la session si le jeton n'est plus valide
        syncSessionUser();
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
                    <strong className='flex gap-1'><span className='hidden sm:flex'>Chargement…</span></strong>
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
            <div className="navbar fixed flex flex-row justify-between items-center gap-2 px-2 py-3 z-999 top-3 left-3 right-3 w-auto rounded-3xl bg-base-200 shadow-lg">
                <div className="navbar-start gap-2">
                    {/* <!-- Navigation --> */}
                    <div className="dropdown dropdown-bottom dropdown-start tooltip tooltip-right" data-tip="Menu">
                        <div tabIndex={0} role="button" aria-label="Menu" className="btn bg-base-200 rounded-3xl btn-ghost">
                            <FontAwesomeIcon icon="fa-solid fa-bars-staggered" />
                            <span className="hidden lg:inline xl:hidden">Menu</span>
                        </div>
                        <ul tabIndex="-1" className={`dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1 w-56 ${DEROULANT_DEFILANT}`}>
                            <MenuLien lien={{ id: 'home', href: '/', icon: 'fa-solid fa-house', text: 'Accueil' }} active={active} />
                            {/* Sur téléphone, la loupe de la barre laisse sa place : la recherche s'ouvre d'ici */}
                            <li className="sm:hidden">
                                <button type="button" onClick={ouvrirRecherche} className={menuItemClass(false)}>
                                    <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                                    <span>Rechercher</span>
                                </button>
                            </li>
                            <li className="menu-title pt-3 pb-1">Découvrir</li>
                            {DECOUVRIR.map((lien) => <MenuLien key={lien.id} lien={lien} active={active} />)}
                            <MenuLien lien={{ ...CARTE, text: 'Cartographie' }} active={active} />
                            <MenuLien lien={{ id: 'roadmap', href: '/roadmap', icon: 'fa-solid fa-route', text: 'Feuille de route' }} active={active} />
                            <li className="menu-title pt-3 pb-1">Le monde</li>
                            {MONDE.map((lien) => <MenuLien key={lien.id} lien={lien} active={active} />)}
                            {User && User.is_admin && (
                                <>
                                    <li className="menu-title pt-3 pb-1">Administration</li>
                                    <li>
                                        <a href="https://api.beta.tetrago.fr" className={menuItemClass(active === 'api')}>
                                            <FontAwesomeIcon icon="fa-solid fa-server" />
                                            <span>API</span>
                                            <span className="tooltip" data-tip="Admin uniquement" data-place="top">
                                                <FontAwesomeIcon icon="fa-solid fa-key" className="text-error" />
                                            </span>
                                        </a>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* <!-- Profil --> */}
                    <div className="dropdown dropdown-bottom dropdown-start tooltip tooltip-right" data-tip="Profil">
                        <div tabIndex="0" role="button" aria-label={User ? "Mon compte" : "Connexion ou inscription"} className="btn bg-base-200 rounded-3xl btn-ghost">
                            {User ? (
                                <FontAwesomeIcon icon="fa-solid fa-user-check" />
                            ) : (
                                <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                            )}
                            <span className="hidden lg:inline">{User ? "Compte" : "Connexion"}</span>
                        </div>
                        <ul tabIndex="-1" className={`dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1 ${DEROULANT_DEFILANT}`}>
                            {User ? (
                                <>
                                    <li>
                                        <div className='flex flex-col gap-2 rounded-3xl bg-base-200 cursor-default' style={{ minWidth: "170px" }}>
                                            <i>Connecté en tant que</i>
                                            <b className='text-primary'>{User.full_name || User.username}</b>
                                        </div>
                                    </li>
                                    <li>
                                        <a href="/profil" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'profil' ? 'bg-secondary text-secondary-content' : ''}`}>
                                            <FontAwesomeIcon icon="fa-solid fa-user" />
                                            <span>Profil</span>
                                        </a>
                                    </li>
                                    <li>
                                        <button className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl hover:bg-error hover:text-error-content`} onClick={() => {
                                            localStorage.removeItem('user')
                                            localStorage.removeItem('token')
                                            window.location.reload()
                                        }}>
                                            <FontAwesomeIcon icon="right-from-bracket" />
                                            <span>Déconnexion</span>
                                        </button>
                                    </li>
                                    {/* <li>
                                        <a href="/parametres" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'parametres' ? 'bg-secondary text-secondary-content' : ''}`}>
                                            <FontAwesomeIcon icon="fa-solid fa-gear" />
                                            <span>Paramètres</span>
                                            <span className="badge">New</span>
                                        </a>
                                    </li> */}
                                    {User.is_admin && <hr className="my-2 border-base-300" />}
                                    {User.is_admin && (
                                        <li>
                                            <a href="/users" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'users' ? 'bg-secondary text-secondary-content' : ''}`}>
                                                <FontAwesomeIcon icon="fa-solid fa-users" />
                                                <span>Utilisateurs</span>
                                                <span className="tooltip" data-tip="Admin uniquement" data-place="top">
                                                    <FontAwesomeIcon icon="fa-solid fa-key" className="text-error" />
                                                </span>
                                            </a>
                                        </li>
                                    )}
                                    {User.is_admin && (
                                        <li>
                                            <a href="/admin/dimensions" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'admin-dimensions' ? 'bg-secondary text-secondary-content' : ''}`}>
                                                <FontAwesomeIcon icon="fa-solid fa-earth-europe" />
                                                <span>Dimensions</span>
                                                <span className="tooltip" data-tip="Admin uniquement" data-place="top">
                                                    <FontAwesomeIcon icon="fa-solid fa-key" className="text-error" />
                                                </span>
                                            </a>
                                        </li>
                                    )}
                                    {User.is_admin && (
                                        <li>
                                            <a href="/admin/monde" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'admin-monde' ? 'bg-secondary text-secondary-content' : ''}`}>
                                                <FontAwesomeIcon icon="fa-solid fa-chart-simple" />
                                                <span>Statistiques du monde</span>
                                                <span className="tooltip" data-tip="Admin uniquement" data-place="top">
                                                    <FontAwesomeIcon icon="fa-solid fa-key" className="text-error" />
                                                </span>
                                            </a>
                                        </li>
                                    )}
                                    {User.is_moderateur && !User.is_admin && <hr className="my-2 border-base-300" />}
                                    {(User.is_admin || User.is_moderateur) && (
                                        <li>
                                            <a href="/admin/personnages" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'admin-personnages' ? 'bg-secondary text-secondary-content' : ''}`}>
                                                <FontAwesomeIcon icon="fa-solid fa-dna" />
                                                <span>Espèces et classes</span>
                                                <span className="tooltip" data-tip="Admins et modérateurs RP" data-place="top">
                                                    <FontAwesomeIcon icon="fa-solid fa-key" className="text-warning" />
                                                </span>
                                            </a>
                                        </li>
                                    )}
                                </>
                            ) : (
                                <>
                                    <li>
                                        <a href="/login" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'login' ? 'bg-secondary text-secondary-content' : ''}`}>
                                            <FontAwesomeIcon icon="right-to-bracket" />
                                            <span>Connexion</span>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/register" className={`justify-start flex-row gap-2 pr-5 pl-4 rounded-3xl ${active === 'register' ? 'bg-secondary text-secondary-content' : ''}`}>
                                            <FontAwesomeIcon icon="user-plus" />
                                            <span>Inscription</span>
                                        </a>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* <!-- Themes --> */}
                    <div className="dropdown dropdown-bottom dropdown-start tooltip tooltip-right" data-tip="Theme">
                        <div tabIndex="0" role="button" aria-label="Thème" className="btn bg-base-200 rounded-3xl btn-ghost">
                            <FontAwesomeIcon icon="fa-solid fa-palette" />
                            <span className="hidden lg:inline">Thème</span>
                        </div>
                        <ul tabIndex="-1" className={`dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mt-6 shadow-xl flex-col gap-1 ${DEROULANT_DEFILANT}`}>
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
                <div className="navbar-center hidden sm:flex items-center gap-1">
                    <a href='/' className="btn btn-ghost text-xl rounded-3xl">
                        <img
                            src="/images/logo/tetrago.svg"
                            alt="logo"
                            width={36}
                            height={36}
                        />
                        <span className="hidden sm:flex font-display text-2xl">Tetrago</span>
                    </a>
                    {/* Sections principales visibles sur grand écran ; le menu burger les garde toutes */}
                    <nav aria-label="Sections" className="hidden xl:flex items-center gap-1">
                        {DECOUVRIR.map((lien) => (
                            <a key={lien.id} href={lien.href} className={barItemClass(active === lien.id)}>
                                <FontAwesomeIcon icon={lien.icon} />
                                {lien.text}
                            </a>
                        ))}
                        <div className="dropdown dropdown-bottom dropdown-center">
                            <div tabIndex={0} role="button" aria-label="Monde" className={barItemClass(MONDE.some((lien) => lien.id === active))}>
                                <FontAwesomeIcon icon="fa-solid fa-earth-europe" />
                                Monde
                                <FontAwesomeIcon icon="fa-solid fa-chevron-down" className="text-xs opacity-70" />
                            </div>
                            <ul tabIndex="-1" className={`dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 mt-5 shadow-xl flex-col gap-1 w-52 ${DEROULANT_DEFILANT}`}>
                                {MONDE.map((lien) => <MenuLien key={lien.id} lien={lien} active={active} />)}
                            </ul>
                        </div>
                        <a href={CARTE.href} className={barItemClass(false)}>
                            <FontAwesomeIcon icon={CARTE.icon} />
                            {CARTE.text}
                        </a>
                    </nav>
                </div>
                <div className="navbar-end gap-2">
                    <RechercheGlobale />
                    {(ServerData && NetworkData ? (
                        <div className='flex gap-2'>
                            <div className='btn flex gap-2 items-center bg-base-200 btn-ghost rounded-3xl tooltip tooltip-left' data-tip='Actualiser' onClick={() => reloadComponent()}>
                                <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
                            </div>

                            {ServerData.online === true ?
                                <div className='btn btn-ghost flex gap-2 items-center bg-base-200 rounded-3xl' style={{ paddingLeft: "0px", paddingRight: "15px" }} onClick={() => setPlayerlist(!Playerlist)}>
                                    <div className='flex gap-2 items-center bg-accent' style={{ borderRadius: "20px", padding: "10px 15px", height: "36px" }}>
                                        <div className='flex text-accent-content'><FontAwesomeIcon icon="fa-regular fa-circle-check" /></div>
                                        <span className='hidden md:flex text-accent-content'>En ligne</span>
                                    </div>
                                    <div className='flex hidden sm:flex'><FontAwesomeIcon icon="fa-solid fa-people-group" /></div>
                                    <div className='flex gap-1 hidden sm:flex'>
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

            <div className='fixed top-20 left-3 right-3 w-auto z-990'>
                {Playerlist && <div id='servplayers' className='flex gap-5 items-center flex-col bg-base-200 shadow-lg' style={{ borderRadius: "20px", paddingTop: "1rem", margin: "0.5rem 1rem" }}>
                    <FontAwesomeIcon icon="fa-solid fa-people-group" />
                    <div id="playerslist" className='flex gap-10 items-center bg-base-200' style={{ padding: "10px 30px" }}>
                        {ServerData.players.now == 0 && <div id="list" className='flex items-center'>Il n'y a personne !</div>}
                        {ServerData.players.sample.map((player, index) => {
                            // console.log(player, index)
                            return (
                                <div key={index} className='flex flex-col gap-2 items-center' style={{ margin: "0 10px" }}>
                                    <img
                                        src={`https://starlightskins.lunareclipse.studio/render/${SRT[getRandomInt(SRTsize)]}/${player.name}/face/`}
                                        alt={`${player.name} head`}
                                        className='h-16'
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = `https://crafthead.net/avatar/${player.name}`;
                                        }}
                                    />
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