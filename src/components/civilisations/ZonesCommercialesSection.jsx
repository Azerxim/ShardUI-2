import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import EtatVide from '@/components/ui/EtatVide';
import FormModal from '@/components/modals/FormModal';
import ZoneCommercialeCard from '@/components/commerces/ZoneCommercialeCard';
import FoireCard from '@/components/commerces/FoireCard';
import { createFoire, deleteFoire, getMarchesVille, getZonesCommercialesOfVille, setJoursMarche, updateFoire } from '@/services/api';
import { openMapEditor } from '@/services/mapEditor';
import { dansLaZone } from '@/utils/cartographie';
import { runAction } from '@/utils/conflits';
import { showModalID } from '@/utils/showModal';
import { JOURS_OPTIONS, dateDuJour, periodeFoire } from '@/config/marches';

// ===== Marchés d'une ville : zones commerciales, jours de marché et foires =====
// Zones : marchés et quartiers marchands tracés dans l'éditeur de carte (?commerciale=ID de la ville) par les dirigeants
// de la civilisation ; leurs boutiques sont les magasins de la ville situés à l'intérieur, d'après leur position.
// Chaque zone affiche ses jours d'ouverture (semaine réelle). Les foires sont datées, annoncées sur Discord
// (Shard-API crud_marches) ; mêmes droits que le tracé des zones. Ancre #marches : lien des annonces Discord.
// magasins : [{ magasin, commerce }] (magasins publics de la ville, déjà chargés par la fiche)

const MODAL_JOURS = 'marche-jours-modal';
const MODAL_FOIRE = 'foire-modal';

const champsFoire = (zones) => [
    { name: 'title', label: 'Nom', type: 'text', required: true, placeholder: 'Ex. Foire aux chevaux, Grande foire d\'automne' },
    { name: 'date_debut', label: 'Premier jour', type: 'date', required: true },
    { name: 'date_fin', label: 'Dernier jour', type: 'date', help: 'Vide : la foire dure un seul jour. 31 jours au plus.' },
    { name: 'horaires', label: 'Horaires', type: 'text', placeholder: 'Ex. dès 20 h' },
    { name: 'zone_id', label: 'Lieu', type: 'select', placeholder: 'Au centre de la ville', options: zones.map((zone) => ({ value: zone.id, label: zone.title || 'Zone sans nom' })), empty: 'Au centre de la ville (aucune zone commerciale tracée).' },
    { name: 'description', label: 'Programme', type: 'textarea', placeholder: 'Marchands attendus, joutes, spectacles…' },
];

