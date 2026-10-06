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
      "Lignées et généalogie", "Notifications sur le site"]) {
      await expect(main.getByRole("heading", { name: titre })).toBeVisible();
    }
    // La monnaie officielle est en jeu : elle figure parmi les fonctionnalités disponibles
    await expect(main.locator("section#disponible").getByRole("heading", { name: "La monnaie officielle : le tetra" })).toBeVisible();
    await expect(main.locator("section#disponible").getByRole("heading", { name: "Zones et bâtiments destructibles" })).toBeVisible();
    for (const titre of ["Population officielle ajustée", "Zones commerciales", "Actions secrètes", "Règles des guerres", "Cohérence historique", "Fermes justifiées en RP", "Catalogue des boutiques", "Jours de marché et foires", "Cibles d'une guerre", "Levée des troupes", "Compagnies de mercenaires", "Carte unifiée", "Notifications sur le site", "Tableau de bord des modérateurs RP", "Déclaration des fermes sur le site", "Chroniques de Tetrago", "Calendrier des événements RP", "Lignées et généalogie"]) {
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

  test("une section se masque, reste masquée et se rouvre par un lien direct", async ({ page }) => {
    await page.goto("/roadmap");
    const avenir = page.locator("section#avenir");
    await avenir.getByRole("button", { name: "Masquer" }).click();
    await expect(page.locator("#avenir-contenu")).toBeHidden();
    await expect(avenir).toContainText(/fonctionnalités? masquées?/);
    await page.reload();
    await expect(page.locator("#avenir-contenu")).toBeHidden();

    // Un lien vers une fonctionnalité d'une section repliée la déplie
    await page.goto("/roadmap#organisateur-d-elections-rp");
    await expect(page.locator("#organisateur-d-elections-rp")).toBeVisible();
    await expect(avenir.getByRole("button", { name: "Masquer" })).toHaveAttribute("aria-expanded", "true");
  });

  test("la recherche filtre les fonctionnalités, sans tenir compte des accents", async ({ page }) => {
    await page.goto("/roadmap");
    await page.getByRole("searchbox", { name: "Rechercher dans la feuille de route" }).fill("genealogie");
    await expect(page.getByRole("status")).toHaveText("1 fonctionnalité trouvée.");
    await expect(page.locator("main article h3")).toHaveText(["Lignées et généalogie"]);
    await expect(page.locator("section#avenir")).toHaveCount(0);
  });
});
