import Swal from "sweetalert2";

// Texte lisible d'une erreur levée côté client : panne réseau, message brut « Erreur 500: … »
// de services/api.js, ou message de l'API repris tel quel.
// Pour une réponse HTTP encore non lue, utiliser plutôt describeApiError (utils/apiError.js).
export function messageErreur(error) {
  const message = error?.message || "";
  if (error instanceof TypeError && /fetch|network/i.test(message)) {
    return "Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.";
  }
  const status = message.match(/^Erreur (\d{3})/)?.[1];
  if (status === "401") return "Vous devez être connecté pour effectuer cette action. Votre session a peut-être expiré : reconnectez-vous.";
  if (status === "403") return "Vous n'avez pas les droits nécessaires pour cette action.";
  if (status === "404") return "L'élément demandé n'existe plus. Rechargez la page.";
  if (status) return `Le serveur a rencontré un problème (${status}). Réessayez dans un instant ; si cela persiste, signalez-le sur le Discord.`;
  return message || "Une erreur inattendue est survenue. Réessayez dans un instant.";
}

// Alerte d'échec : le titre dit ce qui n'a pas pu se faire, le texte pourquoi et quoi faire.
export function alerteErreur(titre, error) {
  return Swal.fire({ icon: "error", title: titre, text: messageErreur(error) });
}
