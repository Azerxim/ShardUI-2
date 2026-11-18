import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TitleH2 from "@/components/ui/TitleH2";
import { getDemandesAdhesion, repondreDemandeAdhesion } from "@/services/api";
import { formatDate } from "@/utils/conflits";

// Demandes d'adhésion en attente d'une civilisation, pour son Fondateur, ses Admins et les administrateurs du site
// (Shard-API crud_adhesions). Accepter fait du joueur un Membre : onAccepte recharge la liste des membres.
// Rien n'est affiché quand aucune demande n'attend.
export default function DemandesAdhesion({ civilisationId, onAccepte }) {
    const [demandes, setDemandes] = useState([]);
    const [enCours, setEnCours] = useState(null);
    const [erreur, setErreur] = useState(null);

    useEffect(() => {
        let annule = false;
        getDemandesAdhesion(civilisationId)
            .then((liste) => { if (!annule) setDemandes(Array.isArray(liste) ? liste : []); })
            .catch(() => { if (!annule) setDemandes([]); });
        return () => { annule = true; };
    }, [civilisationId]);

    const repondre = async (demande, accepter) => {
        setEnCours(demande.id);
        setErreur(null);
        try {
            await repondreDemandeAdhesion(demande.id, accepter);
            setDemandes((liste) => liste.filter((item) => item.id !== demande.id));
            if (accepter) onAccepte?.();
        } catch (error) {
            setErreur(error.message);
        } finally {
            setEnCours(null);
        }
    };

    if (!demandes.length) return null;

    return (
        <section id="demandes-adhesion" className="flex flex-col gap-2 scroll-mt-24">
            <TitleH2 text={`Demandes d'adhésion (${demandes.length})`} icon="fas fa-hand" />
            {erreur ? <p role="alert" className="text-sm text-error">{erreur}</p> : null}
            <ul className="flex flex-col gap-2">
                {demandes.map((demande) => (
                    <li key={demande.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-base-200 rounded-2xl p-3">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span>
                                <a href={`/profil/${demande.user_id}`} className="font-semibold link link-hover">{demande.username || "Un joueur"}</a>
                                <span className="text-sm opacity-60"> · {formatDate(demande.created_at)}</span>
                            </span>
                            {demande.message ? <p className="text-sm opacity-80 whitespace-pre-line break-words">{demande.message}</p> : null}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button type="button" className="btn btn-sm btn-success" onClick={() => repondre(demande, true)} disabled={enCours !== null}>
                                {enCours === demande.id ? <span className="loading loading-spinner loading-xs"></span> : <FontAwesomeIcon icon="fa-solid fa-check" />}
                                Accepter
                            </button>
                            <button type="button" className="btn btn-sm btn-ghost bg-base-100" onClick={() => repondre(demande, false)} disabled={enCours !== null}>
                                <FontAwesomeIcon icon="fa-solid fa-xmark" />
                                Refuser
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
