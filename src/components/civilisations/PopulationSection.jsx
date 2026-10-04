import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2';

import TitleH2 from '@/components/ui/TitleH2';
import { deciderAjustement, demanderAjustement, getPopulationVille, retirerAjustement } from '@/services/api';
import { getSessionUser } from '@/services/session';
import { isModerateur } from '@/utils/conflits';
import { alerteErreur } from '@/utils/alerteErreur';

// ===== Population officielle d'une ville =====
// Mesure du dernier relevé de la sauvegarde + écarts motivés acceptés par un modérateur RP (Shard-API crud_population).
// Les dirigeants de la civilisation demandent un ajustement ; un modérateur l'accepte ou le refuse (jamais la sienne),
// et peut retirer un écart accepté. onCharge(officielle) met à jour le chiffre clé de la fiche.

const nombre = (valeur) => Number(valeur || 0).toLocaleString('fr-FR');
const ecartTexte = (ecart) => `${ecart > 0 ? '+' : '−'}${nombre(Math.abs(ecart))}`;
const dateCourte = (date) => (date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null);
const nom = (user) => user?.full_name || user?.username || 'compte supprimé';

function Ajustement({ ajustement, actions = null }) {
    return (
        <li className="flex flex-col sm:flex-row sm:items-center gap-2 bg-base-100 rounded-xl p-3">
            <span className={`badge badge-lg font-bold tabular-nums shrink-0 ${ajustement.ecart > 0 ? 'badge-success' : 'badge-error'} badge-soft`}>{ecartTexte(ajustement.ecart)}</span>
            <span className="flex-1 min-w-0">
                <span className="block break-words">{ajustement.motif}</span>
                <span className="block text-xs opacity-60">
                    Demandé par {nom(ajustement.demande_par)} le {dateCourte(ajustement.demande_at)}
                    {ajustement.status === 'accepte' && ajustement.moderateur ? ` · validé par ${nom(ajustement.moderateur)} le ${dateCourte(ajustement.decision_at)}` : ''}
                    {ajustement.decision_note ? ` — ${ajustement.decision_note}` : ''}
                </span>
            </span>
            {actions && <span className="flex flex-wrap gap-1 shrink-0">{actions}</span>}
        </li>
    );
}

