import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// ===== Sommaire d'une fiche =====
// Barre collée sous la navigation du site : un raccourci par section de la page (titres TitleH2 et éléments marqués
// data-sommaire="Libellé"), la section en cours mise en évidence, et le retour en haut. Les sections sont relues quand la
// page change (chargements, sections qui apparaissent) ; les titres des modales sont ignorés. Rien sous deux sections.
// À placer directement dans le conteneur de la page (pour rester collé sur toute sa hauteur).

const NAVBAR_BAS = 88; // bas de la barre de navigation fixe du site (top-3 + hauteur), en pixels

// Décalage des ancres : navigation du site + sommaire
const decalage = (barre) => NAVBAR_BAS + (barre?.offsetHeight ?? 0) + 8;

const allerA = (id, barre) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - decalage(barre), behavior: 'smooth' });
    // Lien partageable vers la section, sans ajouter d'entrée à l'historique
    window.history.replaceState(null, '', `#${id}`);
};

const slug = (texte) => texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function SommaireFiche() {
    const barreRef = useRef(null);
    const listeRef = useRef(null);
    const [sections, setSections] = useState([]);
    const [active, setActive] = useState(null);
    const [haut, setHaut] = useState(false);
    // Lien reçu vers une section (#section-…) : suivi une fois, dès que la section existe
    const ancreRef = useRef(decodeURIComponent(window.location.hash.slice(1)));
    // Section choisie (clic, lien) : reste active jusqu'à un défilement par le visiteur, même si la page, trop courte en
    // bas, ne peut pas amener son titre sous le sommaire
    const choisieRef = useRef(null);

    useEffect(() => {
        const conteneur = barreRef.current?.parentElement;
        if (!conteneur) return undefined;
        let frame = null;

        const relire = () => {
            frame = null;
            const ids = new Set();
            const trouvees = [...conteneur.querySelectorAll('[data-sommaire]')]
                .filter((el) => !el.closest('dialog, .modal') && el.getClientRects().length > 0)
                .map((el) => {
                    const titre = (el.dataset.sommaire || el.textContent || '').trim();
                    if (!el.id) el.id = `section-${slug(titre) || 'sans-titre'}`;
                    // Deux sections au même titre : la seconde garde un id distinct
                    let id = el.id;
                    for (let n = 2; ids.has(id); n += 1) id = `${el.id}-${n}`;
                    el.id = id;
                    ids.add(id);
                    return { id, titre };
                })
                .filter((section) => section.titre);
            setSections((prev) => (JSON.stringify(prev) === JSON.stringify(trouvees) ? prev : trouvees));
        };
        const planifier = () => { if (frame === null) frame = requestAnimationFrame(relire); };

        relire();
        const observer = new MutationObserver(planifier);
        observer.observe(conteneur, { childList: true, subtree: true, characterData: true });
        return () => {
            observer.disconnect();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, []);

    // Section en cours : la section choisie, sinon la dernière dont le titre est passé sous le sommaire
    useEffect(() => {
        let frame = null;
        const suivre = () => {
            frame = null;
            const limite = decalage(barreRef.current) + 4;
            let courante = null;
            for (const { id } of sections) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= limite) courante = id;
            }
            setActive(choisieRef.current ?? courante);
            setHaut(window.scrollY > 400);
        };
        const planifier = () => { if (frame === null) frame = requestAnimationFrame(suivre); };
        const libere = (event) => {
            if (event.type === 'keydown' && !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
            choisieRef.current = null;
        };
        suivre();
        window.addEventListener('scroll', planifier, { passive: true });
        window.addEventListener('resize', planifier);
        for (const type of ['wheel', 'touchmove', 'keydown']) window.addEventListener(type, libere, { passive: true });
        return () => {
            window.removeEventListener('scroll', planifier);
            window.removeEventListener('resize', planifier);
            for (const type of ['wheel', 'touchmove', 'keydown']) window.removeEventListener(type, libere);
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, [sections]);

    const choisir = (id) => {
        choisieRef.current = id;
        setActive(id);
        allerA(id, barreRef.current);
    };

    // Le raccourci actif reste visible dans la barre (défilement horizontal seulement)
    useEffect(() => {
        const liste = listeRef.current;
        const bouton = active && liste?.querySelector(`[data-cible="${active}"]`);
        if (!bouton) return;
        const gauche = bouton.offsetLeft - liste.offsetLeft;
        if (gauche < liste.scrollLeft || gauche + bouton.offsetWidth > liste.scrollLeft + liste.clientWidth) {
            liste.scrollTo({ left: gauche - 16, behavior: 'smooth' });
        }
    }, [active]);

    useEffect(() => {
        if (ancreRef.current && sections.some((section) => section.id === ancreRef.current)) {
            const id = ancreRef.current;
            ancreRef.current = null;
            requestAnimationFrame(() => choisir(id));
        }
    }, [sections]);

    const remonter = () => {
        choisieRef.current = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    };

    return (
        <nav
            ref={barreRef}
            aria-label="Sommaire de la page"
            className={`sticky z-40 w-full ${sections.length < 2 ? 'hidden' : 'flex'} flex-row items-center gap-1 bg-base-100/90 backdrop-blur rounded-3xl shadow-sm p-1`}
            style={{ top: `${NAVBAR_BAS}px` }}
        >
            <div ref={listeRef} className="flex flex-row items-center gap-1 overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: 'thin' }}>
                {sections.map(({ id, titre }) => (
                    <button
                        key={id}
                        type="button"
                        data-cible={id}
                        onClick={() => choisir(id)}
                        aria-current={active === id ? 'location' : undefined}
                        className={`btn btn-sm rounded-3xl shrink-0 font-normal ${active === id ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        {titre}
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={remonter}
                aria-label="Haut de la page"
                className={`btn btn-sm btn-ghost btn-circle shrink-0 tooltip tooltip-left ${haut ? '' : 'invisible'}`}
                data-tip="Haut de la page"
            >
                <FontAwesomeIcon icon="fa-solid fa-arrow-up" />
            </button>
        </nav>
    );
}
