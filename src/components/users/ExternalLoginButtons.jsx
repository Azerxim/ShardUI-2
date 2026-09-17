import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import { OAUTH_PROVIDERS } from "@/utils/oauthProviders";
import { getOAuthProviders, startOAuth } from "@/services/api";

// Page de connexion : se connecter avec un compte externe déjà lié à un compte Tetrago.
// Les fournisseurs non configurés sur le serveur sont masqués.
export default function ExternalLoginButtons() {
    const [pending, setPending] = useState(null);
    const [enabled, setEnabled] = useState({});

    useEffect(() => {
        getOAuthProviders()
            .then((list) => setEnabled(Object.fromEntries((list || []).map((item) => [item.provider, item.enabled]))))
            .catch((error) => console.error("Error fetching providers:", error));
    }, []);

    const start = async (provider) => {
        setPending(provider);
        try {
            window.location.assign(await startOAuth(provider, "login"));
        } catch (error) {
            setPending(null);
            Swal.fire({ icon: "error", title: "Connexion impossible", text: error.message });
        }
    };

    const providers = Object.entries(OAUTH_PROVIDERS).filter(([provider, config]) => !config.soon && enabled[provider] !== false);
    if (providers.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <div className="divider text-sm opacity-70 my-1">ou</div>
            {providers.map(([provider, config]) => (
                <button
                    key={provider}
                    type="button"
                    className="btn gap-2 text-white border-0"
                    style={{ backgroundColor: config.color }}
                    onClick={() => start(provider)}
                    disabled={pending !== null}
                >
                    {pending === provider ? <span className="loading loading-spinner loading-sm"></span> : <FontAwesomeIcon icon={config.icon} />}
                    Se connecter avec {config.label}
                </button>
            ))}
            <p className="text-xs opacity-70 text-center">Le compte externe doit d'abord être lié au vôtre, depuis votre profil.</p>
        </div>
    );
}