export default function ZonesCommercialesSection({ ville, dimension, auth, magasins = [] }) {
    const [zones, setZones] = useState(null);
    const [marches, setMarches] = useState({ jours: [], a_venir: [], passees: [] });
    const [editionJours, setEditionJours] = useState(null);   // { zone, count }
    const [editionFoire, setEditionFoire] = useState(null);   // { foire (null : nouvelle), count }

    const chargerMarches = () => getMarchesVille(ville.id).then(setMarches).catch(() => { });

    useEffect(() => {
        let annule = false;
        getZonesCommercialesOfVille(ville.id)
            .then((liste) => { if (!annule) setZones(Array.isArray(liste) ? liste : []); })
            .catch(() => { if (!annule) setZones([]); });
        getMarchesVille(ville.id).then((data) => { if (!annule) setMarches(data); }).catch(() => { });
        return () => { annule = true; };
    }, [ville.id]);

    useEffect(() => { if (editionJours) showModalID(MODAL_JOURS); }, [editionJours]);
    useEffect(() => { if (editionFoire) showModalID(MODAL_FOIRE); }, [editionFoire]);

    const ouvrirEditeur = () => {
        if (!dimension) {
            Swal.fire({ icon: 'error', title: 'Carte indisponible', text: 'La dimension de cette ville est inconnue.' });
            return;
        }
        openMapEditor({ dimension, type: 'commerciale', id: ville.id, x: ville.x, z: ville.z });
    };

    const marcheDe = (zone) => marches.jours.find((marche) => marche.cartographie_id === zone.id) ?? null;

    const enregistrerJours = async (values) => {
        const data = await setJoursMarche(editionJours.zone.id, values.jours || [], values.horaires);
        Swal.fire({ icon: 'success', title: 'Succès', text: data?.text ?? "C'est fait." });
        chargerMarches();
    };

    const enregistrerFoire = async (values) => {
        const corps = { ...values, zone_id: values.zone_id || null, date_fin: values.date_fin || values.date_debut };
        const data = editionFoire.foire
            ? await updateFoire(editionFoire.foire.id, corps)
            : await createFoire({ ...corps, ville_id: ville.id });
        Swal.fire({ icon: 'success', title: 'Succès', text: data?.text ?? "C'est fait." });
        chargerMarches();
    };

    const annulerFoire = async (foire) => {
        const result = await runAction(() => deleteFoire(foire.id), {
            confirm: { title: `Annuler « ${foire.title} » ?`, text: foire.date_fin >= dateDuJour() ? "L'annulation sera annoncée sur Discord." : 'Elle disparaîtra de la fiche de la ville.', button: 'Annuler la foire' },
        });
        if (result) chargerMarches();
    };

    const fonctionsZones = [
        { id: 1, title: 'Tracer', icon: 'fas fa-draw-polygon', class: 'bg-base-200 hover:bg-base-300', connected: true, authorisation: auth, tooltip: { text: 'Tracer les marchés et quartiers marchands sur la carte', position: 'left' }, function: ouvrirEditeur },
    ];
    const fonctionsFoires = [
        { id: 1, title: 'Annoncer', icon: 'fas fa-bullhorn', class: 'bg-base-200 hover:bg-base-300', connected: true, authorisation: auth, tooltip: { text: 'Annoncer une foire (aussi sur Discord)', position: 'left' }, function: () => setEditionFoire((prev) => ({ foire: null, count: (prev?.count ?? 0) + 1 })) },
    ];

    let contenu;
    if (zones === null) {
        contenu = <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>;
    } else if (zones.length === 0) {
        contenu = (
            <EtatVide
                icon="fa-solid fa-store"
                texte="Cette ville n'a pas encore de zone commerciale."
                aide={auth
                    ? "Tracez sur la carte ses marchés et quartiers marchands : les magasins situés à l'intérieur y seront listés."
                    : "Les dirigeants de la civilisation tracent sur la carte les marchés et quartiers marchands de la ville."}
                action={auth ? { label: 'Tracer sur la carte', icon: 'fa-solid fa-draw-polygon', onClick: ouvrirEditeur } : null}
            />
        );
    } else {
        contenu = (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full items-start">
                {[...zones].sort((a, b) => (a.title || '').localeCompare(b.title || '')).map((zone) => (
                    <ZoneCommercialeCard
                        key={zone.id}
                        zone={zone}
                        dimension={dimension}
                        marche={marcheDe(zone)}
                        onModifierJours={auth ? () => setEditionJours((prev) => ({ zone, count: (prev?.count ?? 0) + 1 })) : null}
                        boutiques={magasins.filter(({ magasin }) => magasin.dimension_id === zone.dimension_id && dansLaZone(zone, magasin.x, magasin.z))}
                    />
                ))}
            </div>
        );
    }

    const actionsFoire = (foire) => (auth ? (
        <>
            <button type="button" className="btn btn-xs btn-ghost btn-circle" aria-label={`Modifier ${foire.title}`} onClick={() => setEditionFoire((prev) => ({ foire, count: (prev?.count ?? 0) + 1 }))}>
                <FontAwesomeIcon icon="fa-solid fa-pen" />
            </button>
            <button type="button" className="btn btn-xs btn-ghost btn-circle text-error" aria-label={`Annuler ${foire.title}`} onClick={() => annulerFoire(foire)}>
                <FontAwesomeIcon icon="fa-solid fa-trash" />
            </button>
        </>
    ) : null);

    return (
        <section id="marches" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Zones commerciales" icon="fas fa-store" fonctions={fonctionsZones} aide="commerciale" />
            {contenu}

            <TitleH2 text="Foires" icon="fas fa-tents" fonctions={fonctionsFoires} aide="foire" />
            {marches.a_venir.length === 0 ? (
                <p className="text-sm opacity-70 px-1">
                    {auth ? 'Aucune foire annoncée : « Annoncer » la date, le lieu et le programme, elle sera aussi annoncée sur Discord.' : 'Aucune foire annoncée pour le moment.'}
                </p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full items-start">
                    {marches.a_venir.map((foire) => <FoireCard key={foire.id} foire={foire} dimension={dimension} actions={actionsFoire(foire)} />)}
                </div>
            )}
            {marches.passees.length > 0 && (
                <details className="px-1">
                    <summary className="cursor-pointer text-sm opacity-70">Foires passées ({marches.passees.length})</summary>
                    <ul className="flex flex-col gap-1 mt-2 text-sm">
                        {marches.passees.map((foire) => <li key={foire.id}>{foire.title} · {periodeFoire(foire)}</li>)}
                    </ul>
                </details>
            )}

            {auth && editionJours ? (
                <FormModal
                    key={`${MODAL_JOURS}-${editionJours.count}`}
                    id={MODAL_JOURS}
                    title={`Jours de marché · ${editionJours.zone.title || 'zone commerciale'}`}
                    intro="Jours de la semaine réelle où le marché se tient, pour que les joueurs s'y retrouvent."
                    fields={[
                        { name: 'jours', label: 'Jours d\'ouverture', type: 'checkboxes', options: JOURS_OPTIONS },
                        { name: 'horaires', label: 'Horaires', type: 'text', placeholder: 'Ex. de 20 h à 23 h' },
                    ]}
                    initialValues={{ jours: marcheDe(editionJours.zone)?.jours ?? [], horaires: marcheDe(editionJours.zone)?.horaires ?? '' }}
                    submitLabel="Enregistrer"
                    onSubmit={enregistrerJours}
                />
            ) : null}
            {auth && editionFoire ? (
                <FormModal
                    key={`${MODAL_FOIRE}-${editionFoire.count}`}
                    id={MODAL_FOIRE}
                    title={editionFoire.foire ? `Modifier « ${editionFoire.foire.title} »` : `Annoncer une foire à ${ville.title}`}
                    intro={editionFoire.foire ? 'Un changement de dates est annoncé sur Discord.' : 'La foire sera annoncée sur Discord et affichée sur la carte.'}
                    fields={champsFoire(zones || [])}
                    initialValues={{
                        title: editionFoire.foire?.title ?? '',
                        date_debut: editionFoire.foire?.date_debut ?? '',
                        date_fin: editionFoire.foire?.date_fin ?? '',
                        horaires: editionFoire.foire?.horaires ?? '',
                        zone_id: editionFoire.foire?.zone?.id ?? '',
                        description: editionFoire.foire?.description ?? '',
                    }}
                    submitLabel={editionFoire.foire ? 'Enregistrer' : 'Annoncer'}
                    onSubmit={enregistrerFoire}
                />
            ) : null}
        </section>
    );
}
