const baseURL = import.meta.env.VITE_API_BASE_URL;
const apiURL = `${baseURL}/api`;

export function getApiURL() {
  // console.log("API URL:", apiURL); // Log the API URL for debugging
  return apiURL;
}

//_____________________________________TOKEN_____________________________________

export async function postToken(params, expiryHours = 24) {
  // Base = origine de la page : fonctionne avec une URL d'API absolue ou relative (/api via le proxy de dev)
  const url = new URL(`${apiURL}/users/token`, window.location.origin);
  url.searchParams.append("expiry_hours", expiryHours);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Erreur d'authentification");
  }
  return response.json();
}

export async function verifyToken(token) {
  const response = await fetch(`${apiURL}/users/verify`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

//_____________________________________USERS_____________________________________

// Jeton joint quand il existe : l'API ne renvoie l'e-mail d'un profil qu'à son propriétaire
// ou à un administrateur, et les routes réservées aux administrateurs l'exigent.
function userHeaders() {
  const token = localStorage.getItem("token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export async function getUserById(userId) {
  const response = await fetch(`${apiURL}/users/id/${userId}`, {
    method: "GET",
    headers: userHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function getUserByUsername(username) {
  const response = await fetch(`${apiURL}/users/name/${username}`, {
    method: "GET",
    headers: userHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Réservée aux administrateurs (401 sans jeton, 403 sans le rôle)
export async function getUsers() {
  const response = await fetch(`${apiURL}/users/list`, {
    method: "GET",
    headers: userHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// __________________________________DYNAMIC____________________________________

export async function dynamicLoadData(url, method, token = null) {
  // console.log("dynamicLoadData called with url:", url, "method:", method, "token:", token);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(url.replace("$apiURL", apiURL), {
    method: method,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  const responseData = await response.json();
  // console.log("dynamicLoadData response:", responseData);
  return responseData;
}

//_____________________________________DATA_____________________________________

export async function getData(url) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  return data;
}

// _____________________________________API_____________________________________

// _________________________________Bibliotheque________________________________

export async function getLivres() {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/bibliotheque/livres/list`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getJournaux() {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/bibliotheque/journaux/list`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getLivresBycivilisationId(civilisationId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/bibliotheque/livres/civilisation/${civilisationId}/list`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getLivreById(livreId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/bibliotheque/livres/read/${livreId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getLivreContentById(livreId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/bibliotheque/livres/contents/read/${livreId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getJournalById(journalId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/bibliotheque/journaux/read/${journalId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getJournalContentById(journalId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/bibliotheque/journaux/contents/${journalId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}


// ________________________________Civilisations________________________________

export async function getCivilisationById(civilisationId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  // console.log("Fetching civilisation with ID:", civilisationId);

  const response = await fetch(`${apiURL}/civilisations/read/${civilisationId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getCivilisations() {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  // console.log("Fetching all civilisations");

  const response = await fetch(`${apiURL}/civilisations/list`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  const response_json = response.json()

  console.log("Civilisations fetched successfully: ", response_json);

  return response_json;
}

// Civilisations dont la civilisation dirigeante est civilisationId
export async function getCivilisationDirigees(civilisationId) {
  const response = await fetch(`${apiURL}/civilisations/get/${civilisationId}/dirigees`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export function deleteMemberCivilisation(civilisationId, memberId) {
  return deleteMember("civilisations", civilisationId, memberId);
}

export function deleteMemberReligion(religionId, memberId) {
  return deleteMember("religions", religionId, memberId);
}

export function deleteMemberCommerce(commerceId, memberId) {
  return deleteMember("commerces", commerceId, memberId);
}

// entity : "civilisations", "religions" ou "commerces"
async function deleteMember(entity, entityId, memberId) {
  const response = await fetch(`${apiURL}/${entity}/members/${entityId}/remove?member_id=${memberId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : `Erreur ${response.status}: ${response.statusText}`);
  }
  return data;
}

// Transfère le rôle de fondateur à un autre utilisateur (fondateur actuel ou administrateur).
// formerRole : nouveau rôle de l'ancien fondateur ("Admin" ou "Membre").
export function transferFounderCivilisation(civilisationId, userId, formerRole = "Admin") {
  return transferFounder(`${apiURL}/civilisations/members/${civilisationId}/transfer`, userId, formerRole);
}

export function transferFounderReligion(religionId, userId, formerRole = "Admin") {
  return transferFounder(`${apiURL}/religions/members/${religionId}/transfer`, userId, formerRole);
}

export function transferFounderCommerce(commerceId, userId, formerRole = "Admin") {
  return transferFounder(`${apiURL}/commerces/members/${commerceId}/transfer`, userId, formerRole);
}

async function transferFounder(url, userId, formerRole) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ user_id: parseInt(userId), former_role: formerRole }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : `Erreur ${response.status}: ${response.statusText}`);
  }
  return data;
}

// __________________________________Dimensions_________________________________

export async function getDimensions() {
  const response = await fetch(`${apiURL}/cartographie/dimensions/read`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Création / modification / suppression : réservées aux administrateurs côté API.
async function writeDimension(url, method, body = null) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    throw new Error(detail?.text || (typeof detail === "string" ? detail : `Erreur ${response.status}: ${response.statusText}`));
  }
  return data;
}

export function createDimension(dimension) {
  return writeDimension(`${apiURL}/cartographie/dimensions/create`, "POST", dimension);
}

export function updateDimension(dimension) {
  return writeDimension(`${apiURL}/cartographie/dimensions/update`, "PUT", dimension);
}

export function deleteDimension(dimensionId) {
  return writeDimension(`${apiURL}/cartographie/dimensions/delete?DimensionID=${dimensionId}`, "DELETE");
}

// __________________________________Commerces__________________________________

export async function getCommerces() {
  const response = await fetch(`${apiURL}/commerces/list?limit=1000`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// { commerce, fondateur, members, magasins, dirigeant, diriges }
export async function getCommerceById(commerceId) {
  const response = await fetch(`${apiURL}/commerces/read/${commerceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// { quartier, ville, religions } ; lève une erreur si le quartier n'existe pas
export async function getQuartierById(quartierId) {
  const response = await fetch(`${apiURL}/civilisations/quartiers/read/${quartierId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function getQuartiersByVille(villeId) {
  const response = await fetch(`${apiURL}/civilisations/quartiers/ville/${villeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function getVilles() {
  const response = await fetch(`${apiURL}/civilisations/villes/list?limit=1000`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// __________________________________Religions__________________________________

export async function getReligions() {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  // console.log("Fetching all religions");

  const response = await fetch(`${apiURL}/religions/list`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  const response_json = response.json()

  // console.log("Religions fetched successfully: ", response_json);

  return response_json;
}

export async function getReligionById(religionId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  // console.log("Fetching religion with ID:", religionId);

  const response = await fetch(`${apiURL}/religions/read/${religionId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function getVilleReligionById(ville_id, religion_id) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/religions/ville/${ville_id}/read/${religion_id}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ______________________________Alliances et guerres_____________________________

// Requête authentifiée : renvoie le JSON, ou lève une Error avec le message de l'API
export async function apiRequest(method, path, body = undefined) {
  const response = await fetch(`${apiURL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.detail;
    if (response.status === 401) throw new Error("Vous devez être connecté pour effectuer cette action. Votre session a peut-être expiré : reconnectez-vous.");
    if (Array.isArray(detail)) throw new Error(`Vérifiez les champs : ${[...new Set(detail.map((error) => error.loc?.[error.loc.length - 1]))].join(", ")}.`);
    throw new Error(typeof detail === "string" ? detail : detail?.text || `Erreur ${response.status}`);
  }
  return data;
}

async function publicGet(path) {
  const response = await fetch(`${apiURL}${path}`, { headers: { "Content-Type": "application/json" } });
  if (!response.ok) {
    const error = new Error(`Erreur ${response.status}: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// [{ alliance, membres: [{ civilisation, role, joined_at }], chef_de_file }]
export const getAlliances = () => publicGet("/alliances/list");

// { alliance, membres, chef_de_file, invitations, guerres }
export const getAllianceById = (allianceId) => publicGet(`/alliances/read/${allianceId}`);

export const getAlliancesOfCivilisation = (civilisationId) => publicGet(`/alliances/civilisation/${civilisationId}`);

export const getMesInvitationsAlliances = () => apiRequest("GET", "/alliances/invitations/mine");

// [{ guerre, camps: { attaquant, defenseur }, declarant, moderateur }] — guerres validées uniquement
export const getGuerres = () => publicGet("/guerres/list");

// Guerre publique ; sinon, pour un utilisateur connecté, déclaration non validée qui le concerne
export async function getGuerreById(guerreId) {
  try {
    return await publicGet(`/guerres/read/${guerreId}`);
  } catch (error) {
    if (error.status === 404 && localStorage.getItem("token")) {
      return apiRequest("GET", `/guerres/prive/${guerreId}`);
    }
    throw error;
  }
}

// entityType : "civilisation" ou "religion"
export const getGuerresOfEntity = (entityType, entityId) => publicGet(`/guerres/entite/${entityType}/${entityId}`);

// { a_valider, mes_guerres, appels }
export const getMesGuerres = () => apiRequest("GET", "/guerres/mine");

// Zones de conflit d'une guerre : cartographies de type "guerre" [{ id, title, dimension_id, shape_type, coordinates, color }]
export const getZonesOfGuerre = (guerreId) => publicGet(`/cartographie/entity/guerre/${guerreId}`);

// _______________________________Comptes externes_______________________________

// [{ provider, label, enabled }]
export const getOAuthProviders = () => publicGet("/users/oauth/providers");

// mode "login" (se connecter avec un compte déjà lié) ou "link" (lier depuis le profil) : adresse du fournisseur
export async function startOAuth(provider, mode) {
  const data = await apiRequest("GET", `/users/oauth/${provider}/${mode === "link" ? "link" : "login"}`);
  return data.url;
}

// Retour du fournisseur : GET /users/oauth/{provider}/callback?code=…&state=…
export const completeOAuth = (provider, code, state) => apiRequest("GET", `/users/oauth/${provider}/callback?${new URLSearchParams({ code, state })}`);

// [{ platform, uid, username, avatar_url, linked_at }]
export const getLinkedPlatforms = () => apiRequest("GET", "/users/platforms");

export const unlinkPlatform = (provider) => apiRequest("DELETE", `/users/platforms/${provider}`);

// Journaux et livres écrits par un utilisateur (listes simples)
export const getJournauxOfUser = (userId) => publicGet(`/bibliotheque/journaux/user/${userId}/list`);
export const getLivresOfUser = (userId) => publicGet(`/bibliotheque/livres/user/${userId}/list`);

// Comptes visibles sur le profil public d'un joueur (Minecraft) : [{ platform, uid, username, avatar_url }]
export const getPublicPlatforms = (userId) => publicGet(`/users/id/${userId}/platforms`);

// _________________________________Personnages_________________________________

// [{ personnage, joueur, civilisation, ville, quartier, messages_count }]
export const getPersonnages = () => publicGet("/personnages/list");

// Fiche + messages : [{ id, message_id, excerpt, message_timestamp, journal }]
export const getPersonnageById = (personnageId) => publicGet(`/personnages/read/${personnageId}`);

export const getPersonnagesOfUser = (userId) => publicGet(`/personnages/user/${userId}`);

// residence : "civilisation", "ville" ou "quartier"
export const getPersonnagesOfResidence = (residence, id) => publicGet(`/personnages/residence/${residence}/${id}`);

// Messages d'un journal attribués à des personnages : [{ id, message_id, author_uid, user_id, personnage }]
export const getPersonnagesOfJournal = (journalId) => publicGet(`/personnages/journal/${journalId}`);

export const getQuartiers = () => publicGet("/civilisations/quartiers/list?limit=10000");

// { especes: [{ id, title, description }], classes: [...] } ; gestion : apiRequest sur /personnages/referentiel/{especes|classes}
export const getPersonnageReferentiel = () => publicGet("/personnages/referentiel");


//_______________________________MONDE (ADMIN)__________________________________

// Statistiques relevées dans la sauvegarde par le générateur de cartes (réservées aux administrateurs)
// { releve, precedent, evolution, dimensions, lieux, zones, joueurs, releves }
export const getMondeResume = (releveId) => apiRequest("GET", `/monde/resume${releveId ? `?releve_id=${releveId}` : ""}`);

export const getMondeJoueurs = (releveId, actifs = false) =>
  apiRequest("GET", `/monde/joueurs?actifs=${actifs}${releveId ? `&releve_id=${releveId}` : ""}`);

export const getMondeZones = (releveId, limit = 50) =>
  apiRequest("GET", `/monde/zones?limit=${limit}${releveId ? `&releve_id=${releveId}` : ""}`);

// Évolution d'un lieu d'un relevé à l'autre : type "civilisation", "ville" ou "quartier"
export const getMondeHistoriqueLieu = (type, id) => apiRequest("GET", `/monde/lieux/${type}/${id}`);

// Cherche sur playerdb.co le pseudo des joueurs que le relevé n'a pas nommés
export const resoudreMondePseudos = (releveId) =>
  apiRequest("POST", `/monde/pseudos${releveId ? `?releve_id=${releveId}` : ""}`);

export const deleteMondeReleve = (releveId) => apiRequest("DELETE", `/monde/releves/${releveId}`);


// ___________________________________Autres____________________________________