export default function PopulationSection({ ville, auth, onCharge = () => { } }) {
    const user = getSessionUser();
    const moderateur = isModerateur(user);
    const [population, setPopulation] = useState(null);

    const charger = () => getPopulationVille(ville.id)
        .then((data) => { setPopulation(data); onCharge(data.officielle); })
        .catch(() => setPopulation(null));

    useEffect(() => {
        charger();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ville.id]);

    const demander = async () => {
        const answer = await Swal.fire({
            title: 'Demander un ajustement',
            html: `<p class="text-sm mb-3">Un écart ajouté à la population mesurée (+40 réfugiés, −30 morts de la peste), validé par un modérateur RP. Il reste valable d'un relevé à l'autre.</p>`,
            input: 'number',
            inputLabel: 'Écart (positif ou négatif)',
            inputPlaceholder: 'Ex. 40 ou -30',
            showCancelButton: true,
            confirmButtonText: 'Suivant',
            cancelButtonText: 'Annuler',
            inputValidator: (value) => (!Number.parseInt(value, 10) ? "L'écart doit être un nombre non nul." : null),
        });
        if (!answer.isConfirmed) return;
        const ecart = Number.parseInt(answer.value, 10);
        const motif = await Swal.fire({
            title: `Motif de l'écart ${ecartTexte(ecart)}`,
            input: 'textarea',
            inputPlaceholder: 'Ex. arrivée des réfugiés de Narva après la guerre des Cendres',
            showCancelButton: true,
            confirmButtonText: 'Envoyer la demande',
            cancelButtonText: 'Annuler',
            inputValidator: (value) => (!value?.trim() ? 'Le motif est obligatoire.' : null),
        });
        if (!motif.isConfirmed) return;
        try {
            await demanderAjustement({ ville_id: ville.id, ecart, motif: motif.value.trim() });
            await Swal.fire({ icon: 'success', title: 'Demande envoyée', text: "Elle attend la validation d'un modérateur RP." });
            charger();
        } catch (error) {
            alerteErreur('Demande impossible', error);
        }
    };

    const decider = async (ajustement, accepte) => {
        const answer = await Swal.fire({
            icon: accepte ? 'question' : 'warning',
            title: `${accepte ? 'Accepter' : 'Refuser'} l'écart ${ecartTexte(ajustement.ecart)} ?`,
            input: 'text',
            inputPlaceholder: 'Note publique (facultative)',
            showCancelButton: true,
            confirmButtonText: accepte ? 'Accepter' : 'Refuser',
            cancelButtonText: 'Annuler',
        });
        if (!answer.isConfirmed) return;
        try {
            await deciderAjustement(ajustement.id, accepte, answer.value || null);
            charger();
        } catch (error) {
            alerteErreur('Décision impossible', error);
        }
    };

    const retirer = async (ajustement) => {
        const answer = await Swal.fire({
            icon: 'warning',
            title: `Retirer l'écart ${ecartTexte(ajustement.ecart)} ?`,
            text: ajustement.status === 'accepte' ? 'La population officielle ne le comptera plus.' : 'La demande sera annulée.',
            showCancelButton: true,
            confirmButtonText: 'Retirer',
            cancelButtonText: 'Annuler',
        });
        if (!answer.isConfirmed) return;
        try {
            await retirerAjustement(ajustement.id);
            charger();
        } catch (error) {
            alerteErreur('Retrait impossible', error);
        }
    };

    const fonctions = [
        { id: 1, title: 'Ajuster', icon: 'fas fa-scale-balanced', class: 'bg-base-200 hover:bg-base-300', connected: true, authorisation: auth, tooltip: { text: 'Demander un ajustement de population', position: 'left' }, function: demander },
    ];

    const mesure = population?.mesure;
    const totalEcarts = (population?.ajustements || []).reduce((total, a) => total + a.ecart, 0);

    return (
        <section id="population" className="flex flex-col gap-2 w-full scroll-mt-24">
            <TitleH2 text="Population officielle" icon="fas fa-people-group" fonctions={fonctions} aide="population" />
            {population === null ? (
                <div className="flex justify-center py-6 w-full"><span className="loading loading-spinner"></span></div>
            ) : (
                <div className="flex flex-col gap-3 bg-base-200 rounded-2xl p-4">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span className="text-3xl font-bold tabular-nums">{nombre(population.officielle)}</span>
                        <span className="opacity-80">
                            = {nombre(population.mesuree)} mesurés
                            {population.ajustements.length > 0 ? ` ${totalEcarts >= 0 ? '+' : '−'} ${nombre(Math.abs(totalEcarts))} d'ajustement${population.ajustements.length > 1 ? 's' : ''}` : ''}
                        </span>
                    </div>
                    <p className="text-sm opacity-70 flex items-start gap-2">
                        <FontAwesomeIcon icon={mesure?.methode === 'rayon' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-bed'} className={`mt-0.5 ${mesure?.methode === 'rayon' ? 'text-warning' : ''}`} />
                        <span>
                            {mesure
                                ? `Lits habités comptés au relevé du ${dateCourte(mesure.releve_at)}, ${mesure.methode === 'rayon' ? `dans un rayon de ${mesure.rayon ?? '?'} blocs autour de la ville : chiffre approximatif tant que ses frontières ne sont pas tracées.` : 'à l\'intérieur des frontières de la ville.'}`
                                : "Cette ville n'a pas encore été mesurée par un relevé du monde."}
                        </span>
                    </p>

                    {population.ajustements.length > 0 && (
                        <ul className="flex flex-col gap-2">
                            {population.ajustements.map((ajustement) => (
                                <Ajustement
                                    key={ajustement.id}
                                    ajustement={ajustement}
                                    actions={moderateur ? <button type="button" className="btn btn-xs btn-ghost" onClick={() => retirer(ajustement)}>Retirer</button> : null}
                                />
                            ))}
                        </ul>
                    )}

                    {population.en_attente.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold flex items-center gap-2">
                                <FontAwesomeIcon icon="fa-solid fa-hourglass-half" className="text-warning" />
                                En attente de validation par un modérateur RP
                            </p>
                            <ul className="flex flex-col gap-2">
                                {population.en_attente.map((ajustement) => {
                                    const mienne = ajustement.demande_par?.id === user?.id;
                                    return (
                                        <Ajustement
                                            key={ajustement.id}
                                            ajustement={ajustement}
                                            actions={(
                                                <>
                                                    {moderateur && !mienne && <button type="button" className="btn btn-xs btn-success" onClick={() => decider(ajustement, true)}>Accepter</button>}
                                                    {moderateur && !mienne && <button type="button" className="btn btn-xs btn-error btn-soft" onClick={() => decider(ajustement, false)}>Refuser</button>}
                                                    {(mienne || moderateur) && <button type="button" className="btn btn-xs btn-ghost" onClick={() => retirer(ajustement)}>Retirer</button>}
                                                </>
                                            )}
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
