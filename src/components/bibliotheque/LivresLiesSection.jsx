import { useEffect, useState } from 'react';

import TitleH2 from '@/components/ui/TitleH2';
import JournalList from '@/components/bibliotheque/JournalList';
import EtagereLivres from '@/components/bibliotheque/EtagereLivres';
import { getJournauxOfEntite, getLivresOfEntite } from '@/services/api';
import { getSessionUser } from '@/services/session';

const SUPPORTS = {
    livre: { charger: getLivresOfEntite, titre: 'Livres', icon: 'fas fa-book', ancre: 'livres', Liste: ({ ecrits }) => <EtagereLivres books={ecrits} /> },
    // Journaux : mêmes cartes que la bibliothèque
    journal: { charger: getJournauxOfEntite, titre: 'Journaux', icon: 'fas fa-newspaper', ancre: 'journaux', Liste: ({ ecrits }) => <JournalList journaux={ecrits} /> },
};

// ===== Livres ou journaux liés à une civilisation, une religion, un commerce, une alliance, une guerre ou un personnage =====
// Liens posés depuis la fiche de l'écrit (LivreLiensSection). Un écrit privé n'apparaît que pour son auteur et les
// administrateurs. Rien n'est affiché tant qu'aucun écrit n'est lié.
export default function LivresLiesSection({ type, id, support = 'livre' }) {
    const user = getSessionUser();
    const conf = SUPPORTS[support];
    const [ecrits, setEcrits] = useState([]);

    useEffect(() => {
        let annule = false;
        conf.charger(type, id)
            .then((data) => { if (!annule) setEcrits((Array.isArray(data) ? data : []).map((item) => item[support])); })
            .catch(() => { if (!annule) setEcrits([]); });
        return () => { annule = true; };
    }, [conf, support, type, id]);

    const visibles = ecrits.filter((ecrit) => ecrit.is_public !== false || user?.is_admin || ecrit.user_id === user?.id);
    if (visibles.length === 0) return null;

    return (
        <section id={conf.ancre} className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text={conf.titre} icon={conf.icon} aide={support} />
            <conf.Liste ecrits={visibles} />
        </section>
    );
}
