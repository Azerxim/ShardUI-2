import { Fragment, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { SECTIONS } from '@/config/navbar';

// ===== Barre des sections =====
// Sous le bandeau des pages de liste : les sections du site sur une seule ligne, groupées (Découvrir, Le monde).
// Quand elles ne tiennent pas (téléphone, tablette), la ligne défile horizontalement : flèches et fondu sur les bords
// signalent la suite, et la section active est amenée au centre à l'ouverture de la page.
export default function DynamicNavbar({ active_id = '' }) {
    const defilementRef = useRef(null);
    const [bords, setBords] = useState({ gauche: false, droite: false });

    const mettreAJourBords = () => {
        const element = defilementRef.current;
        if (!element) return;
        setBords({
            gauche: element.scrollLeft > 4,
            droite: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
        });
    };

    useEffect(() => {
        const element = defilementRef.current;
        const actif = element?.querySelector('[aria-current="page"]');
        // scrollLeft plutôt que scrollIntoView : la page ne doit pas défiler verticalement
        if (actif) element.scrollLeft = actif.offsetLeft - (element.clientWidth - actif.offsetWidth) / 2;
        mettreAJourBords();
        window.addEventListener('resize', mettreAJourBords);
        return () => window.removeEventListener('resize', mettreAJourBords);
    }, [active_id]);

    const defiler = (sens) => defilementRef.current?.scrollBy({ left: sens * defilementRef.current.clientWidth * 0.7, behavior: 'smooth' });

    const fleche = (sens) => (
        <button
            type="button"
            onClick={() => defiler(sens)}
            aria-label={sens < 0 ? 'Sections précédentes' : 'Sections suivantes'}
            className={`absolute top-0 bottom-0 z-10 w-12 flex items-center ${sens < 0 ? 'left-0 justify-start pl-3 rounded-l-3xl bg-linear-to-r' : 'right-0 justify-end pr-3 rounded-r-3xl bg-linear-to-l'} from-base-200 from-50% to-transparent`}
        >
            <FontAwesomeIcon icon={sens < 0 ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right'} />
        </button>
    );

    return (
        <nav aria-label="Sections du site" className="relative w-full bg-base-200 rounded-3xl shadow-md mb-1">
            {bords.gauche && fleche(-1)}
            <div
                ref={defilementRef}
                onScroll={mettreAJourBords}
                className="flex items-center gap-0.5 overflow-x-auto px-2 py-2 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {SECTIONS.map((groupe, index) => (
                    <Fragment key={groupe.id}>
                        {index > 0 && <span aria-hidden="true" className="w-px self-stretch bg-base-300 mx-1 shrink-0"></span>}
                        <span className="hidden 2xl:inline text-xs uppercase tracking-wide opacity-50 px-2 shrink-0">{groupe.titre}</span>
                        {groupe.liens.map((lien) => {
                            const actif = active_id === lien.id;
                            return (
                                <a
                                    key={lien.id}
                                    href={lien.href}
                                    aria-current={actif ? 'page' : undefined}
                                    className={`btn btn-ghost btn-sm rounded-3xl gap-2 px-2.5 shrink-0 snap-start ${actif ? 'bg-secondary text-secondary-content' : ''}`}
                                >
                                    <FontAwesomeIcon icon={lien.icon} />
                                    {lien.text}
                                </a>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
            {bords.droite && fleche(1)}
        </nav>
    );
}
