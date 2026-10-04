import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, signIn, uniqueSuffix } from "./helpers.js";

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
  for (const name of ["Frontières", "Modifier"]) {
    await expect(main(page).getByRole("button", { name, exact: true })).toBeVisible();
  }
  // « Ajouter » : une religion, et un quartier
  await expect(main(page).getByRole("button", { name: "Ajouter", exact: true })).toHaveCount(2);
  await expect(page.locator('button[data-tip="Ajouter un quartier"]')).toBeVisible();
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

test("le fondateur désigne les bâtiments et zones destructibles de sa ville", async ({ page }) => {
  const section = main(page).getByRole("heading", { name: "Zones et bâtiments destructibles" });
  await expect(section).toBeVisible();
  await expect(main(page).getByText(/aucun bâtiment ni aucune zone n'est désigné comme destructible/i)).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Sélectionner", exact: true })).toBeVisible();

  // Ce que l'éditeur de carte enregistre : un marqueur par bâtiment, un polygone par zone
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  const element = (title, shape_type, coordinates) => ({ title, shape_type, coordinates, type: "destructible", type_id: ville.id, dimension_id: dimension?.id ?? 1, color: "#c98a12" });
  await apiPost("/cartographie/create", session.token, { ...element("Moulin du Gué", "Marker", "[45,120]"), description: "Le moulin à grain" });
  await apiPost("/cartographie/create", session.token, element("Faubourg sud", "Polygon", "[[40,110],[40,130],[60,130],[60,110]]"));

  // Un autre joueur ne peut rien désigner ; un modérateur RP le peut
  const autre = await createSession("villeautre");
  await expect(apiPost("/cartographie/create", autre.token, element("Intrus", "Marker", "[0,0]"))).rejects.toThrow(/403/);
  const moderateur = await createSession("villemodo");
  makeModerateur(moderateur.account.username);
  await apiPost("/cartographie/create", moderateur.token, element("Tour de guet", "Marker", "[50,125]"));

  await page.reload();
  for (const name of ["Moulin du Gué", "Faubourg sud", "Tour de guet"]) {
    await expect(main(page).getByText(name, { exact: true })).toBeVisible();
  }
  await expect(main(page).getByText("Le moulin à grain")).toBeVisible();
  await expect(main(page).getByText(/2 bâtiments et 1 zone/)).toBeVisible();
  await expect(main(page).getByText("X 120 · Z -45")).toHaveCount(2); // la ville et le moulin
});

test("supprimer la ville ramène à sa civilisation", async ({ page }) => {
  await main(page).getByRole("button", { name: "Modifier", exact: true }).click();
  await page.locator("dialog[open] button.btn-error").click();
  expect(await readAlert(page)).toMatch(/supprimée|succès/i);
  await page.waitForURL(`**/civilisation/${civilisationId}`);
  const civilisation = await apiGet(`/civilisations/read/${civilisationId}`);
  expect(civilisation.villes.some((item) => item.id === ville.id)).toBe(false);
  // Ses bâtiments et zones destructibles disparaissent avec elle
  expect(await apiGet(`/cartographie/entity/destructible/${ville.id}`)).toEqual([]);
});
