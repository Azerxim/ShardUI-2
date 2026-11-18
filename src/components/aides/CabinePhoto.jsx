import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Outil from '@/components/aides/Outil';
import { minecraftSkin } from '@/utils/personnages';

// ===== Cabine photo =====
// Un skin Minecraft (compte ou fichier PNG) rendu en 3D, sans animation : la tête seule et le corps entier, de face.
// On les fait pivoter à la souris (ou avec les orientations proposées), puis on les exporte en PNG, fond transparent
// ou coloré, à la taille choisie. Tout se passe dans le navigateur : le fichier n'est envoyé nulle part.
// skinview3d (three.js) n'est chargé qu'au premier skin affiché, pas à l'ouverture de la page des aides.

const chargerSkinview = () => import('skinview3d');

// Cadrages : la tête seule (le modèle descend de 12 pour que la caméra tourne autour de la tête) ou le corps entier.
// Le zoom est celui de skinview3d (distance de la caméra calculée d'après le champ de vision).
const CADRAGES = {
    tete: { titre: 'Tête', largeur: 240, hauteur: 240, zoom: 2.4, decalage: -12, membres: false },
    corps: { titre: 'Corps entier', largeur: 240, hauteur: 360, zoom: 0.85, decalage: 0, membres: true },
};
const CHAMP_DE_VISION = 30; // étroit : peu de perspective, un rendu proche d'une vue « à plat »

const ORIENTATIONS = [
    { id: 'face', label: 'Face', angle: 0 },
    { id: 'trois-quarts', label: 'Trois-quarts', angle: Math.PI / 4 },
    { id: 'profil', label: 'Profil', angle: Math.PI / 2 },
    { id: 'dos', label: 'Dos', angle: Math.PI },
];

const MODELES = [
    { value: 'auto-detect', label: 'Automatique' },
    { value: 'default', label: 'Larges (Steve)' },
    { value: 'slim', label: 'Fins (Alex)' },
];

const TAILLES = [512, 1024, 2048];

const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const PSEUDO = /^\w{3,16}$/;

// Damier sous un fond transparent, pour voir ce qui sera vide dans le PNG
const DAMIER = {
    backgroundImage: 'conic-gradient(rgb(127 127 127 / 0.18) 25%, transparent 0 50%, rgb(127 127 127 / 0.18) 0 75%, transparent 0)',
    backgroundSize: '16px 16px',
};

function chargerImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous'; // sans quoi le canvas WebGL refuserait la texture
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image introuvable ou illisible.'));
        image.src = url;
    });
}

// Formats lus par skinview3d : carré (64 × 64, ou HD) ou ancien format deux fois plus large que haut (64 × 32)
const skinValide = (image) => image.width >= 64 && image.width % 64 === 0 && (image.height === image.width || image.height * 2 === image.width);

const nomDeFichier = (texte) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'skin';

