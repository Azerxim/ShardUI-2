import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, makeAdmin, signIn, uniqueSuffix } from "./helpers.js";

// Administrateurs du site : événement global au calendrier (au nom de Tetrago), et, à chaque choix de personnage,
// tous les personnages du site (inscription, action secrète, candidature, poste, maison…).
test.describe.configure({ mode: "serial" });

const suffixe = uniqueSuffix();
let admin;
let joueur;
let iseult;

const dansTroisJours = new Date();
dansTroisJours.setDate(dansTroisJours.getDate() + 3);
dansTroisJours.setHours(20, 0, 0, 0);
const deux = (n) => String(n).padStart(2, "0");
const dateHeure = (date) => `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}T${deux(date.getHours())}:${deux(date.getMinutes())}`;
const mois = dateHeure(dansTroisJours).slice(0, 7);
const iso = (minutes) => new Date(Date.now() + minutes * 60_000).toISOString();

const api = async (method, path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})) };
};

test.beforeAll(async () => {
  admin = await createSession("gardien");
  makeAdmin(admin.account.username);
  admin.user = { ...admin.user, is_admin: true };
  joueur = await createSession("conteur");
  iseult = (await apiPost("/personnages/create", joueur.token, { name: `Iseult ${suffixe}` })).personnage;
});

test("seul un administrateur annonce un événement global", async () => {
  const corps = { title: "Faux tournoi", date_debut: dateHeure(dansTroisJours), organisateur_type: "global" };
  expect((await api("POST", "/calendrier/create", joueur.token, corps)).status).toBe(403);
});

test("l'administrateur annonce un événement global, au nom de Tetrago", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, admin);
  await page.goto(`/calendrier?mois=${mois}`);
  await page.locator("main.container").getByRole("button", { name: "Annoncer", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('select[name="organisateur"]').selectOption({ label: "Tetrago · Événement global" });
  await dialog.locator('input[name="title"]').fill(`Fête du serveur ${suffixe}`);
  await dialog.locator('select[name="type"]').selectOption("fete");
  await dialog.locator('input[name="date_debut"]').fill(dateHeure(dansTroisJours));
  await dialog.getByRole("button", { name: "Annoncer" }).click();
  const succes = page.locator(".swal2-popup.swal2-icon-success");
  await expect(succes).toBeVisible();
  await succes.locator(".swal2-confirm").click();
  const carte = page.locator("article", { hasText: `Fête du serveur ${suffixe}` });
  await expect(carte).toContainText("Événement global");
  await expect(carte).toContainText("Tetrago");
});

test("l'administrateur inscrit n'importe quel personnage, un joueur seulement les siens", async ({ page, context }) => {
  const { evenement } = await apiPost("/calendrier/create", admin.token, { title: `Banquet ${suffixe}`, date_debut: dateHeure(dansTroisJours), organisateur_type: "global" });
  const autre = await createSession("intrus");
  expect((await api("POST", `/calendrier/${evenement.id}/inscription`, autre.token, { personnage_id: iseult.id })).status).toBe(403);

  await blockExternalRequests(page);
  await signIn(context, admin);
  await page.goto(`/calendrier?mois=${mois}`);
  await page.locator("article", { hasText: `Banquet ${suffixe}` }).getByRole("button", { name: /S'inscrire/ }).click();
  // Le personnage d'un autre joueur est proposé, avec son joueur
  const choix = page.locator(".swal2-select");
  await expect(choix.locator("option", { hasText: `Iseult ${suffixe}` })).toHaveText(new RegExp(`Iseult ${suffixe} \\(`));
  await choix.selectOption({ label: await choix.locator("option", { hasText: `Iseult ${suffixe}` }).innerText() });
  await page.locator(".swal2-confirm").click();
  const succes = page.locator(".swal2-popup.swal2-icon-success");
  await expect(succes).toBeVisible();
  await succes.locator(".swal2-confirm").click();
  await expect(page.locator("article", { hasText: `Banquet ${suffixe}` })).toContainText(`Iseult ${suffixe}`);
});

test("l'administrateur choisit parmi tous les personnages pour une action, une candidature ou un poste", async () => {
  const fondateur = await createSession("baron");
  const civilisation = (await apiPost("/civilisations/create", fondateur.token, { title: `Baronnie ${suffixe}`, is_public: true })).civilisation;
  const resident = (await apiPost("/personnages/create", joueur.token, { name: `Résidente ${suffixe}`, civilisation_id: civilisation.id })).personnage;

  // Action secrète au nom du personnage d'un autre joueur
  expect((await api("POST", "/actions/create", admin.token, { title: `Complot ${suffixe}`, content: "Dans l'ombre.", entity_type: "personnage", entity_id: iseult.id })).status).toBe(200);
  expect((await api("POST", "/actions/create", fondateur.token, { title: "Usurpé", content: "Non.", entity_type: "personnage", entity_id: iseult.id })).status).toBe(403);

  // Poste : un administrateur y nomme même un personnage qui ne réside pas dans la civilisation
  const poste = await api("POST", "/elections/postes", admin.token, { entity_type: "civilisation", entity_id: civilisation.id, title: "Sénéchal", personnage_id: iseult.id });
  expect(poste.status).toBe(200);
  expect((await api("POST", "/elections/postes", fondateur.token, { entity_type: "civilisation", entity_id: civilisation.id, title: "Bailli", personnage_id: iseult.id })).status).toBe(400);

  // Candidature : les personnages liés de tous les joueurs sont proposés à l'administrateur
  const { scrutin } = await apiPost("/elections", admin.token, { title: `Conseil ${suffixe}`, entity_type: "civilisation", entity_id: civilisation.id, vote_debut: iso(60), vote_fin: iso(120) });
  expect(scrutin.mes_candidats_possibles.map((p) => p.id)).toContain(resident.id);
  const candidature = await api("POST", `/elections/${scrutin.id}/candidatures`, admin.token, { personnage_id: resident.id });
  expect(candidature.status).toBe(200);
  // Le candidat reste au joueur du personnage
  expect(candidature.data.scrutin.candidats[0].user_id).toBe(joueur.user.id);
  const lu = await apiGet(`/elections/${scrutin.id}`);
  expect(lu.scrutin.candidats.map((c) => c.nom)).toEqual([`Résidente ${suffixe}`]);
});
