// Session utilisateur : valide seulement avec l'utilisateur ET son jeton d'API
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
