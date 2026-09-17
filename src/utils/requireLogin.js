import Swal from "sweetalert2";
import { getSessionUser } from "@/services/session";

// Lance l'action si l'utilisateur est connecté ; sinon explique pourquoi et propose connexion ou inscription.
// actionLabel complète « Connectez-vous pour … » (ex. "fonder une civilisation").
export function requireLogin(action, actionLabel = "effectuer cette action") {
  if (getSessionUser()) {
    action();
    return;
  }
  Swal.fire({
    icon: "info",
    title: "Connexion requise",
    text: `Connectez-vous pour ${actionLabel}. Pas encore de compte ? L'inscription ne prend que quelques secondes.`,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Se connecter",
    denyButtonText: "Créer un compte",
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) window.location.href = "/login";
    else if (result.isDenied) window.location.href = "/register";
  });
}
