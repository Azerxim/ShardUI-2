import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './GrimoireHero.css'

// Bannière étoilée façon grimoire, réutilisée par les pages qui partagent
// l'identité visuelle de l'accueil (fond animé + icône + titre + description).
export default function GrimoireHero({
    icon = 'fa-solid fa-scroll',
    iconColor = 'text-warning',
    title,
    description,
    children,
    topRight,
    className = 'mb-1 py-20 w-full',
}) {
    return (
        <section className={`grimoire-hero rounded-3xl px-4 ${className}`}>
            <div className="grimoire-stars"></div>
            <div className="grimoire-stars2"></div>
            <div className="grimoire-stars3"></div>
            {topRight && (
                <div className="absolute top-4 right-4 z-10">
                    {topRight}
                </div>
            )}
            <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-5 text-neutral-content">
                {icon && <FontAwesomeIcon icon={icon} size="3x" className={iconColor} />}
                {title && <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>}
                {description && <p className="text-lg opacity-90">{description}</p>}
                {children}
            </div>
        </section>
    );
}
