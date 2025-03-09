import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Image from "next/image"

export default function Footer() {
  return (
    <>
        <footer className="footer sm:footer-horizontal bg-base-200 text-base-content items-center p-4">
            <aside className="grid-flow-col items-center">
                <Image src="/galaxie.png" alt="logo" width={24} height={24} />
                <span className='flex items-center gap-1'>
                    Spinelle Galaxie
                    <div style={{ width: "14px" }}>
                        <FontAwesomeIcon icon="far fa-copyright" size="2xs" />
                    </div>
                    {new Date().getFullYear()} - Tout droits réservés
                </span>
            </aside>
            <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end items-center">
                <a href="https://discord.gg/nUFwE9S" target="_blank" rel="noopener noreferrer" style={{ width: "24px" }}>
                    <FontAwesomeIcon icon="fa-brands fa-discord" />
                </a>
                <a href="https://github.com/Azerxim" target="_blank" rel="noopener noreferrer" style={{ width: "24px" }}>
                    <FontAwesomeIcon icon="fa-brands fa-github" size="2xs" />
                </a>
            </nav>
        </footer>
    </>
  );
}