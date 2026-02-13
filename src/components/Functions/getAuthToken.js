export async function getAuthToken() {
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