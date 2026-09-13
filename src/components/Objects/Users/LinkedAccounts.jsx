import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import { OAUTH_PROVIDERS } from "../../Functions/oauthProviders";
import { runAction } from "../../Functions/conflits";
import { getLinkedPlatforms, getOAuthProviders, startOAuth, unlinkPlatform } from "../../../services/api";

// Profil : comptes externes liés (Discord, bientôt Minecraft) et liaison / déliaison
export default function LinkedAccounts() {
    const [platforms, setPlatforms] = useState([]);
    const [enabled, setEnabled] = useState({});
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        getLinkedPlatforms()
            .then((list) => setPlatforms(Array.isArray(list) ? list : []))
            .catch((error) => console.error("Error fetching linked accounts:", error));
        getOAuthProviders()
            .then((list) => setEnabled(Object.fromEntries((list || []).map((item) => [item.provider, item.enabled]))))
            .catch((error) => console.error("Error fetching providers:", error));
    }, [reloadKey]);

    const link = async (provider) => {
        try {
            window.location.assign(await startOAuth(provider, "link"));
        } catch (error) {
            Swal.fire({ icon: "error", title: "Liaison impossible", text: error.message });
        }
    };

    const unlink = async (provider, label) => {
        const result = await runAction(() => unlinkPlatform(provider), {
            confirm: { title: `Délier ${label} ?`, text: `Vous ne pourrez plus vous connecter au site avec ${label}. Votre compte Tetrago est conservé.`, button: "Délier" },
        });
        if (result) setReloadKey((key) => key + 1);
    };

    return (
        <section className="card bg-base-200 shadow-xl max-w-4xl mx-auto mt-6">
            <div className="card-body gap-4">
                <h2 className="card-title text-2xl">
                    <FontAwesomeIcon icon="fa-solid fa-link" />
                    Comptes liés
                </h2>
                <ul className="flex flex-col gap-2">
                    {Object.entries(OAUTH_PROVIDERS).map(([provider, config]) => {
                        const linked = platforms.find((item) => item.platform === provider);
                        return (
                            <li key={provider} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-base-100 rounded-2xl p-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-white text-lg overflow-hidden" style={{ backgroundColor: config.color }}>
                                    {linked?.avatar_url ? <img src={linked.avatar_url} alt="" className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={config.icon} />}
                                </span>
                                <span className="flex flex-col flex-1 min-w-0">
                                    <span className="font-bold">{config.label}</span>
                                    <span className="text-sm opacity-70 break-words">
                                        {linked ? `Lié à ${linked.username ?? linked.uid}` : config.help}
                                    </span>
                                </span>
                                {config.soon ? (
                                    <span className="badge badge-ghost">Bientôt disponible</span>
                                ) : linked ? (
                                    <button type="button" className="btn btn-sm btn-ghost bg-base-200 text-error" onClick={() => unlink(provider, config.label)}>Délier</button>
                                ) : enabled[provider] === false ? (
                                    <span className="badge badge-ghost">Non configuré sur ce serveur</span>
                                ) : (
                                    <button type="button" className="btn btn-sm text-white border-0" style={{ backgroundColor: config.color }} onClick={() => link(provider)}>
                                        <FontAwesomeIcon icon={config.icon} />
                                        Lier mon compte {config.label}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
