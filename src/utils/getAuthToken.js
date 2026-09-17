import { postToken } from "@/services/api";

export async function getUserToken(userName, userPassword, expiryHours = 24) {
  try {
    const params = new URLSearchParams();
    params.append("username", userName);
    params.append("password", userPassword);

    const data = await postToken(params, expiryHours);
    // console.log("Token d'authentification récupéré:", data);
    return data.access_token;
  } catch (error) {
    console.error("Erreur lors de la récupération du token:", error);
    throw error;
  }
}
