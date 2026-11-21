import { test, expect } from "@playwright/test";
import { blockExternalRequests } from "./helpers.js";

// Navigation entre les sections du site : barre du haut sur grand écran (Codex, Bibliothèque, menu « Monde », Carte),
// menu latéral sur téléphone. La page courante est marquée (aria-current) dans les deux.

const MONDE = ["Civilisations", "Commerces", "Religions", "Personnages", "Maisons", "Alliances", "Guerres", "Élections", "Actions secrètes", "Fermes"];

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test("sur grand écran, la barre du haut mène à toutes les sections et marque la page courante", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/religions");
  const nav = page.locator(".navbar").getByRole("navigation", { name: "Sections" });
  for (const name of ["Codex", "Bibliothèque", "Carte"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  const monde = nav.getByRole("button", { name: "Monde" });
  await expect(monde).toBeVisible();
  await expect(monde).toHaveClass(/bg-secondary/); // Religions fait partie du monde
  await monde.click();
  for (const name of MONDE) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(nav.locator('[aria-current="page"]')).toHaveText("Religions");
  await nav.getByRole("link", { name: "Guerres", exact: true }).click();
  await expect(page).toHaveURL(/\/guerres$/);
});

test("sur téléphone, le menu latéral garde toutes les sections et marque la page courante", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/personnages");
  await expect(page.locator(".navbar").getByRole("navigation", { name: "Sections" })).toBeHidden();
  await page.locator(".navbar").getByRole("button", { name: "Menu" }).click();
  const menu = page.locator("#panneau-menu");
  for (const name of ["Codex", "Bibliothèque", ...MONDE]) {
    await expect(menu.getByRole("link", { name, exact: true })).toBeAttached();
  }
  await expect(menu.locator('[aria-current="page"]')).toHaveText("Personnages");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
