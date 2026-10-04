import { test, expect } from "@playwright/test";
import { API_URL, apiPost, blockExternalRequests, createSession, makeModerateur, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Chroniques de Tetrago : frise remplie toute seule (fondations, guerres…) en dates RP, et faits marquants des modérateurs RP.
test.describe.configure({ mode: "serial" });

let fondateur;
let moderateur;
const suffixe = uniqueSuffix();

const apiStatus = async (method, path, token, body) => {
  const response = await fetch(`${API_URL}${path}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  return response.status;
};

test.beforeAll(async () => {
  fondateur = await createSession("chroniqueur");
  moderateur = await createSession("annaliste");
  makeModerateur(moderateur.account.username);
  moderateur.user = { ...moderateur.user, is_moderateur: true };
  await apiPost("/civilisations/create", fondateur.token, { title: `Principauté ${suffixe}`, is_public: true, date_founded: "0412-12-28" });
  await apiPost("/civilisations/create", fondateur.token, { title: `Cabale ${suffixe}`, is_public: false, date_founded: "0412-03-01" });
  await apiPost("/civilisations/create", fondateur.token, { title: `Contrée sans âge ${suffixe}`, is_public: true });
  const personnage = (await apiPost("/personnages/create", fondateur.token, { name: `Espion ${suffixe}` })).personnage;
  const { action } = await apiPost("/actions/create", fondateur.token, { title: `Vol du sceau ${suffixe}`, content: "Le sceau est dérobé.", entity_type: "personnage", entity_id: personnage.id });
  await apiPost(`/actions/${action.id}/reveler`, fondateur.token, {});
});

const main = (page) => page.locator("main.container");

test("la frise raconte seule les fondations publiques datées dans le monde", async ({ page }) => {
  await blockExternalRequests(page);
  await page.goto("/chroniques");
  const fondation = main(page).locator("li", { hasText: `Fondation : Principauté ${suffixe}` });
  await expect(fondation).toContainText("28 décembre de l'an 412");
  await expect(main(page).getByRole("region", { name: "An 412" })).toContainText(`Principauté ${suffixe}`);
  await expect(fondation.getByRole("link")).toHaveAttribute("href", /\/civilisation\/\d+$/);
  // Une civilisation privée n'entre pas dans l'histoire publique
  await expect(main(page)).not.toContainText(`Cabale ${suffixe}`);
  // Sans date RP, ni une fondation ni une révélation d'action secrète n'entrent dans les chroniques
  await expect(main(page)).not.toContainText(`Contrée sans âge ${suffixe}`);
  await expect(main(page)).not.toContainText(`Vol du sceau ${suffixe}`);

  // Filtres par catégorie
  await main(page).getByRole("button", { name: /Fondations/ }).click();
  await expect(fondation).toHaveCount(0);
  await main(page).getByRole("button", { name: /Fondations/ }).click();
  await expect(fondation).toBeVisible();
});

test("seuls les modérateurs RP inscrivent un fait marquant, toujours daté dans le monde", async () => {
  expect(await apiStatus("POST", "/chroniques/faits", fondateur.token, { title: "Usurpé", date_rp: "0413-01-15" })).toBe(403);
  expect(await apiStatus("POST", "/chroniques/faits", moderateur.token, { title: "Sans date" })).toBe(422);
});

test("un modérateur RP inscrit, modifie puis retire un fait marquant", async ({ page, context }) => {
  await blockExternalRequests(page);
  await signIn(context, moderateur);
  await page.goto("/chroniques");
  await page.getByRole("button", { name: "Fait marquant" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.locator('input[name="title"]').fill(`Le Grand Hiver ${suffixe}`);
  await dialog.locator('input[name="date_rp"]').fill("0413-01-15");
  await dialog.locator('textarea[name="description"]').fill("Les rivières gèlent jusqu'au printemps.");
  await dialog.locator('button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/inscrit dans les chroniques/);

  const fait = main(page).locator("li", { hasText: `Le Grand Hiver ${suffixe}` });
  await expect(fait).toContainText("15 janvier de l'an 413");
  // L'an 413 vient avant l'an 412 : la frise suit la date RP
  const titres = await main(page).locator("section h2").allInnerTexts();
  expect(titres.indexOf("An 413")).toBeLessThan(titres.indexOf("An 412"));
  await expect(fait).toContainText("Les rivières gèlent jusqu'au printemps.");

  await fait.getByRole("button", { name: "Modifier" }).click();
  await page.locator('dialog[open] input[name="title"]').fill(`Le Long Hiver ${suffixe}`);
  await page.locator('dialog[open] button[type="submit"]').click();
  expect(await readAlert(page)).toMatch(/mis à jour/);
  const modifie = main(page).locator("li", { hasText: `Le Long Hiver ${suffixe}` });
  await expect(modifie).toBeVisible();

  await modifie.getByRole("button", { name: "Retirer" }).click();
  await page.locator(".swal2-confirm").click();
  await readAlert(page);
  await expect(modifie).toHaveCount(0);
});
