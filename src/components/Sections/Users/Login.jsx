import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { getUserToken } from "../../Functions/getAuthToken"
import { getApiURL } from "../../../services/api"

export default function Login() {
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [expiryHours, setExpiryHours] = useState(24)
    const apiURL = getApiURL()

    async function handleLogin(e) {
        e.preventDefault()
        // sql injection protection
        if (email.includes("'") || email.includes('"') || email.includes(";") || password.includes("'") || password.includes('"') || password.includes(";") || email.includes("--") || password.includes("--")) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Caractères spéciaux non autorisés",
            });
            return;
        }
        fetch(`${apiURL}/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })
            .then((res) => res.json())
            .then((data) => {
                // console.log(data);
                if (data.code == 200) {
                    localStorage.setItem("user", JSON.stringify(data.user))
                    getUserToken(data.user.username, password, parseInt(expiryHours)).then(token => {
                        localStorage.setItem("token", token);
                        // console.log("Token d'authentification récupéré:", token);
                        navigate("/profil");
                    }).catch(error => {
                        Swal.fire({
                            icon: "error",
                            title: "Oops...",
                            text: error.message || "Erreur lors de la récupération du token",
                        });
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: data.text,
                    });
                }
            })
            .catch((error) => {
                console.log(error);
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: error.response?.data?.message || "Une erreur est survenue",
                });
            });
    }

    return (
        <div className="flex flex-col gap-5 justify-center items-center" style={{ margin: '20px 0 40px 0' }}>
            <h1 className="text-5xl font-bold">Connexion</h1>
            <div className="card bg-base-200 w-full max-w-sm shrink-0 shadow-2xl">
                <form onSubmit={handleLogin}>
                    <div className="card-body">
                        <fieldset className="fieldset gap-2">
                            <label className="label">Adresse email</label>
                            <input
                                onChange={e => { setEmail(e.target.value) }}
                                type="text"
                                className="input input-md input-ghost bg-base-100 w-full"
                                placeholder="mail@site.com"
                                id="email"
                                value={email}
                            />

                            <label className="label">Mot de passe</label>
                            <input
                                onChange={e => { setPassword(e.target.value) }}
                                type="password"
                                className="input input-md input-ghost bg-base-100 w-full"
                                placeholder="Mot de passe"
                                id="password"
                                value={password}
                            />

                            <label className="label">Durée de validité du session</label>
                            <select
                                onChange={e => { setExpiryHours(parseInt(e.target.value)) }}
                                value={expiryHours}
                                className="select select-md select-ghost bg-base-100 w-full"
                                id="expiry"
                            >
                                <option value="1">1 heure</option>
                                <option value="6">6 heures</option>
                                <option value="24">24 heures (par défaut)</option>
                                <option value="72">3 jours</option>
                                <option value="168">7 jours</option>
                                <option value="720">30 jours</option>
                            </select>

                            {/* <label className="floating-label">
                                <span>Adresse email</span>
                                <input onChange={e => { setEmail(e.target.value) }} type="text" placeholder="mail@site.com" className="input input-md input-ghost bg-base-100 w-full" id="email" required />
                            </label> */}

                            {/* <label className="floating-label">
                                <span>Mot de passe</span>
                                <input onChange={e => { setPassword(e.target.value) }} type="password" placeholder="Mot de passe" className="input input-md input-ghost bg-base-100 w-full" id="password" required />
                            </label> */}

                            {/* <label className="floating-label">
                                <span>Durée de validité du session</span>
                                <select onChange={e => { setExpiryHours(parseInt(e.target.value)) }} value={expiryHours} className="select select-md select-ghost bg-base-100 w-full" id="expiry">
                                    <option value="1">1 heure</option>
                                    <option value="6">6 heures</option>
                                    <option value="24">24 heures (par défaut)</option>
                                    <option value="72">3 jours</option>
                                    <option value="168">7 jours</option>
                                    <option value="720">30 jours</option>
                                </select>
                            </label> */}
                            {/* <div><a className="link link-hover">Mot de passe oublié?</a></div> */}

                            <a href="/register" className="link link-hover">Pas encore de compte? Inscrivez-vous</a>
                            <button className="btn mt-4 btn-success" type="submit">Connexion</button>
                        </fieldset>
                    </div>
                </form>
            </div>
        </div>
    );
}