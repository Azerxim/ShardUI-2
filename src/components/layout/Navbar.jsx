import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import '@/components/layout/Navbar.css';
import { syncSessionUser } from '@/services/session';
import { CARTE, DECOUVRIR, MONDE } from '@/config/navbar';
import NavbarLaunch from '@/components/layout/NavbarLaunch';
import RechercheGlobale from '@/components/layout/RechercheGlobale';
import { BoutonNotifications, ContenuNotifications } from '@/components/layout/Notifications';
import useNotifications from '@/components/layout/useNotifications';
import { ouvrirRecherche } from '@/utils/recherche';
import { lancementAVenir } from '@/config/saison';

// ===== Constantes =====
const link_network = 'https://mcapi.us/server/status?ip=spinelle-network.minesr.com';
const link_serv = 'https://mcapi.us/server/status?ip=mbu-tetrago.minesr.com';

// Sections du site (config/navbar.js) : menu latéral groupé, et liens visibles de la barre sur grand écran (xl)
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

const LienAdmin = ({ href, id, icon, text, active, moderateurs = false }) => (
    <li>
        <a href={href} className={menuItemClass(active === id)}>
            <FontAwesomeIcon icon={icon} />
            <span>{text}</span>
            <span className="tooltip" data-tip={moderateurs ? 'Admins et modérateurs RP' : 'Admin uniquement'} data-place="top">
                <FontAwesomeIcon icon="fa-solid fa-key" className={moderateurs ? 'text-warning' : 'text-error'} />
            </span>
        </a>
    </li>
);

// Thèmes DaisyUI proposés ; d'autres ont été essayés (winter, lemonade, night, dim, synthwave, aqua, coffee)
const THEMES = [
    { id: 'light', icon: 'fa-solid fa-sun', text: 'Clair' },
    { id: 'dark', icon: 'fa-solid fa-moon', text: 'Sombre' },
];

