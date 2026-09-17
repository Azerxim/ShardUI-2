import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PendingActions from "@/components/users/PendingActions";

const NEXT_STEPS = [
    { icon: "fa-solid fa-scroll", title: "Lire le Codex", text: "Les règles du serveur et du rôle-play.", href: "/codex" },
    { icon: "fa-solid fa-flag", title: "Rejoindre une civilisation", text: "Parcourez-les et contactez leur fondateur, ou fondez la vôtre.", href: "/civilisations" },
    { icon: "fa-solid fa-cross", title: "Découvrir les religions", text: "Rejoignez un culte ou fondez le vôtre.", href: "/religions" },
    { icon: "fa-solid fa-shop", title: "Ouvrir un commerce", text: "Créez votre enseigne, puis ajoutez vos magasins.", href: "/commerces" },
];

// Profil : actions en attente et pistes pour bien commencer (les appartenances sont dans ProfilInfos)
export default function UserMemberships() {
    return (
        <div className="max-w-4xl mx-auto mt-6 flex flex-col gap-6">
            <PendingActions />
            <section className="card bg-base-200 shadow-xl">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl">
                        <FontAwesomeIcon icon="fa-solid fa-signs-post" />
                        Prochaines étapes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {NEXT_STEPS.map((step) => (
                            <a key={step.href} href={step.href} className="flex flex-row items-start gap-3 bg-base-100 hover:bg-base-300 transition-colors rounded-2xl p-3">
                                <FontAwesomeIcon icon={step.icon} className="text-xl mt-1 text-primary" />
                                <span className="flex flex-col">
                                    <span className="font-semibold">{step.title}</span>
                                    <span className="text-sm opacity-70">{step.text}</span>
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
