import { useState } from 'react';

import Outil, { ChampNombre } from '@/components/aides/Outil';
import { entier, formatNombre } from '@/utils/aides';
import { MONNAIE } from '@/config/monnaie';
import { TAILLE_PILE } from '@/config/aides';
import { plural } from '@/utils/plural';

// Tetras ↔ diamants et blocs de diamant (config/monnaie.js) : un montant à payer, et ce qu'il faut sortir du coffre.
// Saisir un montant remplit les blocs et diamants ; saisir les blocs ou les diamants recalcule le montant.
const PAR_BLOC = MONNAIE.diamantsParBloc;

const repartir = (tetras) => ({ blocs: Math.floor(tetras / PAR_BLOC), diamants: tetras % PAR_BLOC });

export default function ConvertisseurTetras() {
    const [valeurs, setValeurs] = useState({ tetras: '', blocs: '', diamants: '' });

    const changerMontant = (valeur) => {
        const tetras = entier(valeur);
        if (tetras == null || tetras < 0) return setValeurs({ tetras: valeur, blocs: '', diamants: '' });
        const { blocs, diamants } = repartir(tetras);
        setValeurs({ tetras: valeur, blocs: String(blocs), diamants: String(diamants) });
    };

    const changerPieces = (champ, valeur) => setValeurs((avant) => {
        const apres = { ...avant, [champ]: valeur };
        const blocs = Math.max(entier(apres.blocs) ?? 0, 0);
        const diamants = Math.max(entier(apres.diamants) ?? 0, 0);
        return { ...apres, tetras: apres.blocs === '' && apres.diamants === '' ? '' : String(blocs * PAR_BLOC + diamants) };
    });

    const tetras = Math.max(entier(valeurs.tetras) ?? 0, 0);
    const { blocs, diamants } = repartir(tetras);
    const piles = Math.ceil(tetras / TAILLE_PILE);

    return (
        <Outil
            id="tetras"
            icon={MONNAIE.icon}
            titre="Tetras, diamants et blocs"
            texte={`${MONNAIE.valeur}, et ${MONNAIE.equivalence.charAt(0).toLowerCase()}${MONNAIE.equivalence.slice(1)} Combien sortir du coffre pour payer un montant, ou ce que vaut votre bourse.`}
        >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <ChampNombre label={`Montant en ${MONNAIE.pluriel}`} value={valeurs.tetras} min={0} onChange={changerMontant} />
                <ChampNombre label="Blocs de diamant" value={valeurs.blocs} min={0} onChange={(valeur) => changerPieces('blocs', valeur)} />
                <ChampNombre label="Diamants" value={valeurs.diamants} min={0} onChange={(valeur) => changerPieces('diamants', valeur)} />
            </div>
            {tetras > 0 && (
                <p className="text-sm bg-base-100 rounded-2xl px-4 py-3" aria-live="polite">
                    <strong>{formatNombre(tetras)} {tetras > 1 ? MONNAIE.pluriel : MONNAIE.nom}</strong>
                    {' '}= {plural(blocs, 'bloc')} de diamant et {plural(diamants, 'diamant')}
                    {' '}<span className="opacity-70">(en diamants seuls : {plural(piles, 'pile')} de {TAILLE_PILE} dans l'inventaire)</span>
                </p>
            )}
        </Outil>
    );
}
