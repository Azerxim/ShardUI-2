const baseURL = import.meta.env.VITE_API_BASE_URL;
const apiURL = `${baseURL}/api`;

export function getApiURL() {
  // console.log("API URL:", apiURL); // Log the API URL for debugging
  return apiURL;
}

//_____________________________________TOKEN_____________________________________

export async function postToken(params, expiryHours = 24) {
  const url = new URL(`${apiURL}/users/token`);
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

export async function getUserById(userId) {
  const response = await fetch(`${apiURL}/users/id/${userId}`, {
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

export async function getUserByUsername(username) {
  const response = await fetch(`${apiURL}/users/name/${username}`, {
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

export async function getUsers() {
  const response = await fetch(`${apiURL}/users/list`, {
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

  // console.log("Civilisations fetched successfully: ", response_json);

  return response_json;
}

export async function deleteMemberCivilisation(civilisationId, memberId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  const response = await fetch(`${apiURL}/civilisations/members/${civilisationId}/remove?member_id=${memberId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
  }

  return response.json();
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

// __________________________________Alliances__________________________________


// ___________________________________Autres____________________________________
