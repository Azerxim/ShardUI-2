import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
    getAlliances, getCivilisations, getCommerces, getGuerres, getJournaux, getLivres,
    getPersonnages, getQuartiers, getReligions, getVilles,
} from '@/services/api';
import { getSessionUser } from '@/services/session';
import { villeHref } from '@/utils/personnages';
import { EVENEMENT_OUVRIR_RECHERCHE } from '@/utils/recherche';

// ===== Recherche globale (Ctrl+K) =====
// Un seul champ pour retrouver une civilisation, une ville, un personnage, un livre…
// Les listes sont chargées à la première ouverture, puis gardées pour la durée de la page.
// Les éléments privés restent masqués, sauf pour leurs membres et les administrateurs (comme sur les listes).

const MAX_PAR_TYPE = 6;

const TYPES = {
    civilisation: { label: 'Civilisations', icon: 'fa-solid fa-flag' },
    ville: { label: 'Villes', icon: 'fa-solid fa-city' },
    quartier: { label: 'Quartiers', icon: 'fa-solid fa-map-location-dot' },
    personnage: { label: 'Personnages', icon: 'fa-solid fa-masks-theater' },
    religion: { label: 'Religions', icon: 'fa-solid fa-place-of-worship' },
    commerce: { label: 'Commerces', icon: 'fa-solid fa-shop' },
    alliance: { label: 'Alliances', icon: 'fa-solid fa-handshake' },
    guerre: { label: 'Guerres', icon: 'fa-solid fa-shield-halved' },
    livre: { label: 'Livres', icon: 'fa-solid fa-book' },
    journal: { label: 'Journaux', icon: 'fa-solid fa-newspaper' },
};

