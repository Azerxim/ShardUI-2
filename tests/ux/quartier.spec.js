import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Le fondateur d'une civilisation crée et gère un quartier : depuis la ville, puis sur la fiche du quartier.
test.describe.configure({ mode: "serial" });

const suffix = uniqueSuffix();
const titles = { quartier: `Quartier ${suffix}`, religion: `Culte ${suffix}` };

let session;
let civilisation;
let ville;
let religion;
let quartierId;

test.beforeAll(async () => {
  session = await createSession("quartier");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  civilisation = (await apiPost("/civilisations/create", session.token, { title: `Comté ${suffix}`, is_public: true })).civilisation;
  ville = await apiPost("/civilisations/villes/create", session.token, {
    title: `Bourg ${suffix}`,
    civilisation_id: civilisation.id,
    dimension_id: dimension?.id ?? 1,
    x: 200,
    z: 300,
    is_public: true,
  });
  religion = (await apiPost("/religions/create", session.token, { title: titles.religion, color: "#aa3355", is_public: true })).religion;
});

test.beforeEach(async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, session);
});

const main = (page) => page.locator("main.container");

test("le fondateur ajoute un quartier depuis la page de sa ville", async ({ page }) => {
  await page.goto(`/civilisation/${civilisation.id}/ville/${ville.id}`);
  await expect(main(page).getByText("Cette ville n'a pas encore de quartier.")).toBeVisible();

  await page.locator('button[data-tip="Ajouter un quartier"]').click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[type="text"]').first().fill(titles.quartier);
  await dialog.locator('input[name="x"]').fill("210");
  await dialog.locator('input[name="z"]').fill("310");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/succès/i);

  // Module du quartier : position et carte, sans population
  await expect(main(page).locator("a", { hasText: titles.quartier })).toBeVisible();
  await expect(main(page).getByText(/X 210 · Z 310/)).toBeVisible();
  await expect(main(page).locator(`iframe[title="Carte de ${titles.quartier}"]`)).toHaveCount(1);
  await expect(main(page).getByRole("link", { name: /voir le quartier/i })).toBeVisible();
  const quartiers = await apiGet(`/civilisations/quartiers/ville/${ville.id}`);
  quartierId = quartiers.find((item) => item.title === titles.quartier).id;
});

test("la fiche du quartier présente sa ville, sa civilisation et ses actions", async ({ page }) => {
  await page.goto(`/civilisation/${civilisation.id}/ville/${ville.id}`);
  await main(page).locator("a", { hasText: titles.quartier }).click();
  await page.waitForURL(`**/quartier/${quartierId}`);

  await expect(main(page).locator("h1")).toContainText(titles.quartier);
  await expect(main(page).getByRole("link", { name: ville.title, exact: true })).toBeVisible();
  await expect(main(page).getByRole("link", { name: civilisation.title, exact: true })).toBeVisible();
  await expect(main(page).getByText("X 210 · Z 310")).toBeVisible();
  // La modale de modification (fermée) garde un champ Population masqué : seul l'affichage compte
  await expect(main(page).getByText("Population", { exact: true }).filter({ visible: true })).toHaveCount(0);
  for (const name of ["Frontières", "Modifier", "Ajouter"]) {
    await expect(main(page).getByRole("button", { name, exact: true })).toBeVisible();
  }
});

test("ajouter une religion au quartier", async ({ page }) => {
  await page.goto(`/quartier/${quartierId}`);
  await main(page).getByRole("button", { name: "Ajouter", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator("select").selectOption({ label: titles.religion });
  await dialog.locator('input[name="influence"]').fill("40");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/succès/i);

  await expect(main(page).getByRole("button", { name: new RegExp(titles.religion) })).toBeVisible();
  const infos = await apiGet(`/civilisations/quartiers/read/${quartierId}`);
  expect(infos.religions).toEqual([expect.objectContaining({ id: religion.id, influence: 40 })]);
});

test("la fiche d'une religion mène à ses quartiers", async ({ page }) => {
  await page.goto(`/religion/${religion.id}`);
  await main(page).locator("a", { hasText: titles.quartier }).click();
  await page.waitForURL(`**/quartier/${quartierId}`);
});

test("un visiteur voit la fiche du quartier sans actions", async ({ browser }) => {
  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  const page = await context.newPage();
  await page.goto(`/quartier/${quartierId}`);
  await expect(main(page).locator("h1")).toContainText(titles.quartier);
  await expect(main(page).getByRole("button", { name: /frontières|modifier|ajouter/i })).toHaveCount(0);
  await context.close();
});

test("modifier le quartier met la fiche à jour", async ({ page }) => {
  const title = `${titles.quartier} (agrandi)`;
  await page.goto(`/quartier/${quartierId}`);
  await main(page).getByRole("button", { name: "Modifier", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator('input[type="text"]').first()).toHaveValue(titles.quartier);
  await dialog.locator('input[type="text"]').first().fill(title);
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/succès/i);
  await expect(main(page).locator("h1")).toContainText(title);
  await expect(main(page).getByText("X 210 · Z 310")).toBeVisible();
  titles.quartier = title;
});

test("supprimer le quartier ramène à sa ville et retire ses religions", async ({ page }) => {
  await page.goto(`/quartier/${quartierId}`);
  await main(page).getByRole("button", { name: "Modifier", exact: true }).click();
  await page.locator("dialog[open] button.btn-error").click();
  expect(await readAlert(page)).toMatch(/supprimé|succès/i);
  await page.waitForURL(`**/civilisation/${civilisation.id}/ville/${ville.id}`);

  expect(await apiGet(`/civilisations/quartiers/ville/${ville.id}`)).toEqual([]);
  const religionInfos = await apiGet(`/religions/read/${religion.id}`);
  expect(religionInfos.quartiers).toEqual([]);
});
