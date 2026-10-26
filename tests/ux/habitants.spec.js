import { test, expect } from "@playwright/test";
import { apiPost, blockExternalRequests, createSession, readAlert, signIn, uniqueSuffix } from "./helpers.js";

// Tuile « Habitants » d'une civilisation : un joueur connecté y crée un personnage qui réside d'office dans la civilisation.
const suffixe = uniqueSuffix();

test("un joueur crée depuis la civilisation un personnage qui y réside", async ({ page, context }) => {
  const joueur = await createSession("habitant");
  const civilisation = (await apiPost("/civilisations/create", joueur.token, { title: `Bourg ${suffixe}`, is_public: true })).civilisation;
  await blockExternalRequests(page);

  // Visiteur : pas de bouton
  await page.goto(`/civilisation/${civilisation.id}`);
  await expect(page.getByRole("button", { name: "Créer", exact: true })).toHaveCount(0);

  await signIn(context, joueur);
  await page.reload();
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  const modale = page.locator("dialog[open]");
  await expect(modale.locator('select[name="civilisation_id"]')).toHaveValue(String(civilisation.id));
  await modale.locator('input[name="name"]').fill(`Meunier ${suffixe}`);
  await modale.getByRole("button", { name: "Créer" }).click();
  expect(await readAlert(page)).toContain(`Meunier ${suffixe} s'installe ici`);
  await expect(page.getByRole("link", { name: new RegExp(`Meunier ${suffixe}`) })).toBeVisible();
});