// ===== Panneaux latéraux =====
// Menu, compte et thème (à gauche), joueurs connectés (à droite) : masqués par défaut, ils glissent depuis le bord
// de leur bouton de la barre. Se ferment par la croix, un clic sur le voile, ou Échap. Rendus dans body, comme la
// modale de recherche.
function PanneauLateral({ id, label, ouvert, fermer, entete, cote = 'gauche', children }) {
    const fermerRef = useRef(null);

    useEffect(() => {
        if (!ouvert) return;
        fermerRef.current?.focus();
        // La page ne défile pas derrière le panneau ouvert
        const debordement = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const surTouche = (e) => { if (e.key === 'Escape') fermer(); };
        window.addEventListener('keydown', surTouche);
        return () => {
            document.body.style.overflow = debordement;
            window.removeEventListener('keydown', surTouche);
        };
    }, [ouvert, fermer]);

    return createPortal(
        <div className={`fixed inset-0 z-1000 ${ouvert ? '' : 'pointer-events-none'}`}>
            <div
                aria-hidden="true"
                onClick={fermer}
                className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${ouvert ? 'opacity-100' : 'opacity-0'}`}
            ></div>
            <aside
                id={id}
                aria-label={label}
                inert={!ouvert}
                className={`absolute top-3 bottom-3 w-72 max-w-[calc(100vw-1.5rem)] flex flex-col rounded-3xl bg-base-200 shadow-xl transition-transform duration-200 ease-out ${cote === 'droite' ? 'right-3' : 'left-3'} ${ouvert ? 'translate-x-0' : cote === 'droite' ? 'translate-x-[calc(100%+1rem)]' : '-translate-x-[calc(100%+1rem)]'}`}
            >
                <div className="flex items-center justify-between gap-2 p-2 pl-4">
                    {entete}
                    <button ref={fermerRef} type="button" onClick={fermer} aria-label="Fermer" className="btn btn-ghost btn-circle">
                        <FontAwesomeIcon icon="fa-solid fa-xmark" />
                    </button>
                </div>
                <ul className="menu w-full flex-1 min-h-0 flex-nowrap overflow-y-auto overscroll-contain p-2 pt-0 gap-1">
                    {children}
                </ul>
            </aside>
        </div>,
        document.body
    );
}

const TitrePanneau = ({ icon, text }) => (
    <span className="flex items-center gap-2 text-lg font-semibold whitespace-nowrap">
        <FontAwesomeIcon icon={icon} />
        {text}
    </span>
);

const EnteteMenu = (
    <a href="/" className="flex items-center gap-2">
        <img src="/images/logo/tetrago.svg" alt="" width={32} height={32} />
        <span className="font-display text-xl">Tetrago</span>
    </a>
);

function ContenuMenu({ active, User, fermer, nonLues, ouvrirNotifications }) {
    const rechercher = () => {
        fermer();
        ouvrirRecherche();
    };

    return (
        <>
            <MenuLien lien={{ id: 'home', href: '/', icon: 'fa-solid fa-house', text: 'Accueil' }} active={active} />
            {/* Sur téléphone, la loupe de la barre laisse sa place : la recherche s'ouvre d'ici */}
            <li className="sm:hidden">
                <button type="button" onClick={rechercher} className={menuItemClass(false)}>
                    <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                    <span>Rechercher</span>
                </button>
            </li>
            {/* De même pour la cloche des notifications */}
            {User && (
                <li className="sm:hidden">
                    <button type="button" onClick={() => { fermer(); ouvrirNotifications(); }} className={menuItemClass(false)}>
                        <FontAwesomeIcon icon="fa-solid fa-bell" />
                        <span>Notifications</span>
                        {nonLues > 0 && <span className="badge badge-error badge-sm" aria-label={`${nonLues} non lue${nonLues > 1 ? 's' : ''}`}>{nonLues > 99 ? '99+' : nonLues}</span>}
                    </button>
                </li>
            )}
            <li className="menu-title pt-3 pb-1">Découvrir</li>
            {DECOUVRIR.map((lien) => <MenuLien key={lien.id} lien={lien} active={active} />)}
            <MenuLien lien={{ ...CARTE, text: 'Cartographie' }} active={active} />
            <MenuLien lien={{ id: 'calendrier', href: '/calendrier', icon: 'fa-solid fa-calendar-days', text: 'Calendrier' }} active={active} />
            <MenuLien lien={{ id: 'chroniques', href: '/chroniques', icon: 'fa-solid fa-timeline', text: 'Chroniques' }} active={active} />
            <MenuLien lien={{ id: 'roadmap', href: '/roadmap', icon: 'fa-solid fa-route', text: 'Feuille de route' }} active={active} />
            <li className="menu-title pt-3 pb-1">Le monde</li>
            {MONDE.map((lien) => <MenuLien key={lien.id} lien={lien} active={active} />)}
            {(User?.is_admin || User?.is_moderateur) && <li className="menu-title pt-3 pb-1">Administration</li>}
            {User?.is_admin && (
                <>
                    <LienAdmin href="https://api.beta.tetrago.fr" id="api" icon="fa-solid fa-server" text="API" active={active} />
                    <LienAdmin href="/admin/dimensions" id="admin-dimensions" icon="fa-solid fa-earth-europe" text="Dimensions" active={active} />
                    <LienAdmin href="/admin/monde" id="admin-monde" icon="fa-solid fa-chart-simple" text="Statistiques du monde" active={active} />
                </>
            )}
            {(User?.is_admin || User?.is_moderateur) && (
                <>
                    <LienAdmin href="/moderation" id="moderation" icon="fa-solid fa-gavel" text="Tableau de bord RP" active={active} moderateurs />
                    <LienAdmin href="/admin/personnages" id="admin-personnages" icon="fa-solid fa-dna" text="Espèces et classes" active={active} moderateurs />
                </>
            )}
        </>
    );
}

function ContenuCompte({ active, User }) {
    if (!User) {
        return (
            <>
                <MenuLien lien={{ id: 'login', href: '/login', icon: 'right-to-bracket', text: 'Connexion' }} active={active} />
                <MenuLien lien={{ id: 'register', href: '/register', icon: 'user-plus', text: 'Inscription' }} active={active} />
            </>
        );
    }

    const deconnecter = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.reload();
    };

    return (
        <>
            <li className="px-4 pb-3">
                <div className="flex flex-col items-start gap-1 p-0 cursor-default pointer-events-none">
                    <i className="opacity-70">Connecté en tant que</i>
                    <b className="text-primary">{User.full_name || User.username}</b>
                </div>
            </li>
            <MenuLien lien={{ id: 'profil', href: '/profil', icon: 'fa-solid fa-user', text: 'Profil' }} active={active} />
            <li>
                <button type="button" onClick={deconnecter} className={`${menuItemClass(false)} hover:bg-error hover:text-error-content`}>
                    <FontAwesomeIcon icon="right-from-bracket" />
                    <span>Déconnexion</span>
                </button>
            </li>
            {User.is_admin && (
                <>
                    <li className="menu-title pt-3 pb-1">Administration</li>
                    <LienAdmin href="/users" id="users" icon="fa-solid fa-users" text="Utilisateurs" active={active} />
                </>
            )}
        </>
    );
}

function ContenuTheme({ theme, choisir }) {
    return THEMES.map((option) => (
        <li key={option.id}>
            <button type="button" aria-pressed={theme === option.id} onClick={() => choisir(option.id)} className={menuItemClass(theme === option.id)}>
                <FontAwesomeIcon icon={option.icon} />
                <span>{option.text}</span>
            </button>
        </li>
    ));
}

// Default Skin
const MHF = ["MHF_Steve", "MHF_Alex"];

// Skin Render Type
const SRT = ["default", "crouching", "crossed", "criss_cross", "cheering", "relaxing", "trudging", "cowering", "pointing", "lunging", "archer", "kicking", "ultimate"];

// Pose tirée du pseudo plutôt qu'au hasard : la même à chaque rendu, sans recharger l'image
const poseDuJoueur = (nom) => SRT[[...nom].reduce((somme, lettre) => somme + lettre.charCodeAt(0), 0) % SRT.length];

function ContenuJoueurs({ joueurs }) {
    if (joueurs.length === 0) {
        return <li className="px-4 py-2 opacity-70">Il n'y a personne !</li>;
    }
    return joueurs.map((joueur) => (
        <li key={joueur.id ?? joueur.name}>
            <div className="flex flex-row items-center gap-3 px-4 cursor-default pointer-events-none">
                <img
                    src={`https://starlightskins.lunareclipse.studio/render/${poseDuJoueur(joueur.name)}/${joueur.name}/face/`}
                    alt=""
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://crafthead.net/avatar/${joueur.name}`;
                    }}
                />
                <span>{joueur.name}</span>
            </div>
        </li>
    ));
}

