import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import { OAUTH_PROVIDERS } from "../../Functions/oauthProviders";
import { startOAuth } from "../../../services/api";

// Page de connexion : se connecter avec un compte externe déjà lié à un compte Tetrago
export default function ExternalLoginButtons() {
    const [pending, setPending] = useState(null);
    const discord = OAUTH_PROVIDERS.discord;

    const start = async (provider) => {
        setPending(provider);
        try {
            window.location.assign(await startOAuth(provider, "login"));
        } catch (error) {
            setPending(null);
            Swal.fire({ icon: "error", title: "Connexion impossible", text: error.message });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="divider text-sm opacity-70 my-1">ou</div>
            <button
                type="button"
                className="btn gap-2 text-white border-0"
                style={{ backgroundColor: discord.color }}
                onClick={() => start("discord")}
                disabled={pending !== null}
            >
                {pending === "discord" ? <span className="loading loading-spinner loading-sm"></span> : <FontAwesomeIcon icon={discord.icon} />}
                Se connecter avec Discord
            </button>
            <p className="text-xs opacity-70 text-center">Discord doit d'abord être lié à votre compte, depuis votre profil.</p>
        </div>
    );
}
