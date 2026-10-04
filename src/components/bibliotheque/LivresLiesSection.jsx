import { useEffect, useState } from 'react';

import TitleH2 from '@/components/ui/TitleH2';
import EtagereLivres from '@/components/bibliotheque/EtagereLivres';
import { getLivresOfEntite } from '@/services/api';
import { getSessionUser } from '@/services/session';

// ===== Livres liés à une religion, un commerce, une alliance ou un personnage =====
// Liens posés depuis la fiche du livre (LivreLiensSection). Un livre privé n'apparaît que pour son auteur et les
// administrateurs. Rien n'est affiché tant qu'aucun livre n'est lié.
export default function LivresLiesSection({ type, id }) {
    const user = getSessionUser();
    const [livres, setLivres] = useState([]);

    useEffect(() => {
        let annule = false;
        getLivresOfEntite(type, id)
            .then((data) => { if (!annule) setLivres((Array.isArray(data) ? data : []).map(({ livre }) => livre)); })
            .catch(() => { if (!annule) setLivres([]); });
        return () => { annule = true; };
    }, [type, id]);

    const visibles = livres.filter((livre) => livre.is_public !== false || user?.is_admin || livre.user_id === user?.id);
    if (visibles.length === 0) return null;

    return (
        <section id="livres" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Livres" icon="fas fa-book" aide="livre" />
            <EtagereLivres books={visibles} />
        </section>
    );
}
