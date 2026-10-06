import { useCallback, useEffect, useState } from 'react';

import { getMesNotifications, marquerNotificationLue, marquerNotificationsLues } from '@/services/api';

// Notifications du joueur connecté (Notifications.jsx) : relevées toutes les minutes tant que la page est visible,
// au retour sur l'onglet, et à la demande (ouverture du panneau). Rien sans session.
const INTERVALLE_MS = 60_000;

export default function useNotifications(actif) {
    const [etat, setEtat] = useState({ chargees: false, nonLues: 0, liste: [] });

    const rafraichir = useCallback(() => {
        if (!actif) return Promise.resolve();
        return getMesNotifications()
            .then((data) => setEtat({ chargees: true, nonLues: data?.non_lues || 0, liste: data?.notifications || [] }))
            .catch(() => setEtat((avant) => ({ ...avant, chargees: true })));
    }, [actif]);

    useEffect(() => {
        if (!actif) return undefined;
        rafraichir();
        const minuterie = setInterval(() => { if (document.visibilityState === 'visible') rafraichir(); }, INTERVALLE_MS);
        const auRetour = () => { if (document.visibilityState === 'visible') rafraichir(); };
        document.addEventListener('visibilitychange', auRetour);
        return () => {
            clearInterval(minuterie);
            document.removeEventListener('visibilitychange', auRetour);
        };
    }, [actif, rafraichir]);

    const marquerLue = useCallback((id) => {
        setEtat((avant) => {
            const deja = avant.liste.find((n) => n.id === id)?.lue;
            return { ...avant, nonLues: deja ? avant.nonLues : Math.max(0, avant.nonLues - 1), liste: avant.liste.map((n) => (n.id === id ? { ...n, lue: true } : n)) };
        });
        return marquerNotificationLue(id).catch(() => { });
    }, []);

    const toutLire = useCallback(() => {
        setEtat((avant) => ({ ...avant, nonLues: 0, liste: avant.liste.map((n) => ({ ...n, lue: true })) }));
        return marquerNotificationsLues().catch(() => { });
    }, []);

    return { ...etat, rafraichir, marquerLue, toutLire };
}
