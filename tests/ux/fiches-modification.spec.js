import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Modifier une fiche depuis sa modale enregistre chaque champ et met la page à jour : gouvernement d'une civilisation
// (titre, devise), date de fondation d'une ville. Le titre du gouvernement était ignoré par l'API, et sa modale visait le
// gouvernement portant le numéro de la civilisation au lieu du sien.
test.describe.configure({ mode: "serial" });

let session;
let civilisation;
let gouvernementId;
let autreGouvernement;
let ville;

test.beforeAll(async () => {
  session = await createSession("fiches");
  // Un gouvernement en plus avant la civilisation testée : son numéro de gouvernement ne peut plus suivre celui de la civilisation
  const leurre = await apiPost("/civilisations/create", session.token, { title: `Leurre ${uniqueSuffix()}`, is_public: true });
  autreGouvernement = await apiPost("/civilisations/gouvernement/create", session.token, {
    civilisation_id: leurre.civilisation.id, title: "Gouvernement en trop", type: "Conseil",
  });
  const created = await apiPost("/civilisations/create", session.token, { title: `Marche ${uniqueSuffix()}`, is_public: true });
  civilisation = created.civilisation;
  gouvernementId = (await apiGet(`/civilisations/read/${civilisation.id}`)).gouvernement.id;
  const [dimension] = await apiGet("/cartographie/dimensions/read");
  ville = await apiPost("/civilisations/villes/create", session.token, {
    title: `Hameau ${uniqueSuffix()}`, civilisation_id: civilisation.id, dimension_id: dimension?.id ?? 1, x: 10, z: 20, is_public: true,
  });
});

test.beforeEach(async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, session);
});

const main = (page) => page.locator("main.container");

test("le fondateur renomme le gouvernement de sa civilisation et change sa devise", async ({ page }) => {
  expect(gouvernementId).not.toBe(civilisation.id);
  await page.goto(`/civilisation/${civilisation.id}`);
  const titreAvant = `Gouvernement de ${civilisation.title}`;
  await expect(main(page).getByRole("heading", { name: titreAvant })).toBeVisible();

  const section = main(page).locator(".titre-section", { has: page.getByRole("heading", { name: titreAvant }) });
  await section.getByRole("button", { name: "Modifier", exact: true }).click();
  const dialog = page.locator("dialog#Modal_Edit_Gouvernement");
  await expect(dialog).toHaveAttribute("open", "");
  const titre = dialog.locator('input[name="title"]');
  await expect(titre).toHaveValue(titreAvant); // le sien, pas celui du gouvernement portant le numéro de la civilisation
  await titre.fill("Conseil des Marches");
  await dialog.locator('input[name="devise"]').fill("Toujours plus loin");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/succès/i);

  await expect(main(page).getByRole("heading", { name: "Conseil des Marches" })).toBeVisible();
  await expect(main(page).getByText("Devise : « Toujours plus loin »")).toBeVisible();

  // Enregistré en base, sans toucher à l'autre gouvernement
  const { gouvernement } = await apiGet(`/civilisations/gouvernement/read/${gouvernementId}`);
  expect(gouvernement).toMatchObject({ title: "Conseil des Marches", devise: "Toujours plus loin", civilisation_id: civilisation.id });
  const autre = await apiGet(`/civilisations/gouvernement/read/${autreGouvernement.id}`);
  expect(autre.gouvernement.title).toBe("Gouvernement en trop");
});

test("la date de fondation d'une ville s'enregistre et s'affiche sur sa fiche et dans la liste des villes", async ({ page }) => {
  await page.goto(`/civilisation/${civilisation.id}/ville/${ville.id}`);
  await main(page).getByRole("button", { name: "Modifier", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator('input[name="title"]')).toHaveValue(ville.title);
  await dialog.locator('input[name="founded_date"]').fill("0042-03-15");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/succès/i);
  await expect(main(page).getByText(/fondée le 15 mars 42/i)).toBeVisible();

  await page.goto(`/civilisation/${civilisation.id}`);
  const ligne = main(page).locator(`a[href="/civilisation/${civilisation.id}/ville/${ville.id}"]`);
  await expect(ligne.getByText("Fondée le 15 mars 42")).toBeVisible();
});
