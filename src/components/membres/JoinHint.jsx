import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getSessionUser } from "@/services/session";
import { demanderAdhesion, getMesDemandesAdhesion, retirerDemandeAdhesion } from "@/services/api";

// Explique à un non-membre comment rejoindre une civilisation, une religion ou un commerce.
// entity : "cette civilisation", "cette religion", "ce commerce"… Rien n'est affiché pour un membre ou un administrateur.
// civilisationId : pour une civilisation, le joueur connecté envoie une demande d'adhésion à ses dirigeants
// (Shard-API crud_adhesions) et voit ensuite qu'elle attend, avec de quoi la retirer.
export default function JoinHint({ members = [], entity = "cette civilisation", civilisationId = null }) {
    const user = getSessionUser();
    const membre = user && (user.is_admin || members.some((member) => member.user_id === user.id));
    const founder = members.find((member) => member.role === "Fondateur");

    if (membre) return null;

    // Mise en ligne selon la largeur de l'encart (requête de conteneur) : empilé dans la colonne étroite d'une fiche
    return (
        <div className="@container w-full">
            <div role="note" className="flex flex-col @lg:flex-row @lg:items-center gap-3 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
                <FontAwesomeIcon icon="fa-solid fa-circle-info" className="text-info text-xl shrink-0" />
                {!user ? (
                    <>
                        <p className="flex-1">Connectez-vous pour rejoindre {entity} ou demander à en faire partie.</p>
                        <div className="flex flex-row flex-wrap gap-2">
                            <a href="/login" className="btn btn-sm btn-primary">Se connecter</a>
                            <a href="/register" className="btn btn-sm btn-ghost bg-base-100">Créer un compte</a>
                        </div>
                    </>
                ) : civilisationId ? (
                    <DemandeAdhesion civilisationId={civilisationId} founder={founder} />
                ) : (
                    <p className="flex-1">
                        Pour rejoindre {entity}, contactez {founder?.username ? <>son fondateur <strong>{founder.username}</strong></> : "son fondateur"} ou l'un de ses admins : ce sont eux qui ajoutent les nouveaux membres.
                    </p>
                )}
            </div>
        </div>
    );
}

function DemandeAdhesion({ civilisationId, founder }) {
    const [demande, setDemande] = useState(undefined); // undefined : chargement ; null : aucune en attente
    const [ouvert, setOuvert] = useState(false);
    const [message, setMessage] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        let annule = false;
        getMesDemandesAdhesion()
            .then((liste) => { if (!annule) setDemande((Array.isArray(liste) ? liste : []).find((item) => String(item.civilisation_id) === String(civilisationId)) ?? null); })
            .catch(() => { if (!annule) setDemande(null); });
        return () => { annule = true; };
    }, [civilisationId]);

    const agir = async (action) => {
        setEnvoi(true);
        setErreur(null);
        try {
            await action();
        } catch (error) {
            setErreur(error.message);
        } finally {
            setEnvoi(false);
        }
    };

    const envoyer = (event) => {
        event.preventDefault();
        agir(async () => {
            const data = await demanderAdhesion(civilisationId, message.trim());
            setDemande(data.demande);
            setOuvert(false);
            setMessage("");
        });
    };

    const retirer = () => agir(async () => {
        await retirerDemandeAdhesion(demande.id);
        setDemande(null);
    });

    const dirigeants = founder?.username ? <>son fondateur <strong>{founder.username}</strong> ou ses admins</> : "ses dirigeants";

    if (demande === undefined) return <span className="loading loading-dots loading-sm" aria-label="Chargement de votre demande"></span>;

    if (demande) {
        return (
            <>
                <p className="flex-1" aria-live="polite">
                    <FontAwesomeIcon icon="fa-solid fa-hourglass-half" className="mr-2 text-warning" />
                    Votre demande pour rejoindre cette civilisation attend la réponse de {dirigeants}. Vous serez notifié de leur décision.
                </p>
                <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={retirer} disabled={envoi}>Retirer ma demande</button>
                {erreur ? <p role="alert" className="text-sm text-error w-full">{erreur}</p> : null}
            </>
        );
    }

    if (!ouvert) {
        return (
            <>
                <p className="flex-1">
                    Pour rejoindre cette civilisation et y installer vos personnages, envoyez une demande : {dirigeants} l'acceptent ou la refusent.
                </p>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setOuvert(true)}>
                    <FontAwesomeIcon icon="fa-solid fa-hand" />
                    Demander à rejoindre
                </button>
            </>
        );
    }

    return (
        <form onSubmit={envoyer} className="flex flex-col gap-2 flex-1 min-w-0">
            <label htmlFor={`demande-adhesion-${civilisationId}`} className="text-sm font-semibold">Un mot pour vous présenter (facultatif)</label>
            <textarea
                id={`demande-adhesion-${civilisationId}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Qui êtes-vous, quel personnage voulez-vous y jouer ?"
                className="textarea textarea-ghost bg-base-100 w-full"
            />
            {erreur ? <p role="alert" className="text-sm text-error">{erreur}</p> : null}
            <div className="flex flex-wrap justify-end gap-2">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOuvert(false)} disabled={envoi}>Annuler</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={envoi}>
                    {envoi ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon="fa-solid fa-paper-plane" />}
                    Envoyer la demande
                </button>
            </div>
        </form>
    );
}
