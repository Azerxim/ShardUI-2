import { test, expect } from "@playwright/test";
import { API_URL, apiGet, apiPost, blockExternalRequests, createSession, readAlert, readAnnouncements, signIn, uniqueSuffix } from "./helpers.js";

// Jours de marché des zones commerciales (semaine réelle) et foires datées d'une ville : posés par les dirigeants de la
// civilisation sur la fiche de la ville (#marches), affichés sur la page des commerces et annoncés sur Discord.
test.describe.configure({ mode: "serial" });

let dirigeant;
let passant;
let civilisationId;
let ville;
let zone;
const suffixe = uniqueSuffix();
const iso = (jours) => {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const apiPut = async (path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`PUT ${path} : ${response.status}`);
  return response.json();
};

test.beforeAll(async () => {
  dirigeant = await createSession("bourgmestre");
  passant = await createSession("passant");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  civilisationId = (await apiPost("/civilisations/create", dirigeant.token, { title: `Comté ${suffixe}`, is_public: true })).civilisation.id;
  ville = await apiPost("/civilisations/villes/create", dirigeant.token, {
    title: `Marchebourg ${suffixe}`, civilisation_id: civilisationId, dimension_id: dimension?.id ?? 1, x: 100, z: 200, is_capital: true, is_public: true,
  });
  const forme = await apiPost("/cartographie/create", dirigeant.token, {
    title: `Halle ${suffixe}`, type: "commerciale", type_id: ville.id, dimension_id: dimension?.id ?? 1, shape_type: "Polygon",
    coordinates: JSON.stringify([[-190, 90], [-190, 110], [-210, 110], [-210, 90]]),
  });
  zone = forme.cartographie ?? forme;
});

const main = (page) => page.locator("main.container");

test("seuls les dirigeants posent les jours de marché et annoncent une foire", async () => {
  await expect(apiPut(`/marches/zones/${zone.id}/jours`, passant.token, { jours: [5] })).rejects.toThrow(/403/);
  await expect(apiPut(`/marches/zones/${zone.id}/jours`, dirigeant.token, { jours: [7] })).rejects.toThrow(/400/);
  await expect(apiPost("/marches/foires", passant.token, { ville_id: ville.id, title: "Intrus", date_debut: iso(2) })).rejects.toThrow(/403/);
  await expect(apiPost("/marches/foires", dirigeant.token, { ville_id: ville.id, title: "À l'envers", date_debut: iso(3), date_fin: iso(2) })).rejects.toThrow(/400/);
  await expect(apiPost("/marches/foires", dirigeant.token, { ville_id: ville.id, title: "Passée", date_debut: iso(-3), date_fin: iso(-2) })).rejects.toThrow(/400/);
});

test("le dirigeant fixe les jours de marché depuis la fiche de la ville", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, dirigeant);
  await page.goto(`/civilisation/${civilisationId}/ville/${ville.id}#marches`);
  const section = main(page).locator("#marches");
  await expect(section).toContainText("Jours de marché non précisés");
  await section.getByRole("button", { name: `Jours de marché de Halle ${suffixe}` }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Mercredi").check();
  await dialog.getByLabel("Samedi").check();
  await dialog.locator('input[name="horaires"]').fill("de 20 h à 23 h");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/jours de marché sont enregistrés/);
  await expect(section).toContainText("Ouvert le mercredi et le samedi, de 20 h à 23 h");
});

test("une foire annoncée apparaît sur la fiche, la page des commerces et Discord", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, dirigeant);
  await page.goto(`/civilisation/${civilisationId}/ville/${ville.id}#marches`);
  const section = main(page).locator("#marches");
  await section.getByRole("button", { name: "Annoncer" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(`Foire aux chevaux ${suffixe}`);
  await dialog.locator('input[name="date_debut"]').fill(iso(3));
  await dialog.locator('input[name="date_fin"]').fill(iso(4));
  await dialog.locator('select[name="zone_id"]').selectOption({ label: `Halle ${suffixe}` });
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/foire est annoncée/);
  await expect(section).toContainText(`Foire aux chevaux ${suffixe}`);

  const annonce = readAnnouncements().find((a) => a.channel === "marches" && a.content.includes(`Foire aux chevaux ${suffixe}`));
  expect(annonce?.content).toContain(`Marchebourg ${suffixe}`);

  await page.goto("/commerces");
  const foires = main(page).locator("#foires");
  await expect(foires).toContainText(`Foire aux chevaux ${suffixe}`);
  await expect(foires.getByRole("link", { name: `Marchebourg ${suffixe}` })).toHaveAttribute("href", `/civilisation/${civilisationId}/ville/${ville.id}#marches`);
  await expect(main(page)).toContainText("Ouvert le mercredi et le samedi");
});

test("annuler une foire à venir l'annonce sur Discord", async () => {
  const { a_venir: aVenir } = await apiGet(`/marches/ville/${ville.id}`);
  const foire = aVenir.find((f) => f.title === `Foire aux chevaux ${suffixe}`);
  await fetch(`${API_URL}/marches/foires/${foire.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${dirigeant.token}` } });
  expect(readAnnouncements().some((a) => a.channel === "marches" && a.content.includes("est annulée") && a.content.includes(suffixe))).toBe(true);
  expect((await apiGet("/marches/list")).foires.some((f) => f.id === foire.id)).toBe(false);
});
