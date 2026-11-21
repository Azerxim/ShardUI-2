import { useState } from 'react';

import Outil, { ChampNombre } from '@/components/aides/Outil';
import { entier } from '@/utils/aides';
import { MONNAIE, decomposer, enPetits, montantTexte } from '@/config/monnaie';
import { TAILLE_PILE } from '@/config/aides';
import { plural } from '@/utils/plural';

// Tetras ↔ diamants, aux taux de la Monnaie de Tetrago (config/monnaie.js) : elle frappe 8 tetras par diamant et en
// rachète 9 pour rendre un diamant. Saisir des diamants remplit le montant qu'ils frappent ; saisir un montant
// (tetras et petits tetras) calcule les diamants à porter à la Monnaie pour l'obtenir, et ceux qu'il rachète.
const PETITS_PAR_DIAMANT = MONNAIE.tetrasParDiamant * MONNAIE.petitsParTetra;
const PETITS_PAR_DIAMANT_RACHAT = MONNAIE.tetrasParDiamantRachat * MONNAIE.petitsParTetra;

const positif = (valeur) => Math.max(entier(valeur) ?? 0, 0);

export default function ConvertisseurTetras() {
    const [valeurs, setValeurs] = useState({ diamants: '', tetras: '', petits: '' });

    const changerDiamants = (valeur) => {
        const diamants = entier(valeur);
        if (diamants == null || diamants < 0) return setValeurs({ diamants: valeur, tetras: '', petits: '' });
        setValeurs({ diamants: valeur, tetras: String(diamants * MONNAIE.tetrasParDiamant), petits: '0' });
    };

    // Un montant saisi à la main : les diamants affichés sont ceux qu'il faut pour le frapper
    const changerMontant = (champ, valeur) => setValeurs((avant) => {
        const apres = { ...avant, [champ]: valeur };
        if (apres.tetras === '' && apres.petits === '') return { ...apres, diamants: '' };
        const total = enPetits(positif(apres.tetras), positif(apres.petits));
        return { ...apres, diamants: String(Math.ceil(total / PETITS_PAR_DIAMANT)) };
    });

    const total = enPetits(positif(valeurs.tetras), positif(valeurs.petits));
    const { tetras } = decomposer(total);
    const aFrapper = Math.ceil(total / PETITS_PAR_DIAMANT);
    const rachat = Math.floor(total / PETITS_PAR_DIAMANT_RACHAT);
    const piles = Math.ceil(tetras / TAILLE_PILE);

    return (
        <Outil
            id="tetras"
            icon={MONNAIE.icon}
            titre="Tetras et diamants"
            texte={`${MONNAIE.valeur} à la frappe, ${MONNAIE.tetrasParDiamantRachat} tetras pour 1 diamant au rachat, et ${MONNAIE.equivalence}. Combien de diamants porter à la Monnaie pour un montant, ou ce que vaut votre bourse.`}
        >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <ChampNombre label="Diamants" value={valeurs.diamants} min={0} onChange={changerDiamants} />
                <ChampNombre label={`Montant : ${MONNAIE.pluriel}`} value={valeurs.tetras} min={0} onChange={(valeur) => changerMontant('tetras', valeur)} />
                <ChampNombre label={`et ${MONNAIE.petit.pluriel}`} value={valeurs.petits} min={0} onChange={(valeur) => changerMontant('petits', valeur)} />
            </div>
            {total > 0 && (
                <div className="flex flex-col gap-1 text-sm bg-base-100 rounded-2xl px-4 py-3" aria-live="polite">
                    <p>
                        <strong>{montantTexte(total)}</strong>
                        {' '}: {plural(aFrapper, 'diamant')} à porter à la Monnaie pour les frapper
                        {total % PETITS_PAR_DIAMANT !== 0 && <span className="opacity-70"> (il vous restera {montantTexte(aFrapper * PETITS_PAR_DIAMANT - total)})</span>}.
                    </p>
                    <p className="opacity-70">
                        Rendus à la Monnaie, ils rachètent {rachat > 0 ? plural(rachat, 'diamant') : 'aucun diamant'}
                        {tetras > 0 && <> · {plural(piles, 'pile')} de {TAILLE_PILE} {MONNAIE.pluriel} dans l'inventaire</>}.
                    </p>
                </div>
            )}
        </Outil>
    );
}
