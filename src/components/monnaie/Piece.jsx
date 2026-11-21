import { MONNAIE } from '@/config/monnaie';

// Pièce de la monnaie officielle, d'après sa texture en jeu (16 × 16 pixels, agrandie sans flou) : le tetra, ou le petit
// tetra avec `petit`. Sans `label`, l'image est décorative (le texte voisin dit déjà le montant).
export default function Piece({ petit = false, taille = 24, label = null, className = '' }) {
    const piece = petit ? MONNAIE.pieces.petit : MONNAIE.pieces.tetra;
    return (
        <img
            src={piece.image}
            alt={label ?? ''}
            aria-hidden={label ? undefined : 'true'}
            width={taille}
            height={taille}
            draggable="false"
            className={`inline-block shrink-0 ${className}`}
            style={{ imageRendering: 'pixelated' }}
        />
    );
}
