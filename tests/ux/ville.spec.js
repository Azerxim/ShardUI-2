import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Le fondateur d'une civilisation gère une de ses villes depuis sa fiche : actions visibles, modification, suppression.
test.describe.configure({ mode: "serial" });

let session;
let civilisationId;
let ville;

test.beforeAll(async () => {
  session = await createSession("ville");
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const created = await apiPost("/civilisations/create", session.token, { title: `Cité ${uniqueSuffix()}`, is_public: true });
  civilisationId = created.civilisation.id;
  ville = await apiPost("/civilisations/villes/create", session.token, {
    title: `Bourg ${uniqueSuffix()}`,
    civilisation_id: civilisationId,
    dimension_id: dimension?.id ?? 1,
    x: 120,
    z: -45,
    population: 250,
    is_capital: true,
    is_public: true,
  });
});

test.beforeEach(async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, session);
  await page.goto(`/civilisation/${civilisationId}/ville/${ville.id}`);
});

const main = (page) => page.locator("main.container");

test("le fondateur voit les informations et les actions de sa ville", async ({ page }) => {
  await expect(main(page).locator("h1")).toContainText(ville.title);
  await expect(main(page).locator(".badge", { hasText: "Capitale" })).toBeVisible();
  await expect(main(page).getByText("X 120 · Z -45")).toBeVisible();
  await expect(main(page).getByText("250", { exact: true })).toBeVisible();
  for (const name of ["Frontières", "Modifier", "Ajouter"]) {
    await expect(main(page).getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(main(page).getByText(/aucun commerce n'est encore implanté/i)).toBeVisible();
});

test("modifier la ville met la page à jour sans la vider", async ({ page }) => {
  const title = `${ville.title} (renommé)`;
  await main(page).getByRole("button", { name: "Modifier", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator('input[type="text"]').first()).toHaveValue(ville.title);
  await dialog.locator('input[type="text"]').first().fill(title);
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/succès/i);
  await expect(main(page).locator("h1")).toContainText(title);
  await expect(main(page).getByRole("heading", { name: "Religions", exact: true })).toBeVisible();
  ville = { ...ville, title };
});

test("supprimer la ville ramène à sa civilisation", async ({ page }) => {
  await main(page).getByRole("button", { name: "Modifier", exact: true }).click();
  await page.locator("dialog[open] button.btn-error").click();
  expect(await readAlert(page)).toMatch(/supprimée|succès/i);
  await page.waitForURL(`**/civilisation/${civilisationId}`);
  const civilisation = await apiGet(`/civilisations/read/${civilisationId}`);
  expect(civilisation.villes.some((item) => item.id === ville.id)).toBe(false);
});
