import { test, expect } from "@playwright/test";
import { blockExternalRequests } from "./helpers.js";

// La feuille de route s'atteint depuis n'importe quelle page, par le pied de page.
test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test.describe("Feuille de route", () => {
  test("le pied de page y mène, à côté du choix de la saison", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.locator('[data-tip="Saison"]')).toHaveCount(1);
    await footer.getByRole("link", { name: "Feuille de route" }).click();
    await expect(page).toHaveURL(/\/roadmap$/);
    await expect(page.getByRole("heading", { name: /feuille de route/i })).toBeVisible();
    await expect(page).toHaveTitle(/Feuille de route/);
  });

  test("les trois états et les fonctionnalités à venir sont annoncés", async ({ page }) => {
    await page.goto("/roadmap");
    const main = page.locator("main.container");
    for (const etat of ["Disponible", "En chantier", "À venir"]) {
      await expect(main.getByText(etat, { exact: true }).first()).toBeVisible();
    }
    for (const titre of ["La monnaie officielle du serveur", "Zones commerciales", "Règles des guerres",
      "Zones et bâtiments destructibles", "Actions secrètes", "Cohérence historique",
      "Fermes justifiées en RP", "Organisateur d'élections RP", "Aides et utilitaires"]) {
      await expect(main.getByRole("heading", { name: titre })).toBeVisible();
    }
    // Le conflit d'intérêts des modérateurs reste posé, il ne doit pas disparaître de la page
    await expect(main.getByText(/conflit d'intérêts/i)).toBeVisible();
  });

  test("les ancres du bandeau mènent aux sections", async ({ page }) => {
    await page.goto("/roadmap");
    for (const etat of ["disponible", "chantier", "avenir"]) {
      await expect(page.locator(`main.container a[href="#${etat}"]`)).toHaveCount(1);
      await expect(page.locator(`section#${etat}`)).toHaveCount(1);
    }
  });
});
