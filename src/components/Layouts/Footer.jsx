import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export default function Footer() {
    const year = new Date().getFullYear();
    let HTMLyear = `${year}`;
    if (year > 2025) {
        HTMLyear = `2025 - ${year}`;
    }
    return (
        <>
            <footer className="footer sm:footer-horizontal bg-base-200 text-base-content items-center p-4">
                <aside className="grid-flow-col items-center">
                    <img src="/images/logo/galaxie.png" alt="logo" width={24} height={24} />
                    <span className='flex items-center gap-1.5'>
                        <span>Spinelle Galaxie</span>
                        <FontAwesomeIcon icon="far fa-copyright" size="md" />
                        <span>{HTMLyear}</span>
                        <span>|</span>
                        <span>Tout droits réservés</span>
                    </span>
                </aside>
                <nav className="grid-flow-col gap-4 justify-self-end items-center">
                    <a href="https://discord.gg/nUFwE9S" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon="fa-brands fa-discord" size='xl' />
                    </a>
                    <a href="https://github.com/Azerxim" target="_blank" rel="noopener noreferrer">
                        <FontAwesomeIcon icon="fa-brands fa-github" size='xl' />
                    </a>
                </nav>
            </footer>
        </>
    );
}