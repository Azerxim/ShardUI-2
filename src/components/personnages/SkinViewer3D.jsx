import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const LARGEUR = 220;
const HAUTEUR = 300;

// Skin Minecraft en 3D (skinview3d, sur three.js) : on le fait tourner à la souris ou au doigt, la molette zoome.
// La bibliothèque est chargée à la demande pour ne pas alourdir le reste du site. Sans WebGL, ou si la texture ne se
// charge pas (lien externe qui refuse le CORS, fichier invalide), on affiche le rendu de repli à la place.
// Pour changer de skin, remonter le composant (key={skinUrl}) : l'état de chargement repart ainsi de zéro.
export default function SkinViewer3D({ skinUrl, nom, repli = null }) {
    const canvasRef = useRef(null);
    const viewerRef = useRef(null);
    const [etat, setEtat] = useState("chargement"); // chargement | pret | erreur
    const [enMouvement, setEnMouvement] = useState(() => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

    useEffect(() => {
        let annule = false;
        let viewer = null;

        import("skinview3d")
            .then(async (skinview3d) => {
                if (annule || !canvasRef.current) return;
                viewer = new skinview3d.SkinViewer({
                    canvas: canvasRef.current,
                    width: LARGEUR,
                    height: HAUTEUR,
                    zoom: 0.85,
                    fov: 45,
                });
                viewerRef.current = viewer;
                viewer.controls.enablePan = false;
                viewer.autoRotateSpeed = 1.2;
                viewer.animation = new skinview3d.IdleAnimation();
                viewer.playerObject.rotation.y = -0.5;
                // Bras fins (Alex) ou larges (Steve) devinés d'après la texture
                await viewer.loadSkin(skinUrl, { model: "auto-detect" });
                if (!annule) setEtat("pret");
            })
            .catch((error) => {
                console.warn("Skin 3D indisponible :", error);
                if (!annule) setEtat("erreur");
            });

        return () => {
            annule = true;
            viewer?.dispose();
            viewerRef.current = null;
        };
    }, [skinUrl]);

    // Rotation automatique et animation de repos, coupées si l'utilisateur préfère moins de mouvement
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || etat !== "pret") return;
        viewer.autoRotate = enMouvement;
        if (viewer.animation) viewer.animation.paused = !enMouvement;
    }, [enMouvement, etat]);

    if (etat === "erreur") return repli;

    return (
        <figure className="relative flex flex-col items-center gap-1">
            <div className="relative bg-base-200 rounded-2xl overflow-hidden" style={{ width: LARGEUR, height: HAUTEUR }}>
                {etat === "chargement" ? <div className="skeleton absolute inset-0 rounded-2xl" aria-hidden="true" /> : null}
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={`Skin Minecraft de ${nom} en 3D`}
                    className={`cursor-grab active:cursor-grabbing touch-none transition-opacity ${etat === "pret" ? "opacity-100" : "opacity-0"}`}
                />
                {etat === "pret" ? (
                    <button
                        type="button"
                        className="btn btn-xs btn-circle btn-ghost absolute top-2 right-2 bg-base-100/70"
                        onClick={() => setEnMouvement((valeur) => !valeur)}
                        title={enMouvement ? "Arrêter la rotation" : "Faire tourner"}
                        aria-label={enMouvement ? "Arrêter la rotation" : "Faire tourner"}
                        aria-pressed={enMouvement}
                    >
                        <FontAwesomeIcon icon={enMouvement ? "fa-solid fa-pause" : "fa-solid fa-play"} />
                    </button>
                ) : null}
            </div>
            <figcaption className="text-xs opacity-70">Faites-le glisser pour le tourner, zoomez à la molette.</figcaption>
        </figure>
    );
}
