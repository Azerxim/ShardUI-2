import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import FormModal from '@/components/modals/FormModal';
import { CompagnieCard } from '@/components/conflits/MercenairesSection';
import { showModalID } from '@/utils/showModal';
import { plural } from '@/utils/plural';
import { runAction } from '@/utils/conflits';
import { demobiliserTroupe, deplacerTroupe, engagerMercenaires, getTroupesGuerre, leverTroupe, modifierTroupe } from '@/services/api';

// ===== Troupes d'une guerre =====
// Levées ville par ville par les civilisations engagées (Shard-API crud_troupes) : au plus un soldat pour dix habitants
// de la ville, toutes guerres en cours confondues. Une troupe mobilisée est toujours sur un champ de bataille (zone de
// conflit de la guerre) ou en mouvement. Chaque camp ne voit que ses troupes ; les modérateurs RP voient tout, et tout
// le monde une fois la guerre terminée. Un belligérant y engage aussi des compagnies de mercenaires (MercenairesSection) :
// elles rejoignent son camp sans que leur civilisation entre dans la guerre.

const CAMPS = [
    { cle: 'attaquant', titre: 'Camp attaquant', icon: 'fa-solid fa-khanda' },
    { cle: 'defenseur', titre: 'Camp défenseur', icon: 'fa-solid fa-shield-halved' },
];
const MODAL_IDS = { lever: 'troupe-lever-modal', deplacer: 'troupe-deplacer-modal', modifier: 'troupe-modifier-modal', engager: 'troupe-engager-modal' };

const soldats = (n) => plural(n, 'soldat');

// Onglets de position : sur un champ de bataille (sans zone tracée, impossible) ou en mouvement
const positionField = (champs) => {
    const zones = champs.map((zone) => ({ value: zone.id, label: zone.title }));
    const champ = {
        value: 'champ_de_bataille', label: 'Sur un champ de bataille',
        aide: 'La troupe occupe une zone de conflit tracée pour cette guerre.',
        fields: [{ name: 'zone_id', label: 'Champ de bataille', type: 'select', required: true, options: zones }],
    };
    const mouvement = {
        value: 'en_mouvement', label: 'En mouvement',
        aide: champs.length ? 'La troupe fait route, vers une zone de conflit ou sans destination annoncée.' : 'Aucune zone de conflit n\'est tracée : la troupe ne peut qu\'être en mouvement.',
        fields: zones.length ? [{ name: 'destination_id', label: 'Destination', type: 'select', placeholder: 'Sans destination annoncée', options: zones }] : [],
    };
    return { name: 'position', label: 'Position', type: 'onglets', options: champs.length ? [champ, mouvement] : [mouvement] };
};

// Position choisie dans le formulaire -> corps de l'API
const positionBody = (values) => {
    const position = values.position || 'en_mouvement';
    const zone = position === 'champ_de_bataille' ? values.zone_id : values.destination_id;
    return { position, zone_id: zone ? Number(zone) : null };
};

function PositionTroupe({ troupe }) {
    if (troupe.position === 'champ_de_bataille') {
        return <span className="flex flex-row items-center gap-2"><FontAwesomeIcon icon="fa-solid fa-flag" className="text-error" />Sur le champ de bataille : <strong>{troupe.zone?.title}</strong></span>;
    }
    return (
        <span className="flex flex-row items-center gap-2">
            <FontAwesomeIcon icon="fa-solid fa-person-hiking" className="text-info" />
            {troupe.zone ? <>En mouvement vers <strong>{troupe.zone.title}</strong></> : 'En mouvement, sans destination annoncée'}
        </span>
    );
}

