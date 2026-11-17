import { useState } from "react";

// Courbe d'une mesure du monde, relevé après relevé (une seule série : pas de légende, le sélecteur la nomme).
// L'axe horizontal suit les dates réelles des relevés ; survoler la courbe affiche la valeur, cliquer ouvre le relevé.
const LARGEUR = 960;
const HAUTEUR = 240;
const MARGES = { haut: 12, droite: 16, bas: 28, gauche: 64 };

// Graduations en notation compacte (200 k, 1,5 M) : elles tiennent dans la marge quelle que soit la mesure
const compact = (valeur) => valeur.toLocaleString("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

const dateCourte = (valeur) => new Date(valeur).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// Graduation « ronde » : 1, 2 ou 5 × 10^n
function pas(max, graduations = 4) {
    const brut = max / graduations;
    const puissance = 10 ** Math.floor(Math.log10(brut || 1));
    const facteur = [1, 2, 5, 10].find((f) => f * puissance >= brut) || 10;
    return facteur * puissance;
}

export default function CourbeEvolution({ points, format, selectionId, onSelect, libelle, unite = "" }) {
    const [survol, setSurvol] = useState(null);
    const valides = points.filter((point) => point.valeur !== null && point.valeur !== undefined);
    if (valides.length < 2) {
        return <p className="text-sm opacity-70 px-1">Il faut au moins deux relevés pour tracer une évolution.</p>;
    }

    const temps = valides.map((point) => new Date(point.date).getTime());
    const debut = Math.min(...temps);
    const fin = Math.max(...temps);
    const intervalle = pas(Math.max(...valides.map((point) => point.valeur), 1));
    const plafond = Math.ceil(Math.max(...valides.map((point) => point.valeur), 1) / intervalle) * intervalle;
    const largeurUtile = LARGEUR - MARGES.gauche - MARGES.droite;
    const hauteurUtile = HAUTEUR - MARGES.haut - MARGES.bas;
    const x = (date) => MARGES.gauche + (fin === debut ? largeurUtile / 2 : ((new Date(date).getTime() - debut) / (fin - debut)) * largeurUtile);
    const y = (valeur) => MARGES.haut + hauteurUtile - (valeur / plafond) * hauteurUtile;
    const graduations = [];
    for (let valeur = 0; valeur <= plafond; valeur += intervalle) graduations.push(valeur);

    const trace = valides.map((point, index) => `${index ? "L" : "M"}${x(point.date).toFixed(1)},${y(point.valeur).toFixed(1)}`).join(" ");
    const surface = `${trace} L${x(valides.at(-1).date).toFixed(1)},${y(0)} L${x(valides[0].date).toFixed(1)},${y(0)} Z`;
    const selection = valides.find((point) => point.id === selectionId);

    // Point le plus proche du pointeur, en abscisse (cible bien plus large que le marqueur)
    const pointer = (event) => {
        const cadre = event.currentTarget.getBoundingClientRect();
        const position = ((event.clientX - cadre.left) / cadre.width) * LARGEUR;
        let proche = valides[0];
        for (const point of valides) {
            if (Math.abs(x(point.date) - position) < Math.abs(x(proche.date) - position)) proche = point;
        }
        setSurvol(proche);
    };

    return (
        <div className="relative w-full">
            <svg
                viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
                className="w-full h-auto text-base-content select-none"
                role="img"
                aria-label={`${libelle} : de ${format(valides[0].valeur)} à ${format(valides.at(-1).valeur)} sur ${valides.length} relevés`}
            >
                {graduations.map((valeur) => (
                    <g key={valeur}>
                        <line x1={MARGES.gauche} x2={LARGEUR - MARGES.droite} y1={y(valeur)} y2={y(valeur)} stroke="currentColor" strokeOpacity={valeur ? 0.08 : 0.25} />
                        <text x={MARGES.gauche - 8} y={y(valeur)} dy="0.32em" textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.6" className="tabular-nums">
                            {compact(valeur)}{unite}
                        </text>
                    </g>
                ))}
                <text x={x(valides[0].date)} y={HAUTEUR - 8} textAnchor="start" fontSize="11" fill="currentColor" fillOpacity="0.6">{dateCourte(valides[0].date)}</text>
                <text x={x(valides.at(-1).date)} y={HAUTEUR - 8} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.6">{dateCourte(valides.at(-1).date)}</text>

                <path d={surface} fill="var(--color-primary)" fillOpacity="0.1" />
                <path d={trace} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                {selection ? (
                    <circle cx={x(selection.date)} cy={y(selection.valeur)} r="4.5" fill="var(--color-primary)" stroke="var(--color-base-100)" strokeWidth="2" />
                ) : null}
                {survol ? (
                    <>
                        <line x1={x(survol.date)} x2={x(survol.date)} y1={MARGES.haut} y2={y(0)} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="3 3" />
                        <circle cx={x(survol.date)} cy={y(survol.valeur)} r="5" fill="var(--color-primary)" stroke="var(--color-base-100)" strokeWidth="2" />
                    </>
                ) : null}

                <rect
                    x={MARGES.gauche}
                    y={0}
                    width={largeurUtile}
                    height={HAUTEUR}
                    fill="transparent"
                    className={onSelect ? "cursor-pointer" : ""}
                    onMouseMove={pointer}
                    onMouseLeave={() => setSurvol(null)}
                    onClick={() => survol && onSelect?.(survol.id)}
                />
            </svg>
            {survol ? (
                <div
                    className="absolute top-0 pointer-events-none bg-base-100 border border-base-300 rounded-xl shadow px-3 py-1.5 text-sm whitespace-nowrap"
                    style={{
                        left: `${(x(survol.date) / LARGEUR) * 100}%`,
                        transform: x(survol.date) > LARGEUR / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                    }}
                >
                    <div className="opacity-70">{new Date(survol.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</div>
                    <div className="font-bold tabular-nums">{format(survol.valeur)}</div>
                </div>
            ) : null}
        </div>
    );
}
