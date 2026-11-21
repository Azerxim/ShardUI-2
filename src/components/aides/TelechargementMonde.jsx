import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Outil from '@/components/aides/Outil';
import { MONDE_DESCRIPTION_URL, MONDE_TELECHARGEMENT_DIR } from '@/config/maps';

// Le monde qui a servi à la dernière génération de la carte, publié chaque semaine par le générateur de Shard-Maps
// (scripts/map-generator, assets/data/telechargement) : archive zip sans les données des joueurs, et monde.json
// (date, version, taille, empreinte) lu ici.

const NOMS_DIMENSIONS = {
    '': 'Surface',
    overworld: 'Surface',
    'dimensions/minecraft/overworld': 'Surface',
    'DIM-1': 'Nether',
    'dimensions/minecraft/the_nether': 'Nether',
    DIM1: 'End',
    'dimensions/minecraft/the_end': 'End',
};

const formatTaille = (octets) => {
    const mo = octets / 1048576;
    return mo >= 1024
        ? `${(mo / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Go`
        : `${Math.round(mo).toLocaleString('fr-FR')} Mo`;
};

const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function TelechargementMonde() {
    // null : chargement ; false : aucun monde publié (ou carte injoignable)
    const [monde, setMonde] = useState(null);

    useEffect(() => {
        let annule = false;
        fetch(MONDE_DESCRIPTION_URL, { cache: 'no-cache' })
            .then((reponse) => (reponse.ok ? reponse.json() : false))
            .then((donnees) => { if (!annule) setMonde(donnees?.fichier ? donnees : false); })
            .catch(() => { if (!annule) setMonde(false); });
        return () => { annule = true; };
    }, []);

    return (
        <Outil
            id="monde"
            icon="fa-solid fa-earth-europe"
            titre="Télécharger le monde"
            texte="Le monde tel qu'il était à la dernière mise à jour de la carte, à ouvrir en solo : pour visiter, repérer un terrain ou préparer un tournage."
        >
            {monde === null ? (
                <p className="text-sm opacity-70" role="status">Recherche du dernier monde publié…</p>
            ) : monde === false ? (
                <p className="text-sm opacity-80" role="status">
                    Aucun monde n'est publié pour l'instant : il le sera à la prochaine mise à jour de la carte.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { label: 'Mis à jour le', valeur: formatDate(monde.date) },
                            { label: 'Minecraft', valeur: monde.version || '—' },
                            { label: 'Taille', valeur: formatTaille(monde.taille) },
                            { label: 'Dimensions', valeur: (monde.dimensions || []).map((d) => NOMS_DIMENSIONS[d] ?? d).join(', ') || '—' },
                        ].map(({ label, valeur }) => (
                            <div key={label} className="flex flex-col gap-0.5 bg-base-100 rounded-2xl p-3 min-w-0">
                                <dt className="text-xs font-semibold opacity-70">{label}</dt>
                                <dd className="font-semibold break-words first-letter:uppercase">{valeur}</dd>
                            </div>
                        ))}
                    </dl>

                    <a href={`${MONDE_TELECHARGEMENT_DIR}/${monde.fichier}`} download className="btn btn-primary rounded-3xl self-start">
                        <FontAwesomeIcon icon="fa-solid fa-download" />
                        Télécharger {monde.monde || 'le monde'} ({formatTaille(monde.taille)})
                    </a>

                    <ol className="list-decimal list-inside text-sm flex flex-col gap-1 opacity-90">
                        <li>Décompressez l'archive dans le dossier <code>saves</code> de votre Minecraft.</li>
                        <li>Lancez Minecraft {monde.version || ''} et ouvrez le monde depuis « Solo ».</li>
                        <li>Les joueurs n'y sont pas : vous apparaissez au point d'apparition du serveur, sans inventaire.</li>
                    </ol>

                    {monde.sha256 ? (
                        <details className="text-xs opacity-70">
                            <summary className="cursor-pointer">Empreinte SHA-256 de l'archive</summary>
                            <code className="break-all">{monde.sha256}</code>
                        </details>
                    ) : null}
                </div>
            )}
        </Outil>
    );
}
