import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import FormModal from '@/components/modals/FormModal';
import ScrutinCard from '@/components/elections/ScrutinCard';
import { showModalID } from '@/utils/showModal';
import { createScrutin, getPostes, getScrutins } from '@/services/api';
import { CORPS, CORPS_PAR_ENTITE, MODES } from '@/config/elections';

// ===== Élections d'une civilisation, d'une religion ou d'une alliance =====
// Section des fiches : scrutins en cours puis passés (Shard-API crud_elections), et ouverture d'un scrutin par le
// fondateur ou un admin (organisateur : droits calculés par la fiche, vérifiés par l'API).
// villes : villes de la civilisation, dont les postes peuvent être mis en jeu comme ceux de son gouvernement.

const MODAL_ID = 'scrutin-modal';

const scrutinFields = (entityType, postes) => [
    { name: 'title', label: 'Titre', type: 'text', required: true, placeholder: 'Élection du chancelier, désignation du grand prêtre…' },
    { name: 'description', label: 'Présentation', type: 'textarea', placeholder: 'Ce qui est en jeu, les règles particulières…' },
    ...(entityType === 'religion' ? [{
        name: 'corps', label: 'Qui vote', type: 'radio', required: true,
        options: [{ value: 'personnages', label: 'Les fidèles' }, { value: 'villes', label: 'Les villes' }],
        help: 'Fidèles : chaque personnage de cette foi vote. Villes : une voix par ville où la religion a la plus forte influence, donnée par le dirigeant de la ville.',
    }] : []),
    {
        name: 'mode', label: 'Vote', type: 'radio', required: true,
        options: Object.entries(MODES).map(([value, mode]) => ({ value, label: mode.label })),
        help: (values) => MODES[values.mode]?.texte,
    },
    {
        name: 'deux_tours', label: 'Tours', type: 'radio', required: true,
        options: [{ value: 'non', label: 'Un tour' }, { value: 'oui', label: 'Deux tours' }],
        help: 'Deux tours : sans majorité absolue, les deux premiers s\'affrontent au second tour, aussi long que le premier.',
    },
    ...(entityType === 'civilisation' ? [{
        name: 'poste_id', label: 'Poste en jeu', type: 'select', placeholder: 'Aucun',
        options: postes.map((poste) => ({ value: poste.id, label: poste.label })),
        empty: 'Le gouvernement n\'a pas encore de poste : ajoutez-en dans la section « Gouvernement ».',
        help: 'À la clôture, l\'élu occupe ce poste.',
    }] : []),
    { name: 'vote_debut', label: 'Ouverture du vote', type: 'datetime-local', required: true, help: 'Heure réelle du serveur. Les candidatures se déposent jusque-là.' },
    { name: 'vote_fin', label: 'Clôture du vote', type: 'datetime-local', required: true, help: 'Les résultats restent cachés jusqu\'à la clôture.' },
    { name: 'date_rp', label: 'Date RP du scrutin', type: 'date', help: 'Facultative : avec elle, le résultat entre dans les chroniques.' },
];

export default function ElectionsSection({ entityType, entityId, peutOrganiser = false, villes = [] }) {
    const [scrutins, setScrutins] = useState(null);
    const [postes, setPostes] = useState([]);
    const [version, setVersion] = useState(0);
    const [ouverture, setOuverture] = useState(0);

    useEffect(() => {
        let annule = false;
        getScrutins(entityType, entityId)
            .then((liste) => { if (!annule) setScrutins(Array.isArray(liste) ? liste : []); })
            .catch(() => { if (!annule) setScrutins([]); });
        return () => { annule = true; };
    }, [entityType, entityId, version]);

    // Postes que la civilisation peut mettre en jeu : les siens et ceux de ses villes
    const villesIds = villes.map((ville) => ville.id).join(',');
    useEffect(() => {
        if (entityType !== 'civilisation' || !peutOrganiser) return;
        let annule = false;
        const sources = [{ type: 'civilisation', id: entityId, suffixe: '' }, ...villes.map((ville) => ({ type: 'ville', id: ville.id, suffixe: ` de ${ville.title}` }))];
        Promise.all(sources.map((source) => getPostes(source.type, source.id)
            .then((liste) => (Array.isArray(liste) ? liste : []).map((poste) => ({ id: poste.id, label: `${poste.title}${source.suffixe}` })))
            .catch(() => [])))
            .then((listes) => { if (!annule) setPostes(listes.flat()); });
        return () => { annule = true; };
    }, [entityType, entityId, peutOrganiser, villesIds]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { if (ouverture) showModalID(MODAL_ID); }, [ouverture]);

    if (scrutins === null || (scrutins.length === 0 && !peutOrganiser)) return null;

    const ouvrir = async (values) => {
        const result = await createScrutin({
            ...values,
            entity_type: entityType,
            entity_id: entityId,
            deux_tours: values.deux_tours === 'oui',
            poste_id: values.poste_id ? Number(values.poste_id) : null,
        });
        Swal.fire({ icon: 'success', title: 'Succès', text: result?.text ?? "C'est fait." });
        setVersion((v) => v + 1);
    };

    const Fct = [{
        id: 1, title: 'Scrutin', icon: 'fas fa-plus', class: 'bg-base-200 hover:bg-base-300', connected: true, authorisation: peutOrganiser,
        tooltip: { text: 'Ouvrir un scrutin', position: 'bottom' }, function: () => setOuverture((n) => n + 1),
    }];
    const fixe = CORPS_PAR_ENTITE[entityType];

    return (
        <section id="elections" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Élections" icon="fas fa-check-to-slot" fonctions={Fct} />
            {scrutins.length === 0 ? (
                <i className="w-full">Aucun scrutin pour l'instant : ouvrez-en un pour désigner un dirigeant ou trancher une question.</i>
            ) : (
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
                    {scrutins.map((scrutin) => <ScrutinCard key={scrutin.id} scrutin={scrutin} />)}
                </ul>
            )}
            {ouverture ? (
                <FormModal
                    key={ouverture}
                    id={MODAL_ID}
                    title="Ouvrir un scrutin"
                    intro={fixe ? `${CORPS[fixe.corps]} : ${fixe.texte.charAt(0).toLowerCase()}${fixe.texte.slice(1)}` : null}
                    fields={scrutinFields(entityType, postes)}
                    initialValues={{ mode: 'secret', deux_tours: 'non', corps: 'personnages' }}
                    submitLabel="Ouvrir le scrutin"
                    submitIcon="fas fa-check-to-slot"
                    onSubmit={ouvrir}
                />
            ) : null}
        </section>
    );
}