function TroupeCard({ troupe, onDeplacer, onModifier, onDemobiliser }) {
    const mobilisee = troupe.status === 'mobilisee';
    return (
        <li aria-label={troupe.title} className={`flex flex-col gap-2 bg-base-100 rounded-xl p-3 ${mobilisee ? '' : 'opacity-70'}`}>
            <div className="flex flex-row flex-wrap items-center gap-2">
                <FontAwesomeIcon icon="fa-solid fa-people-group" className="opacity-70" />
                <span className="font-bold break-words flex-1 min-w-0">{troupe.title}</span>
                <span className="badge badge-sm badge-neutral tabular-nums">{soldats(troupe.effectif)}</span>
                {troupe.mercenaire_id ? <span className="badge badge-sm badge-warning">Mercenaires</span> : null}
                {mobilisee ? null : <span className="badge badge-sm badge-ghost">Démobilisée</span>}
            </div>
            <span className="text-sm opacity-80">
                {troupe.mercenaire_id
                    ? `Compagnie de ${troupe.civilisation?.title}, au service de ${troupe.employeur?.title}`
                    : `${troupe.civilisation?.title}${troupe.ville ? ` · levée à ${troupe.ville.title}` : ''}`}
            </span>
            {mobilisee ? <span className="text-sm"><PositionTroupe troupe={troupe} /></span> : null}
            {troupe.peut_commander ? (
                <div className="flex flex-row flex-wrap gap-1">
                    <button type="button" className="btn btn-xs btn-ghost bg-base-200" onClick={() => onDeplacer(troupe)}>
                        <FontAwesomeIcon icon="fa-solid fa-route" />Déplacer
                    </button>
                    <button type="button" className="btn btn-xs btn-ghost bg-base-200" onClick={() => onModifier(troupe)}>
                        <FontAwesomeIcon icon="fa-solid fa-pen" />{troupe.mercenaire_id ? 'Pertes' : 'Effectif'}
                    </button>
                    <button type="button" className="btn btn-xs btn-ghost bg-base-200 text-error" onClick={() => onDemobiliser(troupe)}>
                        <FontAwesomeIcon icon="fa-solid fa-house-flag" />{troupe.mercenaire_id ? 'Renvoyer' : 'Démobiliser'}
                    </button>
                </div>
            ) : null}
        </li>
    );
}

