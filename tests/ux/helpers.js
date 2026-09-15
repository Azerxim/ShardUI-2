import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Donne le rôle de modérateur RP à un compte, directement dans la copie jetable de la base de test
export function makeModerateur(username) {
  const apiDir = path.resolve(process.env.SHARD_API_DIR ?? path.join(here, "../../../Shard-API"));
  const script = "import sqlite3, sys; db = sqlite3.connect(sys.argv[1]); db.execute('update users set is_moderateur = 1 where username = ?', (sys.argv[2],)); db.commit()";
  execFileSync(path.join(apiDir, ".venv", "bin", "python"), ["-c", script, path.join(here, ".env-api", "ShardDB.db"), username]);
}

function runPython(script, args) {
  const apiDir = path.resolve(process.env.SHARD_API_DIR ?? path.join(here, "../../../Shard-API"));
  return execFileSync(path.join(apiDir, ".venv", "bin", "python"), ["-c", script, path.join(here, ".env-api", "ShardDB.db"), ...args.map(String)]).toString().trim();
}

// Lie un compte externe (discord, microsoft) à un compte de test, sans passer par l'autorisation OAuth
export function linkPlatform(userId, platform, uid) {
  runPython("import sqlite3, sys, datetime; db = sqlite3.connect(sys.argv[1]); db.execute('insert into userplatforms (user_id, platform, uid, username, linked_at) values (?, ?, ?, ?, ?)', (int(sys.argv[2]), sys.argv[3], sys.argv[4], 'Joueur ' + sys.argv[4], str(datetime.datetime.now()))); db.commit()", [userId, platform, uid]);
}

export const linkDiscordAccount = (userId, discordUid) => linkPlatform(userId, "discord", discordUid);

// Journal relié à un salon Discord, inséré directement en base (créer un journal par l'API créerait un vrai salon)
export function createDiscordJournal({ title, uid, userId }) {
  return Number(runPython("import sqlite3, sys, datetime; db = sqlite3.connect(sys.argv[1]); cur = db.execute('insert into journaux (user_id, author, title, uid, created_at) values (?, ?, ?, ?, ?)', (int(sys.argv[4]), 'Testeur', sys.argv[2], sys.argv[3], str(datetime.datetime.now()))); db.commit(); print(cur.lastrowid)", [title, uid, userId]));
}

// Messages renvoyés par l'API de test pour un salon (voir SHARD_FAKE_JOURNAL_MESSAGES dans playwright.config.js)
export function setJournalMessages(channelId, messages) {
  const file = path.join(here, ".env-api", "fake-journal-messages.json");
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : {};
  data[String(channelId)] = messages;
  fs.writeFileSync(file, JSON.stringify(data));
}

// Annonces Discord enregistrées par l'API de test : [{ channel, content }] (voir SHARD_FAKE_DISCORD_ANNOUNCEMENTS)
export function readAnnouncements() {
  const file = path.join(here, ".env-api", "fake-discord-announcements.jsonl");
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf-8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

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

// Nouveau jeton pour un compte de test : toute connexion (mot de passe ou Discord) ferme les sessions précédentes du compte
export async function refreshSession(session) {
  const response = await fetch(`${API_URL}/users/token`, {
    method: "POST",
    body: new URLSearchParams({ username: session.account.username, password: session.account.password }),
  });
  const { access_token: token } = await response.json();
  return { ...session, token };
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
