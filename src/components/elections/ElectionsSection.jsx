import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import FormModal from '@/components/modals/FormModal';
import ScrutinCard from '@/components/elections/ScrutinCard';
import { showModalID } from '@/utils/showModal';
import { createScrutin, getScrutins } from '@/services/api';
import { CORPS, CORPS_PAR_ENTITE } from '@/config/elections';
import { scrutinFields } from '@/config/modals/scrutin';
import { postesEnJeu } from '@/components/elections/postesEnJeu';

// ===== Élections d'une civilisation, d'une religion ou d'une alliance =====
// Section des fiches : scrutins en cours puis passés (Shard-API crud_elections), et ouverture d'un scrutin par le
// fondateur ou un admin (organisateur : droits calculés par la fiche, vérifiés par l'API).
// villes : villes de la civilisation, dont les postes peuvent être mis en jeu comme ceux de son gouvernement.
// derniersClos : n'afficher, en plus des scrutins en cours, que ce nombre de scrutins clos (les plus récents) ;
// les annulés et les plus anciens restent sur /elections.

const MODAL_ID = 'scrutin-modal';

const EN_COURS = ['candidatures', 'vote', 'second_tour'];
const recents = (a, b) => new Date(b.closed_at ?? 0) - new Date(a.closed_at ?? 0);

export default function ElectionsSection({ entityType, entityId, peutOrganiser = false, villes = [], derniersClos = null }) {
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
        postesEnJeu(entityId, villes).then((liste) => { if (!annule) setPostes(liste); });
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
    const visibles = derniersClos == null ? scrutins : [
        ...scrutins.filter((s) => EN_COURS.includes(s.phase)),
        ...scrutins.filter((s) => s.phase === 'clos').sort(recents).slice(0, derniersClos),
    ];
    const masques = scrutins.length - visibles.length;

    return (
        <section id="elections" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Élections" icon="fas fa-check-to-slot" fonctions={Fct} />
            {scrutins.length === 0 ? (
                <i className="w-full">Aucun scrutin pour l'instant : ouvrez-en un pour désigner un dirigeant ou trancher une question.</i>
            ) : (
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full">
                    {visibles.map((scrutin) => <ScrutinCard key={scrutin.id} scrutin={scrutin} />)}
                </ul>
            )}
            {masques > 0 ? (
                <p className="text-sm opacity-70 px-1">
                    {masques > 1 ? `${masques} scrutins plus anciens ou annulés ne sont pas affichés` : 'Un scrutin plus ancien ou annulé n\'est pas affiché'} :{' '}
                    <a href="/elections#termines" className="link link-hover font-semibold">toutes les élections</a>.
                </p>
            ) : null}
            {ouverture ? (
                <FormModal
                    key={ouverture}
                    id={MODAL_ID}
                    title="Ouvrir un scrutin"
                    intro={fixe ? `${CORPS[fixe.corps]} : ${fixe.texte.charAt(0).toLowerCase()}${fixe.texte.slice(1)}` : null}
                    fields={scrutinFields({ entityType, postes })}
                    initialValues={{ mode: 'secret', deux_tours: 'non', egalite: 'personne', corps: 'personnages' }}
                    submitLabel="Ouvrir le scrutin"
                    submitIcon="fas fa-check-to-slot"
                    onSubmit={ouvrir}
                />
            ) : null}
        </section>
    );
}
