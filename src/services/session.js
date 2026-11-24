// Session utilisateur : valide seulement avec l'utilisateur ET son jeton d'API
import { useMemo, useSyncExternalStore } from "react";
import { verifyToken } from "@/services/api";

export function getSessionUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && localStorage.getItem("token") ? user : null;
  } catch {
    return null;
  }
}

// Changement du profil stocké (connexion, déconnexion, rôles réalignés) : SESSION_EVENT, avec { avant, apres }. Voir useSessionUser et services/syncRoles.js.
export const SESSION_EVENT = "tetrago:session";
const ROLES = ["is_admin", "is_moderateur", "is_disabled"];
export const rolesDe = (user) => (user ? ROLES.map((role) => Boolean(user[role])).join(",") : "aucun");

function annoncer(avant, apres) {
  if (JSON.stringify(avant) === JSON.stringify(apres)) return;
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { avant, apres } }));
}

// Enregistre le profil (connexion, modification) et prévient les composants abonnés
export function setSessionUser(user) {
  const avant = getSessionUser();
  localStorage.setItem("user", JSON.stringify(user));
  annoncer(avant, getSessionUser());
}

export function clearSession() {
  const avant = getSessionUser();
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  annoncer(avant, null);
}

// Profil courant, relu à chaque changement (SESSION_EVENT, ou autre onglet via l'événement « storage »)
const abonner = (rappel) => {
  window.addEventListener(SESSION_EVENT, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(SESSION_EVENT, rappel);
    window.removeEventListener("storage", rappel);
  };
};
const instantane = () => `${localStorage.getItem("token") ? "1" : "0"}${localStorage.getItem("user") ?? ""}`;
export function useSessionUser() {
  const cle = useSyncExternalStore(abonner, instantane);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getSessionUser(), [cle]);
}

// Réaligne le profil stocké sur celui de l'API, et efface la session si le jeton ne vaut plus rien.
// `GET /users/verify` renvoie `{ valid, user }` : le profil est donc rafraîchi sans appel supplémentaire.
// Appelé au montage de la Navbar (chaque page), puis par services/syncRoles.js toutes les minutes et au retour sur l'onglet :
// un rôle accordé ou retiré par un administrateur est pris en compte sans recharger la page.
//
// Le profil du localStorage est modifiable par l'utilisateur (`is_admin`, `is_moderateur`) : le réécrire
// depuis l'API annule cette retouche. Ce n'est pas ce qui protège le site — chaque route de l'API vérifie les droits
// côté serveur — mais cela évite un affichage qui ne correspond à rien.
// Seul un refus de l'API (400 compte désactivé, 401, 403) efface la session : une coupure réseau ou une erreur du serveur la laisse intacte.
export async function syncSessionUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const response = await verifyToken(token);
    // Déconnexion ou autre jeton entre-temps : la réponse ne concerne plus la session en cours
    if (localStorage.getItem("token") !== token) return getSessionUser();
    // 400 : compte désactivé ; 401 : jeton expiré ou inconnu
    if ([400, 401, 403].includes(response.status)) {
      clearSession();
      console.warn("Jeton invalide ou expiré : session effacée");
      return null;
    }
    if (!response.ok) return getSessionUser();
    const data = await response.json();
    if (data?.valid === false) {
      clearSession();
      return null;
    }
    if (data?.user) {
      setSessionUser(data.user);
      return data.user;
    }
    return getSessionUser();
  } catch (error) {
    console.error("Vérification de la session impossible :", error);
    return getSessionUser();
  }
}
