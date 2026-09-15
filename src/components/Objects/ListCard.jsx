import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import DynamicIcon from "./DynamicIcon";

// Carte des pages de liste (commerces, civilisations, religions) :
// icône ronde, titre + badges, sous-titre, description courte et statistiques.
// badges : [{ text, className }] ; stats : [{ icon, text }] ; iconFallback : icône si `icon` (issue des données) est introuvable
export default function ListCard({ href, icon, iconFallback, iconColor = null, title, badges = [], subtitle = null, description = null, stats = [] }) {
    return (
        <a href={href} className="flex flex-col gap-2 p-4 bg-base-200 hover:bg-base-300 transition-colors rounded-3xl shadow-md w-full min-w-0">
            <div className="flex flex-row items-center gap-3">
                <span
                    className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${iconColor ? "text-white" : "bg-base-300"}`}
                    style={iconColor ? { backgroundColor: iconColor } : undefined}
                >
                    <DynamicIcon icon={icon} fallback={iconFallback} />
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="flex flex-row flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold break-words">{title}</h2>
                        {badges.map((badge) => (
                            <span key={badge.text} className={`badge badge-sm ${badge.className ?? "badge-neutral"}`}>{badge.text}</span>
                        ))}
                    </span>
                    {subtitle ? <span className="text-sm opacity-70 truncate">{subtitle}</span> : null}
                </div>
            </div>
            {description ? (
                <p className="line-clamp-3 break-words">{description}</p>
            ) : null}
            {stats.length > 0 ? (
                <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 text-sm opacity-70">
                    {stats.map((stat) => (
                        <span key={stat.text} className="flex flex-row items-center gap-1 min-w-0">
                            <FontAwesomeIcon icon={stat.icon} />
                            <span className="truncate">{stat.text}</span>
                        </span>
                    ))}
                </div>
            ) : null}
        </a>
    );
}
