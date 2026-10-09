import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import FormModal from '@/components/modals/FormModal';
import { LIENS_LIVRES } from '@/config/livresLiens';
import { delierJournal, delierLivre, getAlliances, getCivilisations, getCommerces, getGuerres, getLiensJournal, getLiensLivre, getPersonnages, getPersonnagesOfUser, getReligions, lierJournal, lierLivre } from '@/services/api';
import { getSessionUser } from '@/services/session';
import { isModerateur, managedEntities, runAction, toOptions } from '@/utils/conflits';
import { showModalID } from '@/utils/showModal';

// ===== Liens d'un livre ou d'un journal =====
// Civilisations, religions, commerces, alliances et personnages liés à l'écrit (Shard-API crud_livres).
// Lier demande des droits sur l'écrit (auth) et sur ce qu'on lie : le formulaire ne propose donc que ce que
// l'utilisateur gère (dirigeant, chef de file, joueur du personnage ; tout pour un administrateur).
// Livre : lier une civilisation donne à ses dirigeants le droit de le modifier. Journal : aucun droit, il reste à son
// auteur. onLiens(liens) : à chaque chargement.

const SUPPORTS = {
    livre: { nom: 'le livre', charger: getLiensLivre, lier: lierLivre, delier: delierLivre, droits: ' Lier une civilisation donne à ses dirigeants le droit de modifier le livre.' },
    journal: { nom: 'le journal', charger: getLiensJournal, lier: lierJournal, delier: delierJournal, droits: '' },
};

const capitaliser = (texte) => texte.charAt(0).toUpperCase() + texte.slice(1);

// Ce que l'utilisateur peut lier, par type : [{ value, label }]. Un administrateur peut tout lier (comme l'API) :
// toutes les civilisations, religions, commerces et alliances, et les personnages de tous les joueurs.
// Guerres (validées) : toutes pour un modérateur RP, sinon celles où l'une de ses civilisations ou religions est engagée.
async function chargerChoix(user) {
    const [religions, commerces, alliances, civilisations, guerres, personnages] = await Promise.all([
        getReligions().catch(() => []),
        getCommerces().catch(() => []),
        getAlliances().catch(() => []),
        getCivilisations().catch(() => []),
        getGuerres().catch(() => []),
        (user.is_admin ? getPersonnages() : getPersonnagesOfUser(user.id)).catch(() => []),
    ]);
    const tous = (items, key) => (Array.isArray(items) ? items : []).map((item) => item[key]).filter(Boolean);
    const civsGerees = new Set(managedEntities(civilisations, 'civilisation').map((civ) => civ.id));
    const religionsGerees = new Set(managedEntities(religions, 'religion').map((religion) => religion.id));
    const gereBelligerant = ({ camps }) => Object.values(camps || {}).flat().some(({ status, entite }) => status === 'engage' && !entite.deleted
        && (entite.type === 'religion' ? religionsGerees : civsGerees).has(entite.id));
    const guerresGerees = (Array.isArray(guerres) ? guerres : []).filter((item) => isModerateur(user) || gereBelligerant(item)).map((item) => item.guerre);
    const alliancesGerees = user.is_admin
        ? tous(alliances, 'alliance')
        : (Array.isArray(alliances) ? alliances : []).filter((item) => civsGerees.has(item.chef_de_file?.id)).map((item) => item.alliance);
    return {
        civilisation: toOptions(user.is_admin ? tous(civilisations, 'civilisation') : managedEntities(civilisations, 'civilisation')),
        religion: toOptions(user.is_admin ? tous(religions, 'religion') : managedEntities(religions, 'religion')),
        commerce: toOptions(user.is_admin ? tous(commerces, 'commerce') : managedEntities(commerces, 'commerce')),
        alliance: toOptions(alliancesGerees),
        guerre: toOptions(guerresGerees),
        // Personnages d'autres joueurs (administrateur) : le nom du joueur les distingue
        personnage: (Array.isArray(personnages) ? personnages : [])
            .map(({ personnage, joueur }) => ({ value: personnage.id, label: user.is_admin && joueur && joueur.id !== user.id ? `${personnage.name} (${joueur.full_name || joueur.username})` : personnage.name }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    };
}

export default function LivreLiensSection({ ecrit, support = 'livre', auth, onLiens = () => { } }) {
    const conf = SUPPORTS[support];
    const MODAL_ID = `${support}-lien-modal`;
    const user = getSessionUser();
    const [liens, setLiens] = useState([]);
    const [choix, setChoix] = useState(null);
    const [edition, setEdition] = useState(0);

    const charger = () => conf.charger(ecrit.id)
        .then((data) => {
            const liste = Array.isArray(data) ? data : [];
            setLiens(liste);
            onLiens(liste);
        })
        .catch(() => setLiens([]));

    useEffect(() => {
        charger();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ecrit.id, support]);

    useEffect(() => { if (edition) showModalID(MODAL_ID); }, [edition, MODAL_ID]);

    const ouvrir = async () => {
        if (!choix) setChoix(await chargerChoix(user));
        setEdition((n) => n + 1);
    };

    const lier = async (values) => {
        const data = await conf.lier(ecrit.id, values.entity_type, Number(values.entity_id));
        Swal.fire({ icon: 'success', title: 'Succès', text: data?.text ?? "C'est fait." });
        charger();
    };

    const delier = async (lien) => {
        const result = await runAction(() => conf.delier(lien.id), {
            confirm: { title: `Retirer le lien avec « ${lien.entite.title} » ?`, text: `${capitaliser(conf.nom)} ne figurera plus sur sa fiche.`, button: 'Retirer' },
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
                    title={`Lier « ${ecrit.title} »`}
                    intro={`${capitaliser(conf.nom)} figurera aussi sur sa fiche. ${user?.is_admin ? 'Administrateur : tout est proposé.' : 'Seul ce que vous gérez est proposé.'}${conf.droits}`}
                    fields={[
                        { name: 'entity_type', label: 'Lier à', type: 'radio', required: true, resets: ['entity_id'], options: Object.entries(LIENS_LIVRES).map(([value, { label }]) => ({ value, label })) },
                        {
                            name: 'entity_id', label: 'Lequel', type: 'select', required: true,
                            options: (values) => choix[values.entity_type] || [],
                            empty: (values) => (values.entity_type ? `Vous ne gérez aucun(e) ${LIENS_LIVRES[values.entity_type].label.toLowerCase()}.` : `Choisissez d'abord à quoi lier ${conf.nom}.`),
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
