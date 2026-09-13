// Explication lisible d'une réponse d'erreur de l'API.
// champs : champs de la modale (config.champs), pour nommer les champs refusés par leur libellé.
export async function describeApiError(response, champs = []) {
  const data = await response.json().catch(() => ({}));
  const detail = data?.detail;

  if (response.status === 401) {
    return "Vous devez être connecté pour effectuer cette action. Votre session a peut-être expiré : reconnectez-vous.";
  }
  if (response.status === 422 && Array.isArray(detail)) {
    const fields = [...new Set(detail.map((error) => {
      const name = error.loc?.[error.loc.length - 1];
      return champs.find((champ) => champ.name === name)?.label || name;
    }))];
    return `Vérifiez ${fields.length > 1 ? "les champs" : "le champ"} : ${fields.join(", ")}.`;
  }

  const message = typeof detail === "string" ? detail : detail?.text || data?.text;
  if (message && message !== "Accès refusé") return message.replace(/\.?$/, ".");
  if (response.status === 403) {
    return "Vous n'avez pas les droits nécessaires : seuls le fondateur et les admins peuvent le faire.";
  }
  if (response.status === 404) return "L'élément demandé n'existe plus.";
  return `Le serveur a répondu par une erreur (${response.status}). Réessayez dans un instant.`;
}
