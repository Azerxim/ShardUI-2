import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { getApiURL } from "../../../services/api"
import { getUserToken } from "../../Functions/getAuthToken"

const FORBIDDEN_SEQUENCES = ["'", '"', ";", "--"];

function Field({ id, label, help, type = "text", value, onChange, autoComplete }) {
    return (
        <label className="flex flex-col gap-1" htmlFor={id}>
            <span className="font-semibold text-sm">{label}</span>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input input-md bg-base-100 w-full"
                autoComplete={autoComplete}
                required
            />
            {help ? <span className="text-xs opacity-70">{help}</span> : null}
        </label>
    );
}

export default function Register() {
    const navigate = useNavigate()
    const apiURL = getApiURL()
    const [form, setForm] = useState({ username: "", pseudo: "", email: "", password: "", confirmPassword: "" })
    const [submitting, setSubmitting] = useState(false)

    const update = (name) => (value) => setForm((prev) => ({ ...prev, [name]: value }))
    const fail = (text) => Swal.fire({ icon: "error", title: "Inscription impossible", text })

    async function handleRegister(e) {
        e.preventDefault()
        const { username, pseudo, email, password, confirmPassword } = form

        if (![username, pseudo, email, password, confirmPassword].every((value) => value.trim())) {
            return fail("Tous les champs sont obligatoires.")
        }
        if (/\s/.test(username.trim())) {
            return fail("Le nom d'utilisateur ne doit pas contenir d'espace.")
        }
        if (password !== confirmPassword) {
            return fail("Les mots de passe ne correspondent pas.")
        }
        if ([email, password].some((value) => FORBIDDEN_SEQUENCES.some((sequence) => value.includes(sequence)))) {
            return fail("L'adresse email et le mot de passe ne peuvent pas contenir ' \" ; ou --.")
        }

        setSubmitting(true)
        try {
            const response = await fetch(`${apiURL}/users/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), full_name: pseudo.trim(), email: email.trim(), password }),
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(typeof data.detail === "string" ? data.detail : "Erreur lors de l'inscription.")
            }

            // Session ouverte tout de suite, avec le même jeton que depuis la page de connexion
            let token
            try {
                token = await getUserToken(data.username, password)
            } catch {
                await Swal.fire({ icon: "info", title: "Compte créé", text: "Votre compte est prêt : connectez-vous pour commencer." })
                navigate("/login")
                return
            }
            localStorage.setItem("user", JSON.stringify(data))
            localStorage.setItem("token", token)
            navigate("/profil")
        } catch (error) {
            fail(error.message || "Erreur lors de l'inscription.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col gap-5 justify-center items-center" style={{ margin: '20px 0 40px 0' }}>
            <h1 className="text-5xl font-bold">Inscription</h1>
            <div className="card bg-base-200 w-full max-w-sm shrink-0 shadow-2xl">
                <form onSubmit={handleRegister}>
                    <div className="card-body">
                        <fieldset className="fieldset gap-4">
                            <Field id="username" label="Nom d'utilisateur" help="Identifiant unique, sans espace (ex. steve42)." value={form.username} onChange={update("username")} autoComplete="username" />
                            <Field id="pseudo" label="Pseudo" help="Nom affiché aux autres joueurs, idéalement votre pseudo Minecraft." value={form.pseudo} onChange={update("pseudo")} autoComplete="nickname" />
                            <Field id="email" type="email" label="Adresse email" help="Vous l'utiliserez pour vous connecter." value={form.email} onChange={update("email")} autoComplete="email" />
                            <Field id="password" type="password" label="Mot de passe" value={form.password} onChange={update("password")} autoComplete="new-password" />
                            <Field id="confirmPassword" type="password" label="Confirmer le mot de passe" value={form.confirmPassword} onChange={update("confirmPassword")} autoComplete="new-password" />

                            <button className="btn mt-2 btn-info" type="submit" disabled={submitting}>
                                {submitting ? <span className="loading loading-spinner loading-sm"></span> : null}
                                Inscription
                            </button>
                            <a href="/login" className="link link-hover text-sm text-center">Déjà un compte ? Connectez-vous</a>
                            <p className="text-xs opacity-70 text-center">Vous pourrez ensuite lier Discord depuis votre profil pour vous connecter avec.</p>
                        </fieldset>
                    </div>
                </form>
            </div>
        </div>
    );
}
