import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function MapEmbedLocalisation({ dimension, x, z, zoom = 0, embed = 'civilisations', title = 'Carte', width = 300, height = 200, className = '', style = {}, onMove }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!onMove) return;

        const handleMessage = (event) => {
            if (event.data?.source !== "minedmap" || event.data?.type !== "move") return;
            if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;

            onMove({ x: event.data.x, z: event.data.z, zoom: event.data.zoom });
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [onMove]);

    if (!dimension || !dimension.link) {
        return (
            <div
                className={`skeleton rounded-2xl ${className}`}
                style={{ width, height, ...style }}
            ></div>
        );
    }

    return (
        <div className="relative inline-block" style={{ width, height }}>
            <iframe
                ref={iframeRef}
                src={`https://map.beta.tetrago.fr/${dimension.link}-locate-${embed}#x=${x}&z=${z}&zoom=${zoom}`}
                title={title}
                style={{ width, height, ...style }}
                className={`rounded-2xl ${className}`}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
            ></iframe>

            {/* Le centre de la carte correspond toujours aux coordonnées x/z : ce curseur fixe l'indique visuellement. */}
            <FontAwesomeIcon
                icon="fa-solid fa-location-crosshairs"
                className="absolute top-1/2 left-1/2 text-error drop-shadow pointer-events-none"
                style={{ transform: "translate(-50%, -50%)" }}
            />
        </div>
    );
}
