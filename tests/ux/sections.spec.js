import { test, expect } from "@playwright/test";
import { blockExternalRequests } from "./helpers.js";

// Navigation entre les sections du site : barre du haut sur grand écran (Codex, menus « Bibliothèque », « Monde » et
// « Infos », Carte), mêmes groupes dans le menu latéral sur téléphone. La page courante est marquée (aria-current).

const BIBLIOTHEQUE = ["Journaux", "Livres"];
const MONDE = ["Civilisations", "Commerces", "Religions", "Personnages", "Maisons", "Alliances", "Guerres", "Élections", "Actions secrètes", "Fermes"];
const INFOS = ["Aides", "Outils", "Calendrier", "Chroniques", "Feuille de route"];

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test("sur grand écran, la barre du haut mène à toutes les sections par ses menus et marque la page courante", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/religions");
  const nav = page.locator(".navbar").getByRole("navigation", { name: "Sections" });
  for (const name of ["Codex", "Carte"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  const groupes = { "Bibliothèque": BIBLIOTHEQUE, Monde: MONDE, Infos: INFOS };
  for (const [groupe, liens] of Object.entries(groupes)) {
    const bouton = nav.getByRole("button", { name: groupe, exact: true });
    await expect(bouton).toBeVisible();
    await bouton.click();
    for (const name of liens) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 880);
  }
  // Religions fait partie du monde : seul ce menu est marqué
  await expect(nav.getByRole("button", { name: "Monde" })).toHaveClass(/bg-secondary/);
  await expect(nav.getByRole("button", { name: "Infos" })).not.toHaveClass(/bg-secondary/);
  await expect(nav.locator('[aria-current="page"]')).toHaveText("Religions");
  await nav.getByRole("button", { name: "Infos" }).click();
  await nav.getByRole("link", { name: "Chroniques", exact: true }).click();
  await expect(page).toHaveURL(/\/chroniques$/);
  await expect(nav.getByRole("button", { name: "Infos" })).toHaveClass(/bg-secondary/);
});

test("sur téléphone, le menu latéral garde les mêmes groupes et marque la page courante", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/personnages");
  await expect(page.locator(".navbar").getByRole("navigation", { name: "Sections" })).toBeHidden();
  await page.locator(".navbar").getByRole("button", { name: "Menu" }).click();
  const menu = page.locator("#panneau-menu");
  for (const titre of ["Découvrir", "Bibliothèque", "Le monde", "Infos"]) {
    await expect(menu.locator(".menu-title", { hasText: titre })).toBeAttached();
  }
  for (const name of ["Codex", ...BIBLIOTHEQUE, ...MONDE, ...INFOS]) {
    await expect(menu.getByRole("link", { name, exact: true })).toBeAttached();
  }
  await expect(menu.locator('[aria-current="page"]')).toHaveText("Personnages");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("les liens Journaux et Livres de la bibliothèque n'affichent que ce support", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/bibliotheque#livres");
  const main = page.locator("body"); // la page de la bibliothèque n'a pas de <main>
  await expect(main.getByRole("heading", { name: "Livres", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Journaux", exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/bibliotheque$/); // l'ancre retirée, le filtre reste libre
  await expect(main.getByLabel("Afficher")).toHaveValue("livres");

  // Depuis le menu, sur la même page
  const nav = page.locator(".navbar").getByRole("navigation", { name: "Sections" });
  await expect(nav.getByRole("button", { name: "Bibliothèque" })).toHaveClass(/bg-secondary/);
  await nav.getByRole("button", { name: "Bibliothèque" }).click();
  await nav.getByRole("link", { name: "Journaux", exact: true }).click();
  await expect(main.getByRole("heading", { name: "Journaux", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Livres", exact: true })).toHaveCount(0);

  // Le filtre se change ensuite librement
  await main.getByLabel("Afficher").selectOption("tous");
  await expect(main.getByRole("heading", { name: "Livres", exact: true })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Journaux", exact: true })).toBeVisible();
});
