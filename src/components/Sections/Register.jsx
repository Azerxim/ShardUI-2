import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"

export default function Register() {
    const navigate = useNavigate()

    const [username, setUsername] = useState("")
    const [pseudo, setPseudo] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    async function getAuthToken() {
        try {
            const params = new URLSearchParams();
            params.append('username', import.meta.env.VITE_API_USER);
            params.append('password', import.meta.env.VITE_API_PASSWORD);

            const response = await fetch(`/security/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
            });

            if (!response.ok) {
                throw new Error("Erreur d'authentification");
            }

            const data = await response.json();
            // console.log("Token d'authentification récupéré:", data);
            return data.access_token;
        } catch (error) {
            console.error("Erreur lors de la récupération du token:", error);
            throw error;
        }
    }

    async function handleLogin(e) {
        e.preventDefault()

        // Vérifier que tous les champs sont remplis
        if (!username.trim() || !pseudo.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Tous les champs sont obligatoires",
            });
            return;
        }

        // Vérifier que les mots de passe correspondent
        if (password !== confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Les mots de passe ne correspondent pas",
            });
            return;
        }
        // sql injection protection
        if (email.includes("'") || email.includes('"') || email.includes(";") || password.includes("'") || password.includes('"') || password.includes(";") || email.includes("--") || password.includes("--")) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Caractères spéciaux non autorisés",
            });
            return;
        }

        try {
            // Récupérer le token d'authentification
            const token = await getAuthToken();

            const response = await fetch(`/api/users/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ username, pseudo, email, password }),
            });
            // console.log("Réponse brute de l'API:", response);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erreur API:", errorData);
                throw new Error(errorData.detail || errorData.text || "Erreur lors de l'inscription");
            }

            const data = await response.json();
            console.log("Inscription réussie:", data);

            localStorage.setItem("user", JSON.stringify(data))
            navigate("/profil")
        } catch (error) {
            console.error("Erreur:", error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: error.message || "Erreur lors de l'inscription",
            });
        }
    }

    return (
        <div className="flex flex-col gap-5 justify-center items-center" style={{ margin: '20px 0 40px 0' }}>
            <h1 className="text-5xl font-bold">Inscription</h1>
            <div className="card bg-base-200 w-full max-w-sm shrink-0 shadow-2xl">
                <form onSubmit={handleLogin}>
                    <div className="card-body">
                        <fieldset className="fieldset gap-3">
                            <label className="floating-label">
                                <span>Nom d'utilisateur</span>
                                <input onChange={e => { setUsername(e.target.value) }} type="text" placeholder="Nom d'utilisateur" className="input input-md bg-base-100" id="username" required />
                            </label>

                            <label className="floating-label">
                                <span>Pseudo</span>
                                <input onChange={e => { setPseudo(e.target.value) }} type="text" placeholder="Pseudo" className="input input-md bg-base-100" id="pseudo" required />
                            </label>

                            <label className="floating-label">
                                <span>Adresse email</span>
                                <input onChange={e => { setEmail(e.target.value) }} type="text" placeholder="mail@site.com" className="input input-md bg-base-100" id="email" required />
                            </label>

                            <label className="floating-label">
                                <span>Mot de passe</span>
                                <input onChange={e => { setPassword(e.target.value) }} type="password" placeholder="Mot de passe" className="input input-md bg-base-100" id="password" required />
                            </label>

                            <label className="floating-label">
                                <span>Confirmer le mot de passe</span>
                                <input onChange={e => { setConfirmPassword(e.target.value) }} type="password" placeholder="Confirmer le mot de passe" className="input input-md bg-base-100" id="confirmPassword" required />
                            </label>

                            <button className="btn mt-4 btn-info" type="submit">Inscription</button>
                        </fieldset>
                    </div>
                </form>
            </div>
        </div>
    );
}