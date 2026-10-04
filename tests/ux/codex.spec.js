import { test, expect } from "@playwright/test";
import { blockExternalRequests } from "./helpers.js";

// Navigation dans le Codex : sommaire latéral qui suit la lecture, recherche, filtre « Zéro tolérance »,
// références et liens d'articles, sommaire flottant sur téléphone.

const main = (page) => page.locator("main.container");

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test("le sommaire latéral liste les livres et mène au chapitre choisi", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/codex");
  const sommaire = page.getByRole("navigation", { name: "Sommaire du Codex" }).first();
  await expect(sommaire).toContainText("Livre I · La loi du serveur");
  await expect(sommaire).toContainText("Livre II · Le codex du rôle-play");
  await sommaire.getByRole("link", { name: /Guerres & batailles/ }).click();
  await expect(page).toHaveURL(/#guerres$/);
  await expect(main(page).getByRole("heading", { name: "II.5 · Guerres & batailles" })).toBeInViewport();
  await expect(sommaire.locator('[aria-current="location"]')).toContainText("Guerres & batailles");
});

test("la recherche filtre les articles, sans tenir compte des accents", async ({ page }) => {
  await page.goto("/codex");
  await main(page).getByRole("searchbox", { name: "Rechercher dans le Codex" }).fill("piege");
  await expect(main(page).getByText(/article trouvé|articles trouvés/)).toBeVisible();
  await expect(main(page).locator("#guerres-5")).toBeVisible();
  await expect(main(page).locator("#guerres-5 mark").first()).toHaveText(/piège/i);
  await expect(main(page).locator("#conduite")).toHaveCount(0);

  await main(page).getByRole("searchbox", { name: "Rechercher dans le Codex" }).fill("zzzz introuvable");
  await expect(main(page).getByText("Aucun article ne correspond à votre recherche.")).toBeVisible();
  await main(page).getByRole("button", { name: "Tout afficher" }).click();
  await expect(main(page).locator("#conduite")).toBeVisible();
});

test("le filtre « Zéro tolérance » ne garde que les fautes graves", async ({ page }) => {
  await page.goto("/codex");
  await main(page).getByText("Zéro tolérance", { exact: true }).first().click();
  const articles = main(page).locator('[id$="-1"], [id$="-2"], [id$="-3"], [id$="-4"], [id$="-5"]').filter({ has: page.locator("p") });
  const total = await articles.count();
  expect(total).toBeGreaterThan(0);
  await expect(articles.filter({ has: page.locator(".badge", { hasText: "Zéro tolérance" }) })).toHaveCount(total);
});

test("un lien d'article ouvre le Codex sur cet article", async ({ page }) => {
  await page.goto("/codex#fermes-2");
  const article = main(page).locator("#fermes-2");
  await expect(article).toBeInViewport();
  await expect(article).toContainText("Toute ferme s'habille.");
  await expect(article.getByRole("button", { name: "Copier le lien de l'article II.7.2" })).toHaveCount(1);
});

test("sur téléphone, le sommaire s'ouvre depuis un bouton flottant, sans débordement", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/codex");
  await page.getByRole("button", { name: "Ouvrir le sommaire du Codex" }).click();
  const panneau = page.locator("dialog[open]");
  await panneau.getByRole("link", { name: /Fermes & ressources/ }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(main(page).locator("#fermes")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