// Minuscules sans accents : « Elarion » se trouve en tapant « élar »
const normaliser = (texte) => (texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const liste = (promesse) => promesse.then((data) => (Array.isArray(data) ? data : [])).catch(() => []);

let indexPromesse = null;

function chargerIndex() {
    if (indexPromesse) return indexPromesse;
    const user = getSessionUser();
    const estMembre = (membres) => (membres || []).some((membre) => membre.user_id === user?.id);
    const visible = (entite, membres) => entite && (entite.is_public !== false || user?.is_admin || estMembre(membres));

    indexPromesse = Promise.all([
        liste(getCivilisations()), liste(getVilles()), liste(getQuartiers()), liste(getPersonnages()),
        liste(getReligions()), liste(getCommerces()), liste(getAlliances()), liste(getGuerres()),
        liste(getLivres()), liste(getJournaux()),
    ]).then(([civilisations, villes, quartiers, personnages, religions, commerces, alliances, guerres, livres, journaux]) => {
        const civs = civilisations.filter(({ civilisation, members }) => visible(civilisation, members)).map(({ civilisation }) => civilisation);
        const civTitres = new Map(civs.map((civ) => [civ.id, civ.title]));
        const villesVisibles = villes.filter((ville) => civTitres.has(ville.civilisation_id));
        const villeParId = new Map(villesVisibles.map((ville) => [ville.id, ville]));

        return [
            ...civs.map((civ) => ({ type: 'civilisation', titre: civ.title, href: `/civilisation/${civ.id}` })),
            ...villesVisibles.map((ville) => ({ type: 'ville', titre: ville.title, detail: civTitres.get(ville.civilisation_id), href: villeHref(ville) })),
            ...quartiers.filter((quartier) => villeParId.has(quartier.ville_id)).map((quartier) => ({
                type: 'quartier', titre: quartier.title, detail: villeParId.get(quartier.ville_id).title, href: `/quartier/${quartier.id}`,
            })),
            ...personnages.map(({ personnage, joueur }) => ({
                type: 'personnage', titre: personnage.name, detail: joueur?.full_name || joueur?.username, href: `/personnage/${personnage.id}`,
            })),
            ...religions.filter(({ religion, members }) => visible(religion, members)).map(({ religion }) => ({ type: 'religion', titre: religion.title, href: `/religion/${religion.id}` })),
            ...commerces.filter(({ commerce, members }) => visible(commerce, members)).map(({ commerce }) => ({ type: 'commerce', titre: commerce.title, href: `/commerce/${commerce.id}` })),
            ...alliances.filter(({ alliance }) => visible(alliance)).map(({ alliance }) => ({ type: 'alliance', titre: alliance.title, href: `/alliance/${alliance.id}` })),
            ...guerres.map(({ guerre }) => ({ type: 'guerre', titre: guerre.title, href: `/guerre/${guerre.id}` })),
            ...livres.filter((livre) => visible(livre)).map((livre) => ({ type: 'livre', titre: livre.title, href: `/bibliotheque/livre/${livre.id}` })),
            ...journaux.filter((journal) => visible(journal) || journal.user_id === user?.id).map((journal) => ({ type: 'journal', titre: journal.title, href: `/bibliotheque/journal/${journal.id}` })),
        ]
            .filter((item) => item.titre)
            .map((item) => ({ ...item, cle: normaliser(`${item.titre} ${item.detail || ''}`) }));
    });
    // Un échec complet ne doit pas empêcher un nouvel essai à la prochaine ouverture
    indexPromesse.catch(() => { indexPromesse = null; });
    return indexPromesse;
}

export default function RechercheGlobale() {
    const dialogRef = useRef(null);
    const inputRef = useRef(null);
    const [index, setIndex] = useState(null);
    const [requete, setRequete] = useState('');
    const [selection, setSelection] = useState(0);

    const ouvrir = () => {
        dialogRef.current?.showModal();
        inputRef.current?.focus();
        if (!index) chargerIndex().then(setIndex).catch(() => setIndex([]));
    };

    // Ctrl+K (ou Cmd+K) ouvre la recherche depuis n'importe quelle page
    useEffect(() => {
        const raccourci = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                ouvrir();
            }
        };
        window.addEventListener('keydown', raccourci);
        window.addEventListener(EVENEMENT_OUVRIR_RECHERCHE, ouvrir);
        return () => {
            window.removeEventListener('keydown', raccourci);
            window.removeEventListener(EVENEMENT_OUVRIR_RECHERCHE, ouvrir);
        };
    });

    const resultats = useMemo(() => {
        const mots = normaliser(requete.trim()).split(/\s+/).filter(Boolean);
        if (!index || mots.length === 0) return [];
        const parType = {};
        for (const item of index) {
            if (!mots.every((mot) => item.cle.includes(mot))) continue;
            parType[item.type] = parType[item.type] || [];
            if (parType[item.type].length < MAX_PAR_TYPE) parType[item.type].push(item);
        }
        return Object.keys(TYPES).flatMap((type) => parType[type] || []);
    }, [index, requete]);

    const changerRequete = (valeur) => {
        setRequete(valeur);
        setSelection(0);
    };

    const clavier = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelection((i) => Math.min(i + 1, resultats.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelection((i) => Math.max(i - 1, 0));
        } else if (event.key === 'Enter' && resultats[selection]) {
            event.preventDefault();
            window.location.href = resultats[selection].href;
        }
    };

    let contenu;
    if (!requete.trim()) {
        contenu = <p className="text-sm opacity-70 text-center py-6">Tapez le nom d'une civilisation, d'une ville, d'un personnage, d'un livre…</p>;
    } else if (!index) {
        contenu = <div className="flex justify-center py-6"><span className="loading loading-spinner"></span></div>;
    } else if (resultats.length === 0) {
        contenu = <p className="text-sm opacity-70 text-center py-6">Aucun résultat pour « {requete.trim()} ».</p>;
    } else {
        contenu = (
            <ul className="menu w-full p-0 gap-0.5" role="listbox">
                {resultats.map((item, i) => {
                    const debutGroupe = i === 0 || resultats[i - 1].type !== item.type;
                    return (
                        <li key={`${item.type}-${item.href}`} role="option" aria-selected={i === selection}>
                            {debutGroupe && <span className="menu-title px-2 pt-3 pb-1 pointer-events-none">{TYPES[item.type].label}</span>}
                            <a
                                href={item.href}
                                onMouseEnter={() => setSelection(i)}
                                className={`flex items-center gap-3 rounded-xl ${i === selection ? 'bg-secondary text-secondary-content' : ''}`}
                            >
                                <FontAwesomeIcon icon={TYPES[item.type].icon} className="w-4 opacity-70" />
                                <span className="font-semibold truncate">{item.titre}</span>
                                {item.detail && <span className="text-xs opacity-70 truncate">{item.detail}</span>}
                            </a>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <>
            <button type="button" onClick={ouvrir} aria-label="Rechercher" className="btn bg-base-200 rounded-3xl btn-ghost tooltip tooltip-left hidden sm:inline-flex" data-tip="Rechercher (Ctrl+K)">
                <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                <kbd className="kbd kbd-sm hidden 2xl:inline-flex">Ctrl K</kbd>
            </button>

            {/* Rendue dans body : placée dans la barre fixe, la modale fermée l'élargissait sur téléphone */}
            {createPortal(<dialog ref={dialogRef} className="modal modal-top sm:modal-middle" onClose={() => changerRequete('')}>
                <div className="modal-box rounded-3xl p-4 max-w-xl">
                    <label className="input input-ghost bg-base-200 rounded-3xl w-full">
                        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" className="opacity-60" />
                        <input
                            ref={inputRef}
                            type="search"
                            value={requete}
                            onChange={(event) => changerRequete(event.target.value)}
                            onKeyDown={clavier}
                            placeholder="Rechercher dans Tetrago…"
                            aria-label="Rechercher dans Tetrago"
                            autoComplete="off"
                        />
                        <kbd className="kbd kbd-sm">Échap</kbd>
                    </label>
                    <div className="max-h-[60vh] overflow-y-auto mt-2">{contenu}</div>
                    <p className="text-xs opacity-60 text-center mt-3 hidden sm:block">
                        <kbd className="kbd kbd-xs">↑</kbd> <kbd className="kbd kbd-xs">↓</kbd> pour choisir · <kbd className="kbd kbd-xs">Entrée</kbd> pour ouvrir
                    </p>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button aria-label="Fermer la recherche">Fermer</button>
                </form>
            </dialog>, document.body)}
        </>
    );
}
