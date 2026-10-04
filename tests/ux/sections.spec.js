import { test, expect } from "@playwright/test";
import { blockExternalRequests } from "./helpers.js";

// Barre des sections des pages de liste : une ligne groupée, section active marquée, défilement sur téléphone.

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test("sur grand écran, toutes les sections tiennent sur une ligne et la page courante est marquée", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/religions");
  const nav = page.getByRole("navigation", { name: "Sections du site" });
  for (const name of ["Codex", "Bibliothèque", "Carte", "Civilisations", "Religions", "Commerces", "Alliances", "Guerres", "Personnages", "Actions secrètes"]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(nav.locator('[aria-current="page"]')).toHaveText("Religions");
  await expect(nav.getByRole("button")).toHaveCount(0); // pas de flèche : rien ne dépasse
});

test("sur téléphone, la section active est visible et les flèches font défiler la barre", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/personnages");
  const nav = page.getByRole("navigation", { name: "Sections du site" });
  await expect(nav.locator('[aria-current="page"]')).toBeInViewport();
  const precedentes = nav.getByRole("button", { name: "Sections précédentes" });
  await expect(precedentes).toBeVisible();
  for (let i = 0; i < 6 && await precedentes.isVisible(); i++) {
    await precedentes.click();
    await page.waitForTimeout(400);
  }
  await expect(nav.getByRole("link", { name: "Codex", exact: true })).toBeInViewport();
  await expect(nav.getByRole("button", { name: "Sections suivantes" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