function telecharger(blob, nom) {
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Une vue 3D : crée son SkinViewer au montage, applique skin, bras et fond, et expose orienter() et exporter()
function VueSkin({ ref, cadrage, image, modele, fond, nom }) {
    const canvasRef = useRef(null);
    const viewerRef = useRef(null);
    const [etat, setEtat] = useState('chargement'); // chargement | pret | erreur
    const config = CADRAGES[cadrage];

    useEffect(() => {
        let annule = false;
        let viewer = null;
        let observateur = null;
        const { largeur, hauteur, zoom, decalage } = CADRAGES[cadrage];
        chargerSkinview()
            .then((skinview3d) => {
                if (annule || !canvasRef.current) return;
                viewer = new skinview3d.SkinViewer({
                    canvas: canvasRef.current,
                    width: largeur,
                    height: hauteur,
                    fov: CHAMP_DE_VISION,
                    zoom,
                    // Garde l'image affichée lisible après le rendu, pour l'export
                    preserveDrawingBuffer: true,
                });
                viewer.controls.enablePan = false;
                viewer.playerWrapper.position.y = decalage;
                viewerRef.current = viewer;
                // Onglet fermé ou vue hors de l'écran : plus de rendu en continu
                observateur = new IntersectionObserver(([entree]) => { viewer.renderPaused = !entree.isIntersecting; });
                observateur.observe(canvasRef.current);
                setEtat('pret');
            })
            .catch((error) => {
                console.warn('Cabine photo : rendu 3D indisponible', error);
                if (!annule) setEtat('erreur');
            });
        return () => {
            annule = true;
            observateur?.disconnect();
            viewer?.dispose();
            viewerRef.current = null;
        };
    }, [cadrage]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (etat !== 'pret' || !viewer) return;
        viewer.loadSkin(image, { model: modele });
        const { skin } = viewer.playerObject;
        for (const partie of [skin.body, skin.leftArm, skin.rightArm, skin.leftLeg, skin.rightLeg]) partie.visible = CADRAGES[cadrage].membres;
    }, [etat, image, modele, cadrage]);

    useEffect(() => {
        if (etat === 'pret' && viewerRef.current) viewerRef.current.background = fond;
    }, [etat, fond]);

    useImperativeHandle(ref, () => ({
        // Replace la caméra à hauteur du modèle, à sa distance de départ, puis la fait tourner de l'angle donné
        orienter(angle) {
            const viewer = viewerRef.current;
            if (!viewer) return;
            viewer.resetCameraPose();
            const distance = viewer.camera.position.length();
            viewer.camera.position.set(Math.sin(angle) * distance, 0, Math.cos(angle) * distance);
            viewer.controls.update();
        },
        // Rendu à la largeur demandée (en pixels) : on relève le pixelRatio le temps d'une image, la mise en page ne bouge pas
        async exporter(largeurPx) {
            const viewer = viewerRef.current;
            if (!viewer) return null;
            const ancien = viewer.pixelRatio;
            viewer.pixelRatio = largeurPx / CADRAGES[cadrage].largeur;
            viewer.render();
            const blob = await new Promise((resolve) => viewer.canvas.toBlob(resolve, 'image/png'));
            viewer.pixelRatio = ancien;
            return blob;
        },
    }), [cadrage]);

    return (
        <figure className="flex flex-col items-center gap-2">
            <div
                className="relative rounded-2xl overflow-hidden bg-base-100"
                style={{ width: config.largeur, height: config.hauteur, ...(fond ? {} : DAMIER) }}
            >
                {etat === 'chargement' ? <div className="skeleton absolute inset-0 rounded-2xl" aria-hidden="true" /> : null}
                {etat === 'erreur' ? (
                    <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm opacity-80">
                        Le rendu 3D n'est pas disponible dans ce navigateur (WebGL désactivé ?).
                    </p>
                ) : null}
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={`${config.titre} du skin ${nom} en 3D`}
                    className={`cursor-grab active:cursor-grabbing touch-none ${etat === 'pret' ? '' : 'invisible'}`}
                />
            </div>
            <figcaption className="text-sm font-semibold">{config.titre}</figcaption>
        </figure>
    );
}

