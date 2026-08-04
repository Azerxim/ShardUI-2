const baseURL = import.meta.env.VITE_API_BASE_URL;
const apiURL = `${baseURL}/api`;

export function getApiURL() {
  return apiURL;
}

//_____________________________________LDAP_____________________________________

// export async function loginLDAP(username, password) {
//   const response = await fetch(`${apiURL}/auth/ldap`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ username, password }),
//   });
//   return response;
// }

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

//
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
  return response.json();
}

//_____________________________________DATA_____________________________________

export async function getData(url) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  return data;
}
