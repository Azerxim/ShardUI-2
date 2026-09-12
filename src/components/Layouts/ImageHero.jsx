import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ImageHero.css'

// Bannière type GrimoireHero mais avec une image de fond floutée au lieu du ciel étoilé.
export default function ImageHero({
    image,
    blur = 12,
    icon = 'fa-solid fa-scroll',
    iconColor = 'text-warning',
    title,
    description,
    children,
    topRight,
    className = 'mb-1 py-20 w-full',
}) {
    return (
        <section
            className={`image-hero rounded-3xl px-4 ${className}`}
            style={{
                '--image-hero-bg': image ? `url(${image})` : 'none',
                '--image-hero-blur': `${blur}px`,
            }}
        >
            <div className="image-hero-bg"></div>
            <div className="image-hero-overlay"></div>
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
