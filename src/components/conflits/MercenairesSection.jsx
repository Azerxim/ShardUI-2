import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import FormModal from '@/components/modals/FormModal';
import { showModalID } from '@/utils/showModal';
import { plural } from '@/utils/plural';
import { runAction } from '@/utils/conflits';
import { creerCompagnie, dissoudreCompagnie, getMercenaires, getMercenairesCivilisation, modifierCompagnie, rompreContrat } from '@/services/api';

// ===== Compagnies de mercenaires =====
// Déclarées par une civilisation dans une de ses villes (Shard-API crud_troupes) : leurs soldats sont pris sur l'armée
// autorisée de la ville. Un belligérant les engage depuis la fiche de sa guerre ; elles rejoignent son camp sans que la
// civilisation entre en guerre. Fiche de la civilisation : MercenairesSection ; page des guerres : MarcheMercenaires.

const MODAL_IDS = { creer: 'mercenaires-creer-modal', modifier: 'mercenaires-modifier-modal' };

const STATUTS = {
    disponible: { label: 'À louer', badge: 'badge-success' },
    sous_contrat: { label: 'Sous contrat', badge: 'badge-warning' },
};

// Carte d'une compagnie ; children : actions ou détails du contrat
export function CompagnieCard({ compagnie, avecCivilisation = false, children = null }) {
    const statut = STATUTS[compagnie.status] ?? { label: compagnie.status, badge: 'badge-ghost' };
    return (
        <li aria-label={compagnie.title} className="flex flex-col gap-2 bg-base-100 rounded-xl p-3">
            <div className="flex flex-row flex-wrap items-center gap-2">
                <FontAwesomeIcon icon="fa-solid fa-coins" className="opacity-70" />
                <span className="font-bold break-words flex-1 min-w-0">{compagnie.title}</span>
                <span className="badge badge-sm badge-neutral tabular-nums">{plural(compagnie.effectif, 'soldat')}</span>
                <span className={`badge badge-sm ${statut.badge}`}>{statut.label}</span>
            </div>
            <span className="text-sm opacity-80">
                {avecCivilisation ? <a href={`/civilisation/${compagnie.civilisation.id}`} className="link link-hover">{compagnie.civilisation.title}</a> : null}
                {avecCivilisation && compagnie.ville ? ' · ' : ''}
                {compagnie.ville ? `recrutée à ${compagnie.ville.title}` : ''}
            </span>
            {compagnie.tarif ? <span className="text-sm"><FontAwesomeIcon icon="fa-solid fa-gem" className="mr-2 opacity-70" />{compagnie.tarif}</span> : null}
            {compagnie.description ? <p className="text-sm whitespace-pre-wrap break-words">{compagnie.description}</p> : null}
            {children}
        </li>
    );
}

// Où sert une compagnie sous contrat (visible de sa civilisation et des modérateurs RP)
function Contrat({ contrat }) {
    const { guerre, troupe } = contrat;
    const position = troupe.position === 'champ_de_bataille'
        ? `sur le champ de bataille : ${troupe.zone?.title}`
        : troupe.zone ? `en mouvement vers ${troupe.zone.title}` : 'en mouvement';
    return (
        <span className="text-sm bg-warning/15 rounded-lg px-2 py-1">
            Au service de <strong>{troupe.employeur?.title}</strong> dans <a href={`/guerre/${guerre.id}`} className="link">{guerre.title}</a>, {position}.
        </span>
    );
}

const compagnieFields = (villes = null) => [
    ...(villes ? [{
        name: 'ville_id', label: 'Ville de recrutement', type: 'select', required: true,
        options: villes.map((ville) => ({ value: ville.id, label: `${ville.title} (${plural(ville.disponibles, 'soldat disponible', 'soldats disponibles')})` })),
        empty: 'Cette civilisation n\'a aucune ville où recruter.',
        help: 'Ses soldats sont pris sur l\'armée autorisée de la ville (un pour dix habitants), comme les troupes levées en guerre.',
    }] : []),
    { name: 'title', label: 'Nom de la compagnie', type: 'text', required: true, placeholder: 'Les Lames grises, compagnie du Corbeau…' },
    { name: 'effectif', label: 'Effectif', type: 'number', required: true },
    { name: 'tarif', label: 'Tarif', type: 'text', placeholder: '30 tetras par bataille, la moitié du butin…' },
    { name: 'description', label: 'Présentation', type: 'textarea', placeholder: 'Spécialité, réputation, conditions…' },
];

