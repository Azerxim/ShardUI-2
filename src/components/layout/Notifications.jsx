import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// ===== Notifications (cloche de la barre) =====
// Écrites par l'API au moment des faits (crud_notifications) : appels aux armes, invitations, liens de parenté,
// lectures tracées, révélations, décisions des modérateurs RP… Relevées par useNotifications.

const TYPES = {
    appel: { icon: 'fa-solid fa-bullhorn', classe: 'text-error' },
    invitation: { icon: 'fa-solid fa-envelope', classe: 'text-info' },
    lien: { icon: 'fa-solid fa-sitemap', classe: 'text-secondary' },
    lecture: { icon: 'fa-solid fa-eye', classe: 'text-warning' },
    revelation: { icon: 'fa-solid fa-lock-open', classe: 'text-accent' },
    decision: { icon: 'fa-solid fa-gavel', classe: 'text-primary' },
    moderation: { icon: 'fa-solid fa-scale-balanced', classe: 'text-warning' },
    evenement: { icon: 'fa-solid fa-calendar-xmark', classe: 'text-info' },
    mercenaires: { icon: 'fa-solid fa-coins', classe: 'text-warning' },
    guerre: { icon: 'fa-solid fa-shield-halved', classe: 'text-error' },
};
const TYPE_PAR_DEFAUT = { icon: 'fa-solid fa-bell', classe: 'text-primary' };

// « à l'instant », « il y a 5 min », « il y a 3 h », « hier », puis la date
function quand(date) {
    const moment = new Date(date);
    const minutes = Math.floor((Date.now() - moment.getTime()) / 60_000);
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (minutes < 24 * 60) return `il y a ${Math.floor(minutes / 60)} h`;
    if (minutes < 48 * 60) return 'hier';
    return moment.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export function BoutonNotifications({ nonLues, ouvert, ouvrir, boutonRef }) {
    const label = nonLues ? `Notifications, ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Notifications';
    return (
        // Masquée sur téléphone, où la barre manque de place : le menu latéral ouvre alors les notifications
        <div className="tooltip tooltip-left hidden sm:inline-block" data-tip="Notifications">
            <button
                ref={boutonRef}
                type="button"
                aria-label={label}
                aria-expanded={ouvert}
                aria-controls="panneau-notifications"
                onClick={ouvrir}
                className="btn bg-base-200 rounded-3xl btn-ghost relative"
            >
                <FontAwesomeIcon icon="fa-solid fa-bell" />
                {nonLues > 0 && (
                    <span aria-hidden="true" className="badge badge-error badge-sm absolute -top-1 -right-1 px-1.5">
                        {nonLues > 99 ? '99+' : nonLues}
                    </span>
                )}
            </button>
        </div>
    );
}

export function ContenuNotifications({ chargees, nonLues, liste, marquerLue, toutLire }) {
    if (!chargees) {
        return <li className="px-4 py-2"><span className="loading loading-dots loading-sm" aria-label="Chargement"></span></li>;
    }
    if (liste.length === 0) {
        return <li className="px-4 py-2 opacity-70">Rien de neuf pour l'instant.</li>;
    }

    const ouvrir = async (event, notification) => {
        if (!notification.link) {
            marquerLue(notification.id);
            return;
        }
        // On attend l'enregistrement : la navigation interromprait la requête
        event.preventDefault();
        if (!notification.lue) await marquerLue(notification.id);
        window.location.assign(notification.link);
    };

    return (
        <>
            {nonLues > 0 && (
                <li>
                    <button type="button" onClick={toutLire} className="justify-center rounded-3xl text-sm">
                        <FontAwesomeIcon icon="fa-solid fa-check-double" />
                        Tout marquer comme lu
                    </button>
                </li>
            )}
            {liste.map((notification) => {
                const type = TYPES[notification.type] || TYPE_PAR_DEFAUT;
                const Balise = notification.link ? 'a' : 'button';
                return (
                    <li key={notification.id}>
                        <Balise
                            {...(notification.link ? { href: notification.link } : { type: 'button' })}
                            onClick={(event) => ouvrir(event, notification)}
                            className={`flex flex-row items-start gap-3 rounded-2xl py-2 ${notification.lue ? 'opacity-70' : 'bg-base-100'}`}
                        >
                            <FontAwesomeIcon icon={type.icon} className={`${type.classe} w-4 mt-1 shrink-0`} />
                            <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <span className={`break-words ${notification.lue ? '' : 'font-semibold'}`}>{notification.title}</span>
                                {notification.text && <span className="text-sm opacity-80 break-words">{notification.text}</span>}
                                <span className="text-xs opacity-60">{quand(notification.created_at)}</span>
                            </span>
                            {!notification.lue && <span className="status status-primary mt-2 shrink-0" aria-label="Non lue"></span>}
                        </Balise>
                    </li>
                );
            })}
        </>
    );
}