// onData : reçoit chaque réponse de l'API (la page en tire les troupes de sa carte) ; fonction stable (setter d'état)
export default function TroupesSection({ guerre, reloadKey = 0, onChange = () => { }, onData = null }) {
    const [data, setData] = useState(null);
    // Ville à lever ou troupe commandée ; n relance l'ouverture de la modale si l'on reclique sur la même
    const [cible, setCible] = useState(null);

    useEffect(() => {
        let annule = false;
        getTroupesGuerre(guerre.id)
            .then((result) => {
                if (annule) return;
                setData(result);
                onData?.(result);
            })
            .catch(() => { if (!annule) setData({ champs: [], camps_visibles: [], troupes: { attaquant: null, defenseur: null }, levees: [] }); });
        return () => { annule = true; };
    }, [guerre.id, reloadKey, onData]);

    useEffect(() => {
        if (cible) showModalID(MODAL_IDS[cible.modal]);
    }, [cible]);

    // La page recharge la guerre (chronologie des déplacements publics) et change reloadKey, ce qui recharge les troupes
    const reload = () => onChange();
    const submit = async (request, success = null) => {
        const result = await request();
        Swal.fire({ icon: 'success', title: 'Succès', text: success ?? result?.text ?? "C'est fait." });
        reload();
    };
    const ouvrir = (modal, objet) => setCible((prev) => ({ modal, objet, n: (prev?.n ?? 0) + 1 }));

    if (data === null) {
        return (
            <section id="troupes" className="flex flex-col gap-2 w-full scroll-mt-24">
                <TitleH2 text="Troupes" icon="fas fa-people-group" aide="troupe" />
                <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>
            </section>
        );
    }

    const enCours = guerre.status === 'en_cours';
    const champs = data.champs || [];

    return (
        <section id="troupes" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Troupes" icon="fas fa-people-group" aide="troupe" />
            <p className="text-sm opacity-70 px-1">
                Chaque ville fournit au plus un soldat pour dix habitants, toutes guerres en cours confondues. Une troupe est toujours sur un champ de bataille ou en mouvement ;
                seuls son camp et les modérateurs RP la voient jusqu'à la fin de la guerre.
            </p>

            {enCours && data.levees.map(({ camp, civilisation, villes }) => (
                <div key={civilisation.id} role="region" aria-label={`Levée de ${civilisation.title}`} className="flex flex-col gap-2 w-full bg-base-200 rounded-2xl p-3">
                    <h3 className="flex flex-row flex-wrap items-center gap-2 font-bold">
                        <FontAwesomeIcon icon="fa-solid fa-bullhorn" />
                        Lever des troupes · {civilisation.title}
                        <span className="font-normal text-sm opacity-70">({camp === 'attaquant' ? 'camp attaquant' : 'camp défenseur'})</span>
                    </h3>
                    {villes.length === 0 ? <i className="text-sm opacity-70">Cette civilisation n'a aucune ville où lever des troupes.</i> : (
                        <ul className="flex flex-col gap-2">
                            {villes.map((ville) => (
                                <li key={ville.id} className="flex flex-row flex-wrap items-center gap-2 bg-base-100 rounded-xl px-3 py-2">
                                    <FontAwesomeIcon icon="fa-solid fa-city" className="opacity-70" />
                                    <span className="font-semibold flex-1 min-w-0 truncate">{ville.title}</span>
                                    <span className="text-sm opacity-70 tabular-nums">
                                        {plural(ville.population, 'habitant')} · {ville.mobilises} / {soldats(ville.armee)} mobilisé{ville.mobilises > 1 ? 's' : ''}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-error"
                                        disabled={ville.disponibles === 0}
                                        aria-label={`Lever des troupes à ${ville.title}`}
                                        onClick={() => ouvrir('lever', ville)}
                                    >
                                        <FontAwesomeIcon icon="fa-solid fa-plus" />Lever{ville.disponibles ? ` (${ville.disponibles} dispo.)` : ''}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}

            {enCours && data.employeurs?.length ? (
                <div role="region" aria-label="Engager des mercenaires" className="flex flex-col gap-2 w-full bg-base-200 rounded-2xl p-3">
                    <h3 className="flex flex-row flex-wrap items-center gap-2 font-bold">
                        <FontAwesomeIcon icon="fa-solid fa-coins" />
                        Engager des mercenaires
                        <span className="font-normal text-sm opacity-70">(leur civilisation n'entre pas dans la guerre)</span>
                    </h3>
                    {data.mercenaires.length === 0 ? (
                        <i className="text-sm opacity-70">Aucune compagnie n'est à louer pour cette guerre.</i>
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {data.mercenaires.map((compagnie) => (
                                <CompagnieCard key={compagnie.id} compagnie={compagnie} avecCivilisation>
                                    <button type="button" className="btn btn-xs btn-warning w-fit" onClick={() => ouvrir('engager', compagnie)}>
                                        <FontAwesomeIcon icon="fa-solid fa-handshake" />Engager
                                    </button>
                                </CompagnieCard>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full items-start">
                {CAMPS.map(({ cle, titre, icon }) => {
                    const troupes = data.troupes?.[cle];
                    const mobilisees = (troupes || []).filter((troupe) => troupe.status === 'mobilisee');
                    const total = mobilisees.reduce((somme, troupe) => somme + troupe.effectif, 0);
                    return (
                        <div key={cle} role="region" aria-label={`Troupes du ${titre.toLowerCase()}`} className="flex flex-col gap-3 bg-base-200 rounded-2xl p-3">
                            <h3 className="flex flex-row items-center gap-2 font-bold">
                                <FontAwesomeIcon icon={icon} />
                                {titre}
                                {troupes ? <span className="font-normal text-sm opacity-70">· {enCours ? `${soldats(total)} sous les armes` : plural(troupes.length, 'troupe')}</span> : null}
                            </h3>
                            {troupes === null || troupes === undefined ? (
                                <i className="text-sm opacity-70"><FontAwesomeIcon icon="fa-solid fa-eye-slash" className="mr-2" />Troupes cachées : seuls ce camp et les modérateurs RP les voient.</i>
                            ) : troupes.length === 0 ? (
                                <i className="text-sm opacity-70">Aucune troupe levée.</i>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {troupes.map((troupe) => (
                                        <TroupeCard
                                            key={troupe.id}
                                            troupe={troupe}
                                            onDeplacer={(t) => ouvrir('deplacer', t)}
                                            onModifier={(t) => ouvrir('modifier', t)}
                                            onDemobiliser={(t) => runAction(() => demobiliserTroupe(guerre.id, t.id), {
                                                confirm: t.mercenaire_id
                                                    ? { title: 'Renvoyer ces mercenaires ?', text: `« ${t.title} » quitte votre camp et retourne sur le marché.`, button: 'Renvoyer' }
                                                    : { title: 'Démobiliser cette troupe ?', text: `« ${t.title} » rentre chez elle : ses soldats redeviennent disponibles dans leur ville.`, button: 'Démobiliser' },
                                            }).then((result) => { if (result) reload(); })}
                                        />
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>

            {cible?.modal === 'lever' ? (
                <FormModal
                    key={`lever-${cible.n}`}
                    id={MODAL_IDS.lever}
                    title={`Lever des troupes à ${cible.objet.title}`}
                    intro={`${cible.objet.title} peut encore fournir ${soldats(cible.objet.disponibles)}.`}
                    fields={[
                        { name: 'title', label: 'Nom de la troupe', type: 'text', required: true, placeholder: 'Légion de Val, garde du pont…' },
                        { name: 'effectif', label: 'Effectif', type: 'number', required: true, help: `De 1 à ${cible.objet.disponibles} soldats.` },
                        positionField(champs),
                    ]}
                    initialValues={{ position: champs.length ? 'champ_de_bataille' : 'en_mouvement' }}
                    submitLabel="Lever la troupe"
                    submitIcon="fas fa-bullhorn"
                    submitClass="btn-error"
                    onSubmit={(values) => submit(() => leverTroupe(guerre.id, {
                        ville_id: cible.objet.id, title: values.title, effectif: Number(values.effectif), ...positionBody(values),
                    }))}
                />
            ) : null}
            {cible?.modal === 'deplacer' ? (
                <FormModal
                    key={`deplacer-${cible.n}`}
                    id={MODAL_IDS.deplacer}
                    title={`Déplacer « ${cible.objet.title} »`}
                    fields={[
                        positionField(champs),
                        {
                            name: 'secret', label: 'Déplacement', type: 'radio', required: true,
                            options: [{ value: 'public', label: 'Public' }, { value: 'secret', label: 'Secret' }],
                            help: (values) => values.secret === 'secret'
                                ? 'Rien n\'apparaît dans la chronologie : scellez ce déplacement en action secrète avant de le jouer, sinon il n\'a jamais eu lieu.'
                                : 'Inscrit dans la chronologie publique de la guerre (sans l\'effectif).',
                        },
                    ]}
                    initialValues={{
                        position: champs.length ? cible.objet.position : 'en_mouvement',
                        zone_id: cible.objet.position === 'champ_de_bataille' ? cible.objet.zone?.id : '',
                        destination_id: cible.objet.position === 'en_mouvement' ? cible.objet.zone?.id ?? '' : '',
                        secret: 'public',
                    }}
                    submitLabel="Déplacer"
                    submitIcon="fas fa-route"
                    onSubmit={async (values) => {
                        const secret = values.secret === 'secret';
                        if (!secret) return submit(() => deplacerTroupe(guerre.id, cible.objet.id, positionBody(values)));
                        await deplacerTroupe(guerre.id, cible.objet.id, { ...positionBody(values), secret });
                        reload();
                        const answer = await Swal.fire({
                            icon: 'success', title: 'Déplacement secret enregistré',
                            text: 'Scellez-le maintenant en action secrète : révélé sans avoir été scellé, il n\'aurait jamais eu lieu.',
                            showCancelButton: true, confirmButtonText: 'Sceller une action secrète', cancelButtonText: 'Plus tard',
                        });
                        if (answer.isConfirmed) window.location.href = `/actions-secretes?nouvelle=1&guerre=${guerre.id}`;
                    }}
                />
            ) : null}
            {cible?.modal === 'modifier' ? (
                <FormModal
                    key={`modifier-${cible.n}`}
                    id={MODAL_IDS.modifier}
                    title={`Modifier « ${cible.objet.title} »`}
                    intro={cible.objet.mercenaire_id
                        ? 'Inscrivez les pertes de la compagnie : des mercenaires ne reçoivent pas de renforts en pleine guerre.'
                        : 'Inscrivez les pertes, ou des renforts venus de la même ville dans la limite de ses soldats disponibles.'}
                    fields={[
                        ...(cible.objet.mercenaire_id ? [] : [{ name: 'title', label: 'Nom de la troupe', type: 'text', required: true }]),
                        { name: 'effectif', label: 'Effectif', type: 'number', required: true },
                    ]}
                    initialValues={{ title: cible.objet.title, effectif: cible.objet.effectif }}
                    submitLabel="Enregistrer"
                    onSubmit={(values) => submit(() => modifierTroupe(guerre.id, cible.objet.id, { title: values.title, effectif: Number(values.effectif) }))}
                />
            ) : null}
            {cible?.modal === 'engager' ? (
                <FormModal
                    key={`engager-${cible.n}`}
                    id={MODAL_IDS.engager}
                    title={`Engager « ${cible.objet.title} »`}
                    intro={`${soldats(cible.objet.effectif)} de ${cible.objet.civilisation.title} rejoignent votre camp et vous obéissent.${cible.objet.tarif ? ` Tarif annoncé : ${cible.objet.tarif}.` : ''} Le paiement se règle en jeu.`}
                    fields={[
                        {
                            name: 'employeur', label: 'Au nom de', type: 'select', required: true,
                            options: data.employeurs.map((e) => ({ value: `${e.type}:${e.id}`, label: `${e.title} (${e.camp === 'attaquant' ? 'attaquants' : 'défenseurs'})` })),
                        },
                        positionField(champs),
                    ]}
                    initialValues={{
                        employeur: data.employeurs.length === 1 ? `${data.employeurs[0].type}:${data.employeurs[0].id}` : '',
                        position: champs.length ? 'champ_de_bataille' : 'en_mouvement',
                    }}
                    submitLabel="Engager"
                    submitIcon="fas fa-handshake"
                    submitClass="btn-warning"
                    onSubmit={(values) => {
                        const [employeurType, employeurId] = String(values.employeur).split(':');
                        return submit(() => engagerMercenaires(guerre.id, {
                            mercenaire_id: cible.objet.id, employeur_type: employeurType, employeur_id: Number(employeurId), ...positionBody(values),
                        }));
                    }}
                />
            ) : null}
        </section>
    );
}
