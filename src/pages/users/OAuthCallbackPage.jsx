import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

import Navbar from "@/components/layout/Navbar";
import { OAUTH_PROVIDERS } from "@/utils/oauthProviders";
import { completeOAuth } from "@/services/api";

// Adresse de retour d'un fournisseur OAuth (/auth/:provider/callback?code=…&state=…)
export default function OAuthCallbackPage() {
    const { provider } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const started = useRef(false);
    const label = OAUTH_PROVIDERS[provider]?.label ?? provider;
    const connected = Boolean(localStorage.getItem("token"));

    useEffect(() => {
        // Un code d'autorisation ne sert qu'une fois : pas de second appel (double effet du mode strict)
        if (started.current) return;
        started.current = true;

        const finish = async () => {
            const code = params.get("code");
            const state = params.get("state");
            if (params.get("error") || !code || !state) {
                setError(`La connexion avec ${label} a été annulée.`);
                return;
            }
            try {
                const data = await completeOAuth(provider, code, state);
                if (data.mode === "login") {
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                } else {
                    await Swal.fire({ icon: "success", title: `Compte ${label} lié`, text: `Vous pouvez désormais vous connecter au site avec ${label}.` });
                }
                navigate("/profil", { replace: true });
            } catch (err) {
                setError(err.message);
            }
        };
        finish();
    }, [label, navigate, params, provider]);

    return (
        <>
            <Navbar active="login" />
            <main className="container mx-auto p-4">
                <div className="flex flex-col items-center gap-4 py-12 text-center max-w-xl mx-auto">
                    {error ? (
                        <>
                            <FontAwesomeIcon icon={OAUTH_PROVIDERS[provider]?.icon ?? "fa-solid fa-link-slash"} className="text-5xl opacity-60" />
                            <h1 className="text-2xl font-bold">Connexion avec {label} impossible</h1>
                            <p role="alert">{error}</p>
                            <div className="flex flex-row flex-wrap justify-center gap-2">
                                {connected ? (
                                    <a href="/profil" className="btn btn-primary">Retour au profil</a>
                                ) : (
                                    <>
                                        <a href="/register" className="btn btn-primary">Créer un compte</a>
                                        <a href="/login" className="btn btn-ghost bg-base-200">Se connecter</a>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="loading loading-spinner loading-lg"></span>
                            <p>Connexion avec {label}…</p>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