export default function MercenairesSection({ civilisationId }) {
    const [data, setData] = useState(null);
    const [version, setVersion] = useState(0);
    const [cible, setCible] = useState(null);

    useEffect(() => {
        let annule = false;
        getMercenairesCivilisation(civilisationId)
            .then((result) => { if (!annule) setData(result); })
            .catch(() => { if (!annule) setData({ compagnies: [], gere: false, villes: [] }); });
        return () => { annule = true; };
    }, [civilisationId, version]);

    useEffect(() => {
        if (cible) showModalID(MODAL_IDS[cible.modal]);
    }, [cible]);

    const reload = () => setVersion((v) => v + 1);
    const submit = async (request) => {
        const result = await request();
        Swal.fire({ icon: 'success', title: 'Succès', text: result?.text ?? "C'est fait." });
        reload();
    };
    const ouvrir = (modal, objet = null) => setCible((prev) => ({ modal, objet, n: (prev?.n ?? 0) + 1 }));

    if (!data || (data.compagnies.length === 0 && !data.gere)) return null;

    const FctMercenaires = [
        {
            id: 1, title: 'Déclarer', icon: 'fas fa-plus', class: 'bg-base-200 hover:bg-base-300', connected: true, authorisation: data.gere,
            tooltip: { text: 'Déclarer une compagnie de mercenaires à louer', position: 'bottom' }, function: () => ouvrir('creer'),
        },
    ];

    return (
        <section id="mercenaires" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Mercenaires" icon="fas fa-coins" fonctions={FctMercenaires} aide="mercenaire" />
            {data.compagnies.length === 0 ? (
                <i className="w-full">Aucune compagnie déclarée : louez vos soldats aux belligérants sans entrer dans leurs guerres.</i>
            ) : (
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full items-start">
                    {data.compagnies.map((compagnie) => (
                        <CompagnieCard key={compagnie.id} compagnie={compagnie}>
                            {compagnie.contrat ? <Contrat contrat={compagnie.contrat} /> : null}
                            {data.gere ? (
                                <div className="flex flex-row flex-wrap gap-1">
                                    {compagnie.status === 'disponible' ? (
                                        <>
                                            <button type="button" className="btn btn-xs btn-ghost bg-base-200" onClick={() => ouvrir('modifier', compagnie)}>
                                                <FontAwesomeIcon icon="fa-solid fa-pen" />Modifier
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-xs btn-ghost bg-base-200 text-error"
                                                onClick={() => runAction(() => dissoudreCompagnie(compagnie.id), {
                                                    confirm: { title: 'Dissoudre cette compagnie ?', text: `Les soldats de « ${compagnie.title} » redeviennent disponibles dans leur ville.`, button: 'Dissoudre' },
                                                }).then((result) => { if (result) reload(); })}
                                            >
                                                <FontAwesomeIcon icon="fa-solid fa-trash" />Dissoudre
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-ghost bg-base-200 text-error"
                                            onClick={() => runAction(() => rompreContrat(compagnie.id), {
                                                confirm: { title: 'Rompre le contrat ?', text: `« ${compagnie.title} » quitte la guerre et revient à votre civilisation.`, button: 'Rompre le contrat' },
                                            }).then((result) => { if (result) reload(); })}
                                        >
                                            <FontAwesomeIcon icon="fa-solid fa-handshake-slash" />Rompre le contrat
                                        </button>
                                    )}
                                </div>
                            ) : null}
                        </CompagnieCard>
                    ))}
                </ul>
            )}

            {cible?.modal === 'creer' ? (
                <FormModal
                    key={`creer-${cible.n}`}
                    id={MODAL_IDS.creer}
                    title="Déclarer une compagnie de mercenaires"
                    intro="Elle sera proposée aux belligérants de toutes les guerres où votre civilisation n'est pas engagée."
                    fields={compagnieFields(data.villes)}
                    submitLabel="Déclarer"
                    submitIcon="fas fa-coins"
                    onSubmit={(values) => submit(() => creerCompagnie({ ...values, ville_id: Number(values.ville_id), effectif: Number(values.effectif) }))}
                />
            ) : null}
            {cible?.modal === 'modifier' ? (
                <FormModal
                    key={`modifier-${cible.n}`}
                    id={MODAL_IDS.modifier}
                    title={`Modifier « ${cible.objet.title} »`}
                    fields={compagnieFields()}
                    initialValues={{ title: cible.objet.title, effectif: cible.objet.effectif, tarif: cible.objet.tarif ?? '', description: cible.objet.description ?? '' }}
                    submitLabel="Enregistrer"
                    onSubmit={(values) => submit(() => modifierCompagnie(cible.objet.id, { ...values, effectif: Number(values.effectif) }))}
                />
            ) : null}
        </section>
    );
}

// Page des guerres : compagnies à louer de toutes les civilisations publiques
export function MarcheMercenaires() {
    const [compagnies, setCompagnies] = useState([]);

    useEffect(() => {
        getMercenaires().then((list) => setCompagnies(Array.isArray(list) ? list : [])).catch(() => setCompagnies([]));
    }, []);

    if (compagnies.length === 0) return null;
    return (
        <section id="mercenaires" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Mercenaires à louer" icon="fas fa-coins" aide="mercenaire" />
            <p className="text-sm opacity-70 px-1">Les belligérants d'une guerre en cours les engagent depuis la section « Troupes » de leur guerre.</p>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full items-start">
                {compagnies.map((compagnie) => <CompagnieCard key={compagnie.id} compagnie={compagnie} avecCivilisation />)}
            </ul>
        </section>
    );
}
