import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getSessionUser } from "@/services/session";

// Explique à un non-membre comment rejoindre une civilisation, une religion ou un commerce.
// entity : "cette civilisation", "cette religion", "ce commerce"… Rien n'est affiché pour un membre ou un administrateur.
export default function JoinHint({ members = [], entity = "cette civilisation" }) {
    const user = getSessionUser();
    if (user && (user.is_admin || members.some((member) => member.user_id === user.id))) return null;

    const founder = members.find((member) => member.role === "Fondateur");

    return (
        <div role="note" className="flex flex-col sm:flex-row sm:items-center gap-3 w-full bg-base-200 rounded-2xl p-3 sm:p-4">
            <FontAwesomeIcon icon="fa-solid fa-circle-info" className="text-info text-xl shrink-0" />
            {user ? (
                <p className="flex-1">
                    Pour rejoindre {entity}, contactez {founder?.username ? <>son fondateur <strong>{founder.username}</strong></> : "son fondateur"} ou l'un de ses admins : ce sont eux qui ajoutent les nouveaux membres.
                </p>
            ) : (
                <>
                    <p className="flex-1">Connectez-vous pour rejoindre {entity} ou demander à en faire partie.</p>
                    <div className="flex flex-row flex-wrap gap-2">
                        <a href="/login" className="btn btn-sm btn-primary">Se connecter</a>
                        <a href="/register" className="btn btn-sm btn-ghost bg-base-100">Créer un compte</a>
                    </div>
                </>
            )}
        </div>
    );
}