export default function CabinePhoto() {
    const [saisie, setSaisie] = useState('');
    const [skin, setSkin] = useState(null); // { image, nom }
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState(null);
    const [modele, setModele] = useState('auto-detect');
    const [transparent, setTransparent] = useState(true);
    const [couleur, setCouleur] = useState('#3b4252');
    const [taille, setTaille] = useState(1024);
    const [enExport, setExport] = useState(null); // vue en cours d'export : tete | corps | tous
    const vues = { tete: useRef(null), corps: useRef(null) };
    const fichierRef = useRef(null);

    const charger = async (url, nom) => {
        setChargement(true);
        setErreur(null);
        try {
            const image = await chargerImage(url);
            if (!skinValide(image)) throw new Error(`Ce n'est pas un skin Minecraft : l'image fait ${image.width} × ${image.height} pixels, il faut du 64 × 64 (ou 64 × 32).`);
            setSkin({ image, nom });
        } catch (error) {
            setErreur(error.message);
        } finally {
            setChargement(false);
        }
    };

    const chargerCompte = (event) => {
        event.preventDefault();
        const valeur = saisie.trim();
        if (!UUID.test(valeur) && !PSEUDO.test(valeur)) {
            setErreur('Saisissez un UUID Minecraft (avec ou sans tirets) ou un pseudo (3 à 16 lettres, chiffres ou _).');
            return;
        }
        const identifiant = UUID.test(valeur) ? valeur.replaceAll('-', '') : valeur;
        charger(minecraftSkin(identifiant), UUID.test(valeur) ? identifiant.slice(0, 8) : valeur);
    };

    const chargerFichier = async (event) => {
        const fichier = event.target.files?.[0];
        if (!fichier) return;
        // Lu sur place : l'image décodée reste utilisable une fois l'adresse temporaire libérée
        const url = URL.createObjectURL(fichier);
        await charger(url, fichier.name.replace(/\.[^.]+$/, ''));
        URL.revokeObjectURL(url);
        if (fichierRef.current) fichierRef.current.value = ''; // permet de rechoisir le même fichier
    };

    const orienter = (angle) => {
        vues.tete.current?.orienter(angle);
        vues.corps.current?.orienter(angle);
    };

    const exporter = async (quoi) => {
        setExport(quoi);
        try {
            for (const cadrage of quoi === 'tous' ? ['tete', 'corps'] : [quoi]) {
                const blob = await vues[cadrage].current?.exporter(taille);
                if (blob) telecharger(blob, `${nomDeFichier(skin.nom)}-${cadrage}-${taille}px.png`);
            }
        } finally {
            setExport(null);
        }
    };

    const fond = transparent ? null : couleur;

    return (
        <Outil
            id="cabine-photo"
            icon="fa-solid fa-camera"
            titre="Cabine photo"
            texte="Le portrait 3D d'un skin Minecraft, tête et corps entier : faites-les pivoter, puis enregistrez-les en PNG pour vos fiches, bannières ou messages."
        >
            <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                <form onSubmit={chargerCompte} className="flex flex-col gap-1 flex-1 min-w-0">
                    <label htmlFor="cabine-compte" className="text-xs font-semibold opacity-70">UUID ou pseudo Minecraft</label>
                    <div className="join w-full">
                        <input
                            id="cabine-compte"
                            type="text"
                            value={saisie}
                            onChange={(e) => setSaisie(e.target.value)}
                            placeholder="069a79f4-44e9-4726-a5be-fca90e38aaf5"
                            autoComplete="off"
                            spellCheck={false}
                            className="input input-ghost bg-base-100 join-item flex-1 min-w-0 font-mono text-sm"
                        />
                        <button type="submit" className="btn btn-primary join-item" disabled={chargement || !saisie.trim()}>
                            <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                            Charger
                        </button>
                    </div>
                </form>
                <span className="text-sm opacity-60 lg:pb-3 text-center">ou</span>
                <label className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-xs font-semibold opacity-70">Fichier de skin (PNG)</span>
                    <input ref={fichierRef} type="file" accept="image/png" onChange={chargerFichier} disabled={chargement} className="file-input file-input-ghost bg-base-100 w-full" />
                </label>
            </div>

            {erreur ? (
                <div role="alert" className="alert alert-error alert-soft text-sm">
                    <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
                    <span>{erreur}</span>
                </div>
            ) : null}

            {chargement && !skin ? <span className="loading loading-dots loading-md self-center" aria-label="Chargement du skin"></span> : null}

            {skin ? (
                <>
                    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold opacity-70">Orientation</span>
                            <div className="join">
                                {ORIENTATIONS.map((orientation) => (
                                    <button key={orientation.id} type="button" className="btn btn-sm join-item" onClick={() => orienter(orientation.angle)}>
                                        {orientation.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold opacity-70">Bras</span>
                            <select value={modele} onChange={(e) => setModele(e.target.value)} className="select select-sm select-ghost bg-base-100">
                                {MODELES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </label>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold opacity-70">Fond</span>
                            <div className="flex items-center gap-2 h-8">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" className="toggle toggle-sm" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
                                    Transparent
                                </label>
                                {!transparent ? (
                                    <input type="color" value={couleur} onChange={(e) => setCouleur(e.target.value)} aria-label="Couleur du fond" className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                                ) : null}
                            </div>
                        </div>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-semibold opacity-70">Largeur du PNG</span>
                            <select value={taille} onChange={(e) => setTaille(Number(e.target.value))} className="select select-sm select-ghost bg-base-100">
                                {TAILLES.map((valeur) => <option key={valeur} value={valeur}>{valeur} px</option>)}
                            </select>
                        </label>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        {Object.keys(CADRAGES).map((cadrage) => (
                            <div key={cadrage} className="flex flex-col items-center gap-2">
                                <VueSkin ref={vues[cadrage]} cadrage={cadrage} image={skin.image} modele={modele} fond={fond} nom={skin.nom} />
                                <button type="button" className="btn btn-sm btn-outline" onClick={() => exporter(cadrage)} disabled={enExport !== null}>
                                    {enExport === cadrage ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon="fa-solid fa-download" />}
                                    Exporter
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs opacity-60">
                            Faites glisser une vue pour la tourner, la molette zoome. Un pseudo inconnu donne le skin par défaut. Le fichier choisi reste sur votre appareil.
                        </p>
                        <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => exporter('tous')} disabled={enExport !== null}>
                            {enExport === 'tous' ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon="fa-solid fa-images" />}
                            Exporter les deux
                        </button>
                    </div>
                </>
            ) : null}
        </Outil>
    );
}
