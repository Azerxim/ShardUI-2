import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import FormModal from '@/components/modals/FormModal';
import { LIENS_LIVRES } from '@/config/livresLiens';
import { delierLivre, getAlliances, getCivilisations, getCommerces, getLiensLivre, getPersonnages, getPersonnagesOfUser, getReligions, lierLivre } from '@/services/api';
import { getSessionUser } from '@/services/session';
import { managedEntities, runAction, toOptions } from '@/utils/conflits';
import { showModalID } from '@/utils/showModal';

// ===== Liens d'un livre =====
// Civilisations, religions, commerces, alliances et personnages liés au livre (Shard-API crud_livres).
// Lier demande des droits sur le livre (auth) et sur ce qu'on lie : le formulaire ne propose donc que ce que
// l'utilisateur gère (dirigeant, chef de file, joueur du personnage ; tout pour un administrateur).
// Lier une civilisation donne à ses dirigeants le droit de modifier le livre. onLiens(liens) : à chaque chargement.

const MODAL_ID = 'livre-lien-modal';

// Ce que l'utilisateur peut lier, par type : [{ value, label }]. Un administrateur peut tout lier (comme l'API) :
// toutes les civilisations, religions, commerces et alliances, et les personnages de tous les joueurs.
async function chargerChoix(user) {
    const [religions, commerces, alliances, civilisations, personnages] = await Promise.all([
        getReligions().catch(() => []),
        getCommerces().catch(() => []),
        getAlliances().catch(() => []),
        getCivilisations().catch(() => []),
        (user.is_admin ? getPersonnages() : getPersonnagesOfUser(user.id)).catch(() => []),
    ]);
    const tous = (items, key) => (Array.isArray(items) ? items : []).map((item) => item[key]).filter(Boolean);
    const civsGerees = new Set(managedEntities(civilisations, 'civilisation').map((civ) => civ.id));
    const alliancesGerees = user.is_admin
        ? tous(alliances, 'alliance')
        : (Array.isArray(alliances) ? alliances : []).filter((item) => civsGerees.has(item.chef_de_file?.id)).map((item) => item.alliance);
    return {
        civilisation: toOptions(user.is_admin ? tous(civilisations, 'civilisation') : managedEntities(civilisations, 'civilisation')),
        religion: toOptions(user.is_admin ? tous(religions, 'religion') : managedEntities(religions, 'religion')),
        commerce: toOptions(user.is_admin ? tous(commerces, 'commerce') : managedEntities(commerces, 'commerce')),
        alliance: toOptions(alliancesGerees),
        // Personnages d'autres joueurs (administrateur) : le nom du joueur les distingue
        personnage: (Array.isArray(personnages) ? personnages : [])
            .map(({ personnage, joueur }) => ({ value: personnage.id, label: user.is_admin && joueur && joueur.id !== user.id ? `${personnage.name} (${joueur.full_name || joueur.username})` : personnage.name }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    };
}

export default function LivreLiensSection({ livre, auth, onLiens = () => { } }) {
    const user = getSessionUser();
    const [liens, setLiens] = useState([]);
    const [choix, setChoix] = useState(null);
    const [edition, setEdition] = useState(0);

    const charger = () => getLiensLivre(livre.id)
        .then((data) => {
            const liste = Array.isArray(data) ? data : [];
            setLiens(liste);
            onLiens(liste);
        })
        .catch(() => setLiens([]));

    useEffect(() => {
        charger();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [livre.id]);

    useEffect(() => { if (edition) showModalID(MODAL_ID); }, [edition]);

    const ouvrir = async () => {
        if (!choix) setChoix(await chargerChoix(user));
        setEdition((n) => n + 1);
    };

    const lier = async (values) => {
        const data = await lierLivre(livre.id, values.entity_type, Number(values.entity_id));
        Swal.fire({ icon: 'success', title: 'Succès', text: data?.text ?? "C'est fait." });
        charger();
    };

    const delier = async (lien) => {
        const result = await runAction(() => delierLivre(lien.id), {
            confirm: { title: `Retirer le lien avec « ${lien.entite.title} » ?`, text: 'Le livre ne figurera plus sur sa fiche.', button: 'Retirer' },
        });
        if (result) charger();
    };

    if (liens.length === 0 && !auth) return null;

    return (
        <div className="flex flex-row flex-wrap items-center gap-2 w-full">
            <span className="flex items-center gap-2 font-bold">
                <FontAwesomeIcon icon="fa-solid fa-link" />
                Lié à
            </span>
            {liens.length === 0 && <span className="text-sm opacity-70">rien pour l'instant</span>}
            {liens.map((lien) => {
                const type = LIENS_LIVRES[lien.entite.type];
                return (
                    <span key={lien.id} className="flex items-center gap-1 bg-base-100 rounded-3xl pl-3 pr-1 py-1 text-sm">
                        <FontAwesomeIcon icon={type.icon} className="opacity-70" title={type.label} />
                        <a href={type.href(lien.entite.id)} className="link link-hover font-semibold">{lien.entite.title}</a>
                        {auth ? (
                            <button type="button" className="btn btn-xs btn-ghost btn-circle" aria-label={`Retirer le lien avec ${lien.entite.title}`} onClick={() => delier(lien)}>
                                <FontAwesomeIcon icon="fa-solid fa-xmark" />
                            </button>
                        ) : <span className="w-1" />}
                    </span>
                );
            })}
            {auth && (
                <button type="button" className="btn btn-sm btn-ghost bg-base-100 rounded-3xl" onClick={ouvrir}>
                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                    Lier
                </button>
            )}
            {auth && edition > 0 && choix ? (
                <FormModal
                    key={`${MODAL_ID}-${edition}`}
                    id={MODAL_ID}
                    title={`Lier « ${livre.title} »`}
                    intro={`Le livre figurera aussi sur sa fiche. ${user?.is_admin ? 'Administrateur : tout est proposé.' : 'Seul ce que vous gérez est proposé.'} Lier une civilisation donne à ses dirigeants le droit de modifier le livre.`}
                    fields={[
                        { name: 'entity_type', label: 'Lier à', type: 'radio', required: true, resets: ['entity_id'], options: Object.entries(LIENS_LIVRES).map(([value, { label }]) => ({ value, label })) },
                        {
                            name: 'entity_id', label: 'Lequel', type: 'select', required: true,
                            options: (values) => choix[values.entity_type] || [],
                            empty: (values) => (values.entity_type ? `Vous ne gérez aucun(e) ${LIENS_LIVRES[values.entity_type].label.toLowerCase()}.` : 'Choisissez d\'abord à quoi lier le livre.'),
                        },
                    ]}
                    initialValues={{ entity_type: '', entity_id: '' }}
                    submitLabel="Lier"
                    onSubmit={lier}
                />
            ) : null}
        </div>
    );
}
