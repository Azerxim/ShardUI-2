import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import FormModal from '@/components/modals/FormModal';
import PersonnageAvatar from '@/components/personnages/PersonnageAvatar';
import { showModalID } from '@/utils/showModal';
import { runAction } from '@/utils/conflits';
import { createPoste, deletePoste, getPersonnagesOfResidence, getPostes, updatePoste } from '@/services/api';
import { getSessionUser } from '@/services/session';
import { libellePersonnage, personnagesChoisissables } from '@/utils/personnages';

// ===== Postes du gouvernement =====
// D'une civilisation ou de l'une de ses villes (Shard-API crud_elections) : « Roi », « Bourgmestre »…, chacun occupé
// par un personnage résident de la civilisation. Le représentant vote au nom de la civilisation dans ses alliances, ou
// de la ville dans les élections de religion. Une élection peut mettre un poste en jeu : l'élu l'occupe à la clôture.
// auth : fondateur ou admin de la civilisation (vérifié par l'API). Un administrateur du site nomme n'importe quel personnage.

const MODAL_ID = 'poste-modal';

const posteFields = (residents, entityType, user) => [
    { name: 'title', label: 'Poste', type: 'text', required: true, placeholder: entityType === 'ville' ? 'Bourgmestre, prévôt, gouverneur…' : 'Roi, chancelier, grand trésorier…' },
    {
        name: 'personnage_id', label: 'Titulaire', type: 'select', placeholder: 'Vacant',
        options: residents.map((fiche) => ({ value: fiche.personnage.id, label: libellePersonnage(fiche, user) })),
        empty: 'Aucun personnage ne réside dans la civilisation : le poste restera vacant.',
        help: user?.is_admin ? 'Administrateur : tous les personnages du site vous sont proposés.' : 'Un personnage qui réside dans la civilisation.',
    },
    {
        name: 'is_representant', label: 'Représentant', type: 'radio', required: true,
        options: [{ value: 'non', label: 'Non' }, { value: 'oui', label: 'Oui' }],
        help: entityType === 'ville'
            ? 'Son titulaire dirige la ville : il vote en son nom aux élections des religions.'
            : 'Son titulaire vote au nom de la civilisation aux élections de ses alliances.',
    },
];

export default function PostesGouvernement({ entityType, entityId, civilisationId, auth = false }) {
    const [postes, setPostes] = useState(null);
    const [residents, setResidents] = useState([]);
    const [version, setVersion] = useState(0);
    const [cible, setCible] = useState(null); // { poste (null : nouveau), n }

    useEffect(() => {
        let annule = false;
        getPostes(entityType, entityId)
            .then((liste) => { if (!annule) setPostes(Array.isArray(liste) ? liste : []); })
            .catch(() => { if (!annule) setPostes([]); });
        return () => { annule = true; };
    }, [entityType, entityId, version]);

    useEffect(() => {
        if (!auth || !civilisationId) return;
        const user = getSessionUser();
        (user?.is_admin ? personnagesChoisissables(user) : getPersonnagesOfResidence('civilisation', civilisationId))
            .then((liste) => setResidents((Array.isArray(liste) ? liste : []).filter((fiche) => fiche.personnage.status === 'vivant')))
            .catch(() => setResidents([]));
    }, [auth, civilisationId]);

    useEffect(() => { if (cible) showModalID(MODAL_ID); }, [cible]);

    if (postes === null || (postes.length === 0 && !auth)) return null;

    const ouvrir = (poste = null) => setCible((avant) => ({ poste, n: (avant?.n ?? 0) + 1 }));
    const enregistrer = async (values) => {
        const corps = { title: values.title, personnage_id: values.personnage_id ? Number(values.personnage_id) : null, is_representant: values.is_representant === 'oui' };
        const result = cible.poste ? await updatePoste(cible.poste.id, corps) : await createPoste({ ...corps, entity_type: entityType, entity_id: entityId });
        Swal.fire({ icon: 'success', title: 'Succès', text: result?.text ?? "C'est fait." });
        setVersion((v) => v + 1);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 px-1">
                <span className="font-bold flex items-center gap-2"><FontAwesomeIcon icon="fa-solid fa-crown" />Postes</span>
                {auth ? (
                    <button type="button" className="btn btn-xs btn-ghost bg-base-100" onClick={() => ouvrir()}>
                        <FontAwesomeIcon icon="fa-solid fa-plus" />Poste
                    </button>
                ) : null}
            </div>
            {postes.length === 0 ? (
                <i className="px-1 text-sm opacity-80">Aucun poste : ajoutez-en pour désigner qui gouverne, et qui représente {entityType === 'ville' ? 'la ville' : 'la civilisation'}.</i>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {postes.map((poste) => (
                        <li key={poste.id} aria-label={poste.title} className="flex flex-row items-center gap-3 bg-base-100 rounded-2xl p-2 pr-3 min-w-0">
                            {poste.personnage ? <PersonnageAvatar personnage={poste.personnage} /> : (
                                <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-base-200 opacity-60"><FontAwesomeIcon icon="fa-solid fa-chair" /></span>
                            )}
                            <span className="flex flex-col min-w-0 flex-1">
                                <span className="flex flex-row flex-wrap items-center gap-2">
                                    <span className="font-semibold break-words">{poste.title}</span>
                                    {poste.is_representant ? <span className="badge badge-sm badge-secondary">Représentant</span> : null}
                                </span>
                                {poste.personnage
                                    ? <a href={`/personnage/${poste.personnage.id}`} className="text-sm link link-hover truncate">{poste.personnage.name}</a>
                                    : <span className="text-sm opacity-70">Vacant</span>}
                            </span>
                            {auth ? (
                                <span className="flex flex-row gap-1 shrink-0">
                                    <button type="button" className="btn btn-xs btn-ghost btn-circle" aria-label={`Modifier le poste ${poste.title}`} onClick={() => ouvrir(poste)}>
                                        <FontAwesomeIcon icon="fa-solid fa-pen" />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-ghost btn-circle text-error"
                                        aria-label={`Supprimer le poste ${poste.title}`}
                                        onClick={() => runAction(() => deletePoste(poste.id), {
                                            confirm: { title: `Supprimer le poste « ${poste.title} » ?`, text: 'Son titulaire le perd ; les élections passées gardent son nom.', button: 'Supprimer' },
                                        }).then((result) => { if (result) setVersion((v) => v + 1); })}
                                    >
                                        <FontAwesomeIcon icon="fa-solid fa-trash" />
                                    </button>
                                </span>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
            {cible ? (
                <FormModal
                    key={cible.n}
                    id={MODAL_ID}
                    title={cible.poste ? `Modifier « ${cible.poste.title} »` : 'Nouveau poste'}
                    fields={posteFields(residents, entityType, getSessionUser())}
                    initialValues={{
                        title: cible.poste?.title ?? '',
                        personnage_id: cible.poste?.personnage ? String(cible.poste.personnage.id) : '',
                        is_representant: cible.poste?.is_representant || (!cible.poste && postes.length === 0) ? 'oui' : 'non',
                    }}
                    submitLabel="Enregistrer"
                    onSubmit={enregistrer}
                />
            ) : null}
        </div>
    );
}
