import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Chiffre clé d'une fiche (religion, civilisation…) : icône, valeur et libellé
export default function Stat({ icon, label, value, color }) {
    return (
        <div className="flex flex-row items-center gap-3 bg-base-100 rounded-2xl p-3">
            <FontAwesomeIcon icon={icon} className="text-xl" style={{ color }} />
            <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold tabular-nums truncate">{value}</span>
                <span className="text-sm opacity-70 truncate">{label}</span>
            </div>
        </div>
    );
}