export default function Navbar({ active = '' }) {
    // Barre allégée tant que VITE_SAISON_LANCEMENT annonce la saison à venir (config/saison.js)
    if (lancementAVenir()) return <NavbarLaunch active={active} />;
    return <NavbarSaison active={active} />;
}

function NavbarSaison({ active }) {
    // Server Statistics
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

    // Notifications du joueur connecté (cloche), relevées en arrière-plan
    const notifications = useNotifications(Boolean(User && localStorage.getItem('token')));
    const { rafraichir: rafraichirNotifications } = notifications;

    // Panneaux latéraux ('menu', 'compte', 'theme', 'notifications', 'joueurs' ou null) : à la fermeture, le focus revient au bouton qui l'a ouvert
    const [panneau, setPanneau] = useState(null);
    const boutonsRef = useRef({});
    const fermerPanneau = useCallback(() => {
        boutonsRef.current[panneau]?.focus();
        setPanneau(null);
    }, [panneau]);
    const ouvrirNotifications = () => {
        setPanneau('notifications');
        rafraichirNotifications();
    };
    const choisirTheme = (nouveau) => {
        updateTheme(nouveau);
        fermerPanneau();
    };

    const boutonPanneau = (cle, { tip, label, icon, text, textClass = 'hidden lg:inline' }) => (
        <div className="tooltip tooltip-right" data-tip={tip}>
            <button
                ref={(element) => { boutonsRef.current[cle] = element; }}
                type="button"
                aria-label={label}
                aria-expanded={panneau === cle}
                aria-controls={`panneau-${cle}`}
                onClick={() => setPanneau(cle)}
                className="btn bg-base-200 rounded-3xl btn-ghost"
            >
                <FontAwesomeIcon icon={icon} />
                <span className={textClass}>{text}</span>
            </button>
        </div>
    );

    // Render
    return (
        <>
            <PanneauLateral id="panneau-menu" label="Menu principal" ouvert={panneau === 'menu'} fermer={fermerPanneau} entete={EnteteMenu}>
                <ContenuMenu active={active} User={User} fermer={fermerPanneau} nonLues={notifications.nonLues} ouvrirNotifications={ouvrirNotifications} />
            </PanneauLateral>
            <PanneauLateral id="panneau-compte" label="Compte" ouvert={panneau === 'compte'} fermer={fermerPanneau} entete={<TitrePanneau icon={User ? 'fa-solid fa-user-check' : 'fa-solid fa-user-plus'} text={User ? 'Compte' : 'Connexion'} />}>
                <ContenuCompte active={active} User={User} />
            </PanneauLateral>
            <PanneauLateral id="panneau-theme" label="Thème" ouvert={panneau === 'theme'} fermer={fermerPanneau} entete={<TitrePanneau icon="fa-solid fa-palette" text="Thème" />}>
                <ContenuTheme theme={theme} choisir={choisirTheme} />
            </PanneauLateral>
            {User && (
                <PanneauLateral id="panneau-notifications" label="Notifications" cote="droite" ouvert={panneau === 'notifications'} fermer={fermerPanneau} entete={<TitrePanneau icon="fa-solid fa-bell" text="Notifications" />}>
                    <ContenuNotifications {...notifications} />
                </PanneauLateral>
            )}
            {ServerData?.online === true && (
                <PanneauLateral id="panneau-joueurs" label="Joueurs connectés" cote="droite" ouvert={panneau === 'joueurs'} fermer={fermerPanneau} entete={<TitrePanneau icon="fa-solid fa-people-group" text="Joueurs connectés" />}>
                    <ContenuJoueurs joueurs={ServerData.players?.sample ?? []} />
                </PanneauLateral>
            )}
            <div className="navbar fixed flex flex-row justify-between items-center gap-2 px-2 py-3 z-999 top-3 left-3 right-3 w-auto rounded-3xl bg-base-200 shadow-lg">
                <div className="navbar-start gap-2">
                    {boutonPanneau('menu', { tip: 'Menu', label: 'Menu', icon: 'fa-solid fa-bars-staggered', text: 'Menu', textClass: 'hidden lg:inline xl:hidden' })}
                    {boutonPanneau('compte', { tip: 'Profil', label: User ? 'Mon compte' : 'Connexion ou inscription', icon: User ? 'fa-solid fa-user-check' : 'fa-solid fa-user-plus', text: User ? 'Compte' : 'Connexion' })}
                    {boutonPanneau('theme', { tip: 'Thème', label: 'Thème', icon: 'fa-solid fa-palette', text: 'Thème' })}
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
                    {/* Sections principales visibles sur grand écran ; le menu latéral les garde toutes */}
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
                    {User && (
                        <BoutonNotifications
                            nonLues={notifications.nonLues}
                            ouvert={panneau === 'notifications'}
                            ouvrir={ouvrirNotifications}
                            boutonRef={(element) => { boutonsRef.current.notifications = element; }}
                        />
                    )}
                    <RechercheGlobale />
                    {(ServerData && NetworkData ? (
                        <div className='flex gap-2'>
                            <div className='btn flex gap-2 items-center bg-base-200 btn-ghost rounded-3xl tooltip tooltip-left' data-tip='Actualiser' onClick={() => reloadComponent()}>
                                <FontAwesomeIcon icon="fa-solid fa-rotate-right" />
                            </div>

                            {ServerData.online === true ?
                                <button
                                    ref={(element) => { boutonsRef.current.joueurs = element; }}
                                    type="button"
                                    aria-label="Joueurs connectés"
                                    aria-expanded={panneau === 'joueurs'}
                                    aria-controls="panneau-joueurs"
                                    onClick={() => setPanneau('joueurs')}
                                    className='btn btn-ghost flex gap-2 items-center bg-base-200 rounded-3xl'
                                    style={{ paddingLeft: "0px", paddingRight: "15px" }}
                                >
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
                                </button>
                                :
                                <div className='btn btn-ghost flex gap-2 items-center bg-base-200 rounded-3xl' style={{ padding: "0" }}>
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

        </>
    )
}