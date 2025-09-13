import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Header() {
    const User = JSON.parse(localStorage.getItem('user'));
    return (
        <div className="navbar bg-base-200 shadow-sm">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-4 w-52 p-2 shadow">
                        <li><a href='/test'>Test</a></li>
                        {/* <li>
                            <a>Parent</a>
                            <ul className="p-2">
                                <li><a>Submenu 1</a></li>
                                <li><a>Submenu 2</a></li>
                            </ul>
                        </li>
                        <li><a>Item 3</a></li> */}
                    </ul>
                </div>
                <a href='/' className="btn btn-ghost text-xl">
                    <img src="/galaxie.png" alt="logo" width={24} height={24} />
                    <span>Tetrago</span>
                </a>
            </div>
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><a href='/test'>Test</a></li>
                    {/* <li>
                        <details>
                            <summary>Parent</summary>
                            <ul className="p-2">
                                <li><a>Submenu 1</a></li>
                                <li><a>Submenu 2</a></li>
                            </ul>
                        </details>
                    </li>
                    <li><a>Item 3</a></li> */}
                </ul>
            </div>
            <div className="navbar-end">
                {/* <button className="btn btn-ghost btn-circle">
                    <div className="indicator">
                        <FontAwesomeIcon icon="fa-solid fa-bell" style={{ width: "15px" }} />
                        <span className="badge badge-xs badge-primary indicator-item"></span>
                    </div>
                </button> */}
            </div>
            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                    {User ? (
                        <div className="w-10 rounded-full">
                            <img
                                alt="Profile Menu"
                                src={User.image_url || "profil_black.png"} />
                        </div>
                    ) : (
                        <FontAwesomeIcon icon="fa-solid fa-user" style={{ width: "15px" }} />
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
                        <li><a href='/login'>Connexion</a></li>
                    </>
                    )}
                </ul>
            </div>
        </div>
    );
}