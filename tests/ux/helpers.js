import process from "node:process";

export const API_URL = process.env.SHARD_TEST_API_URL ?? "http://127.0.0.1:8011/api";

export const uniqueSuffix = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

// Statut du serveur Minecraft, skins… : bloqués pour des tests reproductibles, même hors ligne
export async function blockExternalRequests(target) {
  await target.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
}

export async function apiGet(path) {
  const response = await fetch(`${API_URL}${path}`);
  return response.json();
}

export async function apiPost(path, token, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${path} : ${response.status}`);
  return response.json();
}

// Compte créé directement par l'API, avec son jeton
export async function createSession(prefix = "ux") {
  const suffix = uniqueSuffix();
  const account = { username: `${prefix}${suffix}`, full_name: `Joueur ${suffix}`, email: `${prefix}${suffix}@test.local`, password: "MotDePasse123" };
  const created = await fetch(`${API_URL}/users/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!created.ok) throw new Error(`Création du compte de test : ${created.status}`);
  const user = await created.json();
  const tokenResponse = await fetch(`${API_URL}/users/token`, {
    method: "POST",
    body: new URLSearchParams({ username: account.username, password: account.password }),
  });
  const { access_token: token } = await tokenResponse.json();
  return { account, user, token };
}

// Ouvre la session dans le navigateur avant chaque chargement de page
export async function signIn(context, session) {
  await context.addInitScript(([user, token]) => {
    localStorage.setItem("user", user);
    localStorage.setItem("token", token);
  }, [JSON.stringify(session.user), session.token]);
}

// Lit l'alerte SweetAlert affichée puis la ferme (button : "confirm", "deny" ou "cancel")
export async function readAlert(page, button = "confirm") {
  const popup = page.locator(".swal2-popup");
  await popup.waitFor();
  const text = (await popup.innerText()).replace(/\s+/g, " ").trim();
  await page.locator(`.swal2-${button}`).click();
  await popup.waitFor({ state: "hidden" });
  return text;
}

// Renseigne le titre de la modale ouverte (seul champ obligatoire à remplir), l'envoie et renvoie l'alerte obtenue
export async function submitOpenModal(page, title) {
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  await dialog.locator('input[type="text"]').first().fill(title);
  await dialog.locator('button[type="submit"]').click();
  return readAlert(page);
}
