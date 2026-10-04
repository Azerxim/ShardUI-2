import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, readAlert, readAnnouncements, readDiscordEvents, signIn, uniqueSuffix } from "./helpers.js";

// Calendrier des événements RP : annoncés au nom d'un joueur ou d'une entité qu'il dirige, inscriptions sous les traits
// d'un personnage, annonce Discord et événement programmé du serveur Discord (simulés par l'API de test).
test.describe.configure({ mode: "serial" });

let dirigeant;
let joueur;
let civilisation;
let ville;
let personnage;
const suffixe = uniqueSuffix();
const titre = `Couronnement ${suffixe}`;

// Dans trois jours à 21 h (heure locale), au format des champs datetime-local
const dansTroisJours = new Date();
dansTroisJours.setDate(dansTroisJours.getDate() + 3);
dansTroisJours.setHours(21, 0, 0, 0);
const deux = (n) => String(n).padStart(2, "0");
const iso = (date) => `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
const dateHeure = (date) => `${iso(date)}T${deux(date.getHours())}:${deux(date.getMinutes())}`;
const mois = iso(dansTroisJours).slice(0, 7);

const apiStatus = async (method, path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  return response.status;
};

test.beforeAll(async () => {
  dirigeant = await createSession("chambellan");
  joueur = await createSession("convive");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  civilisation = (await apiPost("/civilisations/create", dirigeant.token, { title: `Royaume ${suffixe}`, is_public: true })).civilisation;
  ville = await apiPost("/civilisations/villes/create", dirigeant.token, {
    title: `Sacreville ${suffixe}`, civilisation_id: civilisation.id, dimension_id: dimension?.id ?? 1, x: 0, z: 0, is_capital: true, is_public: true,
  });
  personnage = (await apiPost("/personnages/create", joueur.token, { name: `Dame Iseult ${suffixe}` })).personnage;
});

const main = (page) => page.locator("main.container");

test("on n'annonce ni au nom d'une entité qu'on ne dirige pas, ni un événement passé", async () => {
  expect(await apiStatus("POST", "/calendrier/create", joueur.token, {
    title: "Usurpation", date_debut: dateHeure(dansTroisJours), organisateur_type: "civilisation", organisateur_id: civilisation.id,
  })).toBe(403);
  expect(await apiStatus("POST", "/calendrier/create", joueur.token, { title: "Hier", date_debut: "2020-01-01T20:00" })).toBe(400);
});

test("le dirigeant annonce un couronnement au nom de sa civilisation", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, dirigeant);
  await page.goto(`/calendrier?mois=${mois}`);
  await main(page).getByRole("button", { name: "Annoncer", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('select[name="organisateur"]').selectOption({ label: `Civilisation · Royaume ${suffixe}` });
  await dialog.locator('input[name="title"]').fill(titre);
  await dialog.locator('select[name="type"]').selectOption("couronnement");
  await dialog.locator('input[name="date_debut"]').fill(dateHeure(dansTroisJours));
  await dialog.locator('input[name="lieu"]').fill("Grande salle du château");
  await dialog.locator('select[name="ville_id"]').selectOption({ label: `Sacreville ${suffixe}` });
  await dialog.locator('input[name="places"]').fill("2");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/événement est annoncé/);

  const carte = main(page).locator("article", { hasText: titre });
  await expect(carte).toContainText("Couronnement");
  await expect(carte).toContainText(`Royaume ${suffixe}`);
  await expect(carte).toContainText(`Grande salle du château, Sacreville ${suffixe}`);
  await expect(carte).toContainText("0 inscrit sur 2 places");
  // Puce dans la grille du mois, qui mène à la carte
  await expect(main(page).getByRole("grid").locator(`a[title="${titre}"]`)).toHaveCount(1);

  const annonce = readAnnouncements().find((a) => a.channel === "evenements" && a.content.includes(titre));
  expect(annonce?.content).toMatch(/par Royaume .*à 21 h, Grande salle du château, Sacreville/);
  const discord = readDiscordEvents().filter((e) => e.name?.includes(titre));
  expect(discord.map((e) => e.action)).toEqual(["create"]);
  expect(discord[0].location).toBe(`Grande salle du château, Sacreville ${suffixe}`);
});

test("un joueur s'inscrit sous les traits de son personnage", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, joueur);
  await page.goto(`/calendrier?mois=${mois}`);
  const carte = main(page).locator("article", { hasText: titre });
  await carte.getByRole("button", { name: "S'inscrire" }).click();
  await page.locator(".swal2-select").selectOption({ label: `Dame Iseult ${suffixe}` });
  await page.locator(".swal2-confirm").click();
  await page.locator(".swal2-popup", { hasText: "Vous êtes inscrit" }).waitFor();
  await readAlert(page);
  await expect(carte).toContainText("Inscrit");
  await expect(carte).toContainText(`Sous les traits de Dame Iseult ${suffixe}`);
  await carte.locator("summary").click();
  await expect(carte.getByRole("link", { name: `Dame Iseult ${suffixe}` })).toHaveAttribute("href", `/personnage/${personnage.id}`);
  // Seul l'organisateur gère l'événement
  await expect(carte.getByRole("button", { name: "Modifier" })).toHaveCount(0);
});

test("l'annulation est annoncée, retire l'événement Discord et ferme les inscriptions", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, dirigeant);
  await page.goto(`/calendrier?mois=${mois}`);
  const carte = main(page).locator("article", { hasText: titre });
  await carte.getByRole("button", { name: "Annuler" }).click();
  await page.locator(".swal2-input").fill("Le prétendant a disparu");
  await page.locator(".swal2-confirm").click();
  await page.locator(".swal2-popup", { hasText: "L'événement est annulé" }).waitFor();
  await readAlert(page);
  await expect(carte).toContainText("Annulé");
  await expect(carte).toContainText("Motif de l'annulation : Le prétendant a disparu");
  await expect(carte.getByRole("button", { name: "Modifier" })).toHaveCount(0);

  expect(readAnnouncements().some((a) => a.channel === "evenements" && a.content.includes(titre) && a.content.includes("est annulé"))).toBe(true);
  expect(readDiscordEvents().filter((e) => e.action === "delete").length).toBeGreaterThan(0);
  const [{ id }] = (await apiGet(`/calendrier/list?debut=${iso(dansTroisJours)}&fin=${iso(dansTroisJours)}`)).evenements.filter((e) => e.title === titre);
  expect(await apiStatus("POST", `/calendrier/${id}/inscription`, joueur.token, {})).toBe(400);
});

test("les foires des villes figurent au calendrier", async ({ page }) => {
  await blockExternalRequests(page);
  await apiPost("/marches/foires", dirigeant.token, { ville_id: ville.id, title: `Foire du sacre ${suffixe}`, date_debut: iso(dansTroisJours) });
  await page.goto(`/calendrier?mois=${mois}`);
  await expect(main(page).locator("article", { hasText: `Foire du sacre ${suffixe}` })).toContainText(`Sacreville ${suffixe}`);
});
