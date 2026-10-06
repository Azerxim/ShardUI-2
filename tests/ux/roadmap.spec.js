import { test, expect } from "@playwright/test";
import { blockExternalRequests } from "./helpers.js";

// La feuille de route s'atteint depuis n'importe quelle page, par le menu de la barre de navigation.
test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test.describe("Feuille de route", () => {
  test("le menu de la barre de navigation y mène", async ({ page }) => {
    await page.goto("/");
    await page.locator(".navbar").getByRole("button", { name: "Menu" }).click();
    await page.locator("#panneau-menu").getByRole("link", { name: "Feuille de route" }).click();
    await expect(page).toHaveURL(/\/roadmap$/);
    await expect(page.getByRole("heading", { name: /feuille de route/i })).toBeVisible();
    await expect(page).toHaveTitle(/Feuille de route/);
  });

  test("les états et les fonctionnalités à venir sont annoncés", async ({ page }) => {
    await page.goto("/roadmap");
    const main = page.locator("main.container");
    // La section « En chantier » est retirée tant qu'aucun chantier n'est commencé
    for (const etat of ["Disponible", "À venir"]) {
      await expect(main.getByText(etat, { exact: true }).first()).toBeVisible();
    }
    for (const titre of ["Organisateur d'élections RP", "Aides et utilitaires", "Chroniques de Tetrago", "Calendrier des événements RP",
      "Lignées et généalogie", "Notifications sur le site", "Tableau de bord des modérateurs RP", "Carte combinée"]) {
      await expect(main.getByRole("heading", { name: titre })).toBeVisible();
    }
    // La monnaie officielle est en jeu : elle figure parmi les fonctionnalités disponibles
    await expect(main.locator("section#disponible").getByRole("heading", { name: "La monnaie officielle : le tetra" })).toBeVisible();
    await expect(main.locator("section#disponible").getByRole("heading", { name: "Zones et bâtiments destructibles" })).toBeVisible();
    for (const titre of ["Population officielle ajustée", "Zones commerciales", "Actions secrètes", "Règles des guerres", "Cohérence historique", "Fermes justifiées en RP", "Catalogue des boutiques", "Jours de marché et foires", "Cibles d'une guerre", "Levée des troupes", "Compagnies de mercenaires", "Déclaration des fermes sur le site", "Chroniques de Tetrago", "Calendrier des événements RP", "Lignées et généalogie"]) {
      await expect(main.locator("section#disponible").getByRole("heading", { name: titre })).toBeVisible();
    }
    // Le conflit d'intérêts des modérateurs reste expliqué (levé par la lecture tracée des actions secrètes)
    await expect(main.getByText(/conflit d'intérêts/i)).toBeVisible();
  });

  test("les ancres du bandeau mènent aux sections", async ({ page }) => {
    await page.goto("/roadmap");
    for (const etat of ["disponible", "avenir"]) {
      await expect(page.locator(`main.container a[href="#${etat}"]`)).toHaveCount(1);
      await expect(page.locator(`section#${etat}`)).toHaveCount(1);
    }
  });
});
