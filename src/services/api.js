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

  const response = await fetch(`${apiURL}/civilisations/list?limit=1000`, {
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

  const response = await fetch(`${apiURL}/religions/list?limit=1000`, {
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

// Bâtiments (Marker) et zones (Polygon) qu'une guerre RP autorise à détruire dans une ville
// [{ id, title, description, dimension_id, shape_type, coordinates, color }]
export const getDestructiblesOfVille = (villeId) => publicGet(`/cartographie/entity/destructible/${villeId}`);

// Marchés et quartiers marchands d'une ville (polygones nommés) ; leurs boutiques sont les magasins situés à l'intérieur
export const getZonesCommercialesOfVille = (villeId) => publicGet(`/cartographie/entity/commerciale/${villeId}`);

// Toutes les formes de cartographie, filtrées par type côté site (ex. zones commerciales de la page des commerces)
export const getCartographies = () => publicGet("/cartographie/list?limit=10000");

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

// Portrait envoyé (PNG, JPEG ou WebP, 5 Mo au plus) : remplace le lien de portrait
export const envoyerPortraitPersonnage = (personnageId, fichier) => envoyerFichier(`/personnages/portrait/${personnageId}`, "image", fichier);

export const retirerPortraitPersonnage = (personnageId) => apiRequest("DELETE", `/personnages/portrait/${personnageId}`);

// Skin envoyé (PNG 64 × 64 ou 64 × 32, 1 Mo au plus) : devient la source du skin
export const envoyerSkinPersonnage = (personnageId, fichier) => envoyerFichier(`/personnages/skin/${personnageId}`, "skin", fichier);

// Adresse d'un portrait ou d'un skin envoyé (nom aléatoire renvoyé par l'API)
export const fichierPersonnageUrl = (nom) => `${apiURL}/personnages/fichier/${nom}`;

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


//_______________________________POPULATION OFFICIELLE___________________________

// { mesuree, mesure: { releve_at, methode, rayon }, ajustements (acceptés), en_attente, officielle }
export const getPopulationVille = (villeId) => publicGet(`/population/ville/${villeId}`);

// { officielle, armee, habitants_par_soldat, villes: [{ id, title, mesuree, officielle }] }
export const getPopulationCivilisation = (civilisationId) => publicGet(`/population/civilisation/${civilisationId}`);

// Modérateurs RP : demandes d'ajustement à valider, avec leur ville
export const getAjustementsEnAttente = () => apiRequest("GET", "/population/ajustements/en-attente");

// Dirigeants de la civilisation : { ville_id, ecart, motif }
export const demanderAjustement = (ajustement) => apiRequest("POST", "/population/ajustements", ajustement);

export const deciderAjustement = (ajustementId, accepte, note = null) => apiRequest("PUT", `/population/ajustements/${ajustementId}/decision`, { accepte, note });

export const retirerAjustement = (ajustementId) => apiRequest("DELETE", `/population/ajustements/${ajustementId}`);


//_______________________________ACTIONS SECRÈTES________________________________

// Registre public : [{ id, code, created_at, empreinte, revealed }] pour une action scellée,
// tout (titre, contenu, entite, guerre, sel, lectures…) pour une action révélée
export const getActionsSecretes = () => publicGet("/actions/list");

// Actions révélées rattachées à une guerre
export const getActionsOfGuerre = (guerreId) => publicGet(`/actions/guerre/${guerreId}`);

// Actions dont l'utilisateur connecté est l'auteur, en entier, avec les lectures tracées
export const getMesActions = () => apiRequest("GET", "/actions/mine");

// Lire une action scellée : libre pour l'auteur, tracé pour un administrateur ou modérateur RP
export const lireAction = (actionId) => apiRequest("POST", `/actions/lire/${actionId}`);

// { title, content, entity_type, entity_id, guerre_id?, reveal_at? }
export const createAction = (action) => apiRequest("POST", "/actions/create", action);

// motif : obligatoire pour un modérateur qui révèle l'action d'un autre
export const revelerAction = (actionId, motif = null) => apiRequest("POST", `/actions/${actionId}/reveler`, { motif });


//_______________________________CATALOGUE DES BOUTIQUES________________________

// [{ id, title, categorie, description, prix, quantite, prix_unitaire, en_stock, updated_at }]
export const getCatalogueMagasin = (magasinId) => publicGet(`/catalogue/magasin/${magasinId}`);

// Où acheter : { total, resultats: [{ ...article, magasin, commerce, ville, dimension }] }
// (magasins publics des commerces publics, en stock d'abord puis du moins cher à l'unité)
export const rechercherArticles = ({ q = "", categorie = "", villeId = "", enStock = false } = {}) => {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (categorie) params.set("categorie", categorie);
  if (villeId) params.set("ville_id", villeId);
  if (enStock) params.set("en_stock", "true");
  return publicGet(`/catalogue/recherche?${params}`);
};

// Fondateur et Admins du commerce : { magasin_id, title, categorie, description, prix, quantite, en_stock }
export const createArticle = (article) => apiRequest("POST", "/catalogue/articles", article);

export const updateArticle = (articleId, article) => apiRequest("PUT", `/catalogue/articles/${articleId}`, article);

export const deleteArticle = (articleId) => apiRequest("DELETE", `/catalogue/articles/${articleId}`);


//_______________________________LIENS DES LIVRES_______________________________

// Religions, commerces, alliances et personnages liés à un livre : [{ id, livre_id, entite: { type, id, title, … } }]
export const getLiensLivre = (livreId) => publicGet(`/bibliotheque/livres/liens/${livreId}`);

// type : "religion", "commerce", "alliance" ou "personnage" ; [{ lien_id, livre }]
export const getLivresOfEntite = (type, id) => publicGet(`/bibliotheque/livres/entite/${type}/${id}/list`);

// Droits sur le livre et sur l'entité liée
export const lierLivre = (livreId, type, id) => apiRequest("POST", "/bibliotheque/livres/liens", { livre_id: livreId, entity_type: type, entity_id: id });

// Droits sur le livre ou sur l'entité liée
export const delierLivre = (lienId) => apiRequest("DELETE", `/bibliotheque/livres/liens/${lienId}`);


//_______________________________MARCHÉS ET FOIRES______________________________

// Villes publiques : { jours: [{ cartographie_id, jours (0 = lundi), horaires }], foires: [foire à venir ou en cours] }
export const getMarches = () => publicGet("/marches/list");

// { jours, a_venir, passees } ; foire : { id, title, description, date_debut, date_fin, horaires, zone, ville, dimension_id, x, z }
export const getMarchesVille = (villeId) => publicGet(`/marches/ville/${villeId}`);

// Dirigeants de la civilisation : jours (0 = lundi … 6 = dimanche) et horaires libres d'une zone commerciale
export const setJoursMarche = (zoneId, jours, horaires) => apiRequest("PUT", `/marches/zones/${zoneId}/jours`, { jours, horaires });

// { ville_id, title, description?, date_debut, date_fin?, horaires?, zone_id? } — annoncée sur Discord
export const createFoire = (foire) => apiRequest("POST", "/marches/foires", foire);

export const updateFoire = (foireId, foire) => apiRequest("PUT", `/marches/foires/${foireId}`, foire);

export const deleteFoire = (foireId) => apiRequest("DELETE", `/marches/foires/${foireId}`);


//_______________________________CIBLES D'UNE GUERRE_____________________________

// { attaquant: [{ entite, villes: [{ id, title, civilisation_id, dimension_id, x, z, destructibles }] }], defenseur: [...] }
export const getCiblesGuerre = (guerreId) => publicGet(`/guerres/cibles/${guerreId}`);


//_______________________________FERMES_________________________________________

// Fermes déclarées par l'utilisateur connecté
export const getMesFermes = () => apiRequest("GET", "/fermes/mine");

// Modérateurs RP : toutes les fermes, en attente d'abord
export const getFermes = () => apiRequest("GET", "/fermes/list");

// { title, type, production?, justification, habillage?, dimension_id?, x, y?, z, ville_id? }
export const declarerFerme = (ferme) => apiRequest("POST", "/fermes/create", ferme);

export const updateFerme = (fermeId, ferme) => apiRequest("PUT", `/fermes/update/${fermeId}`, ferme);

export const deleteFerme = (fermeId) => apiRequest("DELETE", `/fermes/delete/${fermeId}`);

// status : "validee" ou "a_corriger" (note obligatoire)
export const deciderFerme = (fermeId, status, note = null) => apiRequest("PUT", `/fermes/decision/${fermeId}`, { status, note });

// Envoi d'un fichier en multipart (champ `champ`) : pas d'en-tête JSON, le navigateur pose la frontière
async function envoyerFichier(path, champ, fichier) {
  const corps = new FormData();
  corps.append(champ, fichier);
  const response = await fetch(`${apiURL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: corps,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data?.detail === "string" ? data.detail : `Erreur ${response.status}`);
  return data;
}

// Photo (PNG, JPEG ou WebP, 5 Mo au plus)
export const envoyerPhotoFerme = (fermeId, fichier) => envoyerFichier(`/fermes/photo/${fermeId}`, "photo", fichier);

// Adresse d'affichage d'une photo de ferme (nom aléatoire renvoyé par l'API)
export const photoFermeUrl = (nom) => `${apiURL}/fermes/photo/${nom}`;


//_______________________________CALENDRIER___________________________________

// Événements (annulés compris) et foires des villes publiques qui touchent la période : { evenements, foires }
// evenement : { id, title, description, type, date_debut, date_fin, lieu, ville, organisateur: { type, id, title },
//   guerre, places, inscrits: [{ user, personnage }], complet, status, motif_annulation, termine, created_by }
export const getCalendrier = (debut, fin) => publicGet(`/calendrier/list?debut=${debut}&fin=${fin}`);

// { title, type, date_debut, date_fin?, lieu?, ville_id?, organisateur_type?, organisateur_id?, guerre_id?, places?, description? }
export const createEvenement = (evenement) => apiRequest("POST", "/calendrier/create", evenement);

export const updateEvenement = (evenementId, evenement) => apiRequest("PUT", `/calendrier/update/${evenementId}`, evenement);

export const annulerEvenement = (evenementId, motif = null) => apiRequest("POST", `/calendrier/${evenementId}/annuler`, { motif });

// S'inscrire, ou changer le personnage de son inscription
export const inscrireEvenement = (evenementId, personnageId = null) => apiRequest("POST", `/calendrier/${evenementId}/inscription`, { personnage_id: personnageId });

export const desinscrireEvenement = (evenementId) => apiRequest("DELETE", `/calendrier/${evenementId}/inscription`);


//_______________________________LIGNÉES ET MAISONS___________________________

// { maison, parents, enfants, conjoints, fratrie, heritiers, heritier_de } ; entrée : { personnage, date_rp, rang, lien_id }
export const getFamille = (personnageId) => publicGet(`/lignees/personnage/${personnageId}`);

// Demandes en attente qui concernent ses personnages : { recues, envoyees }
export const getDemandesParente = () => apiRequest("GET", "/lignees/demandes");

// { type: parent | conjoint | heritier, source_id, cible_id, rang?, date_rp? } (parent : source est parent de cible)
export const createLienParente = (lien) => apiRequest("POST", "/lignees/liens", lien);

export const repondreLienParente = (lienId, accepter) => apiRequest("POST", `/lignees/liens/${lienId}/${accepter ? "accepter" : "refuser"}`);

export const deleteLienParente = (lienId) => apiRequest("DELETE", `/lignees/liens/${lienId}`);

export const getMaisons = () => publicGet("/lignees/maisons");

// { maison, membres, allies, liens: [{ id, type, source_id, cible_id, date_rp }] }
export const getMaison = (maisonId) => publicGet(`/lignees/maisons/${maisonId}`);

// { title, chef_id, devise?, description?, couleur?, icon?, civilisation_id?, date_fondation? }
export const createMaison = (maison) => apiRequest("POST", "/lignees/maisons", maison);

export const updateMaison = (maisonId, maison) => apiRequest("PUT", `/lignees/maisons/${maisonId}`, maison);

export const deleteMaison = (maisonId) => apiRequest("DELETE", `/lignees/maisons/${maisonId}`);

export const rejoindreMaison = (maisonId, personnageId) => apiRequest("POST", `/lignees/maisons/${maisonId}/membres`, { personnage_id: personnageId });

export const retirerMembreMaison = (maisonId, personnageId) => apiRequest("DELETE", `/lignees/maisons/${maisonId}/membres/${personnageId}`);


//_______________________________CHRONIQUES___________________________________

// Frise, plus récent d'abord : [{ id, categorie, date, date_rp, title, description, lien, fait_id? }]
export const getChroniques = () => publicGet("/chroniques/list");

// Modérateurs RP : { title, date, date_rp?, description? }
export const createFaitChronique = (fait) => apiRequest("POST", "/chroniques/faits", fait);

export const updateFaitChronique = (faitId, fait) => apiRequest("PUT", `/chroniques/faits/${faitId}`, fait);

export const deleteFaitChronique = (faitId) => apiRequest("DELETE", `/chroniques/faits/${faitId}`);


// ___________________________________Autres____________________________________
