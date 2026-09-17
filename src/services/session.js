// Session utilisateur : valide seulement avec l'utilisateur ET son jeton d'API
import { verifyToken } from "@/services/api";

export function getSessionUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && localStorage.getItem("token") ? user : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
}

// Réaligne le profil stocké sur celui de l'API, et efface la session si le jeton ne vaut plus rien.
// `GET /users/verify` renvoie `{ valid, user }` : le profil est donc rafraîchi sans appel supplémentaire.
// Appelé au montage de la Navbar, donc à chaque chargement de page.
//
// Le profil du localStorage est modifiable par l'utilisateur (`is_admin`, `is_moderateur`) : le réécrire
// depuis l'API annule cette retouche au chargement suivant. Ce n'est pas ce qui protège le site — chaque
// route de l'API vérifie les droits côté serveur — mais cela évite un affichage qui ne correspond à rien,
// et reprend les rôles qu'un administrateur vient d'accorder ou de retirer.
export async function syncSessionUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const response = await verifyToken(token);
    if (!response.ok) {
      clearSession();
      console.warn("Jeton invalide ou expiré : session effacée");
      return null;
    }
    const data = await response.json();
    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch (error) {
    console.error("Vérification de la session impossible :", error);
    clearSession();
    return null;
  }
}
