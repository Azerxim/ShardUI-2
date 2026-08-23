import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { version } from '../../../package.json'

export default function Footer() {
    const year = new Date().getFullYear();
    let HTMLyear = `${year}`;
    if (year > 2025) {
        HTMLyear = (<div className='flex flex-row gap-1'><span className='hidden sm:flex'>2025 - </span><span>{year}</span></div>);
    }
    return (
        <>
            <footer className="footer footer-horizontal bg-base-200 text-base-content items-center p-4 m-3 w-auto rounded-3xl">
                <aside className="grid-flow-col items-center">
                    <img src="/images/logo/galaxie.png" alt="logo" width={24} height={24} />
                    <span className='flex items-center gap-1.5'>
                        <span className='hidden md:flex'>Spinelle Galaxie</span>
                        <FontAwesomeIcon icon="far fa-copyright" size="md" />
                        <span className=''>{HTMLyear}</span>
                        <span className='hidden sm:flex'>|</span>
                        <span className='hidden sm:flex'>Tout droits réservés</span>
                    </span>
                </aside>
                <nav className="grid-flow-col gap-4 justify-self-end items-center">
                    {/* <!-- Saison --> */}
                    <div className="dropdown dropdown-top dropdown-start hidden sm:flex tooltip tooltip-left" data-tip="Saison">
                        <div tabIndex={0} role="button" className="btn bg-base-200 rounded-3xl btn-ghost">
                            <FontAwesomeIcon icon="fa-brands fa-stripe-s" />
                        </div>
                        <ul tabIndex="-1" className="dropdown-content menu bg-base-200 rounded-3xl z-1 p-2 m-1 mb-7 shadow-xl flex-col gap-1">
                            <li>
                                <a href="/" className={`justify-start flex-row gap-1 nowrap pr-5 pl-4 rounded-box rounded-3xl bg-secondary text-secondary-content`}>
                                    <span>Saison</span>
                                    <span>3</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://s2.tetgrago.fr/rp" className={`justify-start flex-row gap-1 nowrap pr-5 pl-4 rounded-box rounded-3xl`}>
                                    <span>Saison</span>
                                    <span>2</span>
                                </a>
                            </li>
                            <li>
                                <a href="https://s1.tetgrago.fr/" className={`justify-start flex-row gap-1 nowrap pr-5 pl-4 rounded-box rounded-3xl`}>
                                    <span>Saison</span>
                                    <span>1</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <p className="text-sm text-gray-400"><i>ShardUI</i> v{version}</p>
                    <a href="https://discord.gg/nUFwE9S" target="_blank" rel="noopener noreferrer" className="tooltip tooltip-left" data-tip="Rejoindre le Discord">
                        <FontAwesomeIcon icon="fa-brands fa-discord" size='xl' />
                    </a>
                    <a href="https://github.com/Azerxim/ShardUI-2" target="_blank" rel="noopener noreferrer" className="tooltip tooltip-left" data-tip="Voir le code source sur GitHub">
                        <FontAwesomeIcon icon="fa-brands fa-github" size='xl' />
                    </a>
                </nav>
            </footer>
        </>
    );
}