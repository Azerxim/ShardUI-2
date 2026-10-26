import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Outil from '@/components/aides/Outil';
import CopyButton from '@/components/ui/CopyButton';
import EtatVide from '@/components/ui/EtatVide';
import { getSessionUser } from '@/services/session';
import { getPersonnagesOfUser } from '@/services/api';
import { ficheDiscord } from '@/utils/aides';
import { LIMITE_DISCORD } from '@/config/aides';

// Fiche d'un de ses personnages à copier pour Discord (utils/aides.js : ficheDiscord)
export default function FicheDiscord() {
    const user = getSessionUser();
    const userId = user?.id;
    const [fiches, setFiches] = useState(null);
    const [choix, setChoix] = useState('');

    useEffect(() => {
        if (!userId) return;
        getPersonnagesOfUser(userId)
            .then((liste) => {
                const valides = Array.isArray(liste) ? liste : [];
                setFiches(valides);
                if (valides.length) setChoix(String(valides[0].personnage.id));
            })
            .catch(() => setFiches([]));
    }, [userId]);

    const fiche = fiches?.find((item) => String(item.personnage.id) === choix);
    const texte = fiche ? ficheDiscord(fiche) : '';

    let contenu;
    if (!user) {
        contenu = <EtatVide icon="fa-solid fa-right-to-bracket" texte="Connectez-vous pour copier la fiche de vos personnages." action={{ label: 'Se connecter', icon: 'fa-solid fa-right-to-bracket', href: '/login' }} />;
    } else if (fiches === null) {
        contenu = <span className="loading loading-dots loading-md self-center" aria-label="Chargement des personnages"></span>;
    } else if (!fiches.length) {
        contenu = <EtatVide icon="fa-solid fa-masks-theater" texte="Vous n'avez pas encore de personnage." aide="Créez-le d'abord : sa fiche se copiera ensuite d'ici." action={{ label: 'Créer un personnage', icon: 'fa-solid fa-plus', href: '/personnages' }} />;
    } else {
        contenu = (
            <>
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <label className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-xs font-semibold opacity-70">Personnage</span>
                        <select value={choix} onChange={(e) => setChoix(e.target.value)} className="select select-ghost bg-base-100 w-full">
                            {fiches.map((item) => <option key={item.personnage.id} value={String(item.personnage.id)}>{item.personnage.name}</option>)}
                        </select>
                    </label>
                    <CopyButton
                        text="Copier la fiche"
                        icon={<FontAwesomeIcon icon="fa-solid fa-copy" />}
                        textCopy={texte}
                        classes="btn btn-primary"
                        style={{}}
                        tooltip={{ text: 'À coller dans un message Discord', position: 'top' }}
                    />
                </div>
                <pre aria-label="Aperçu de la fiche" className="bg-base-100 rounded-2xl p-4 text-sm whitespace-pre-wrap break-words max-h-96 overflow-y-auto">{texte}</pre>
                <p className="text-xs opacity-60">{texte.length} / {LIMITE_DISCORD} caractères. Pour changer la fiche, modifiez le personnage sur le site.</p>
            </>
        );
    }

    return (
        <Outil
            id="fiche-discord"
            icon="fa-brands fa-discord"
            titre="Fiche de personnage pour Discord"
            texte="Présentez votre personnage sur le Discord : la fiche est mise en forme pour un message, avec le lien vers sa page."
        >
            {contenu}
        </Outil>
    );
}
