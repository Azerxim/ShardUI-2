import { MAPS_BASE_URL } from "@/config/maps";

// ref : l'iframe, pour lui envoyer des données par postMessage (troupes d'une guerre, voir GuerrePage)
export default function MapEmbed({ ref = null, dimension, x, z, zoom = 0, embed = 'civilisations', title = 'Carte', width = 300, height = 200, className = '', style = {} }) {
    if (!dimension || !dimension.link) {
        return (
            <div
                className={`skeleton rounded-2xl ${className}`}
                style={{ width, height, ...style }}
            ></div>
        );
    }

    return (
        <iframe
            ref={ref}
            src={`${MAPS_BASE_URL}/${dimension.link}-embedfull-${embed}#x=${x}&z=${z}&zoom=${zoom}`}
            title={title}
            style={{ width, height, ...style }}
            className={`rounded-2xl ${className}`}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
        ></iframe>
    );
}
