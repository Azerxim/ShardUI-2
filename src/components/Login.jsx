import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"

export default function Login() {
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    async function handleLogin(e){
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
        fetch(`/api/user/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })
        .then((res) => res.json())
        .then((data) => {
            // console.log(data);
            if (data.error == 200) {
                localStorage.setItem("user", JSON.stringify(data.user))
                navigate("/profil")
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: data.text,
                });
            }
        })
        .catch((error) => {
            // console.log(error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: error.response.data.message,
            });
        });
    }

    return (
        <div className="flex flex-col gap-5 justify-center items-center" style={{ margin: '20px 0 40px 0' }}>
            <h1 className="text-5xl font-bold">Connexion</h1>
            <div className="card bg-base-200 w-full max-w-sm shrink-0 shadow-2xl">
                <form onSubmit={handleLogin}>
                    <div className="card-body">
                        <fieldset className="fieldset">
                            <label className="label">Email</label>
                            <input onChange={e => {setEmail(e.target.value)}} type="email" className="input" placeholder="Email" id="email" />
                            <label className="label">Mot de passe</label>
                            <input onChange={e => {setPassword(e.target.value)}} type="password" className="input" placeholder="Mot de passe" id="password" />
                            {/* <div><a className="link link-hover">Mot de passe oublié?</a></div> */}
                            <button className="btn btn-neutral mt-4" type="submit">Connexion</button>
                        </fieldset>
                    </div>
                </form>
            </div>
        </div>
    );
}