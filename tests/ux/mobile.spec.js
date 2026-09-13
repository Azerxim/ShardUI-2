import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, signIn, uniqueSuffix } from "./helpers.js";

// Sur téléphone, les libellés des boutons sont masqués : chaque action doit rester identifiable.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test.describe("Mobile", () => {
  for (const path of ["/", "/civilisations", "/religions", "/commerces", "/alliances", "/guerres", "/bibliotheque", "/register"]) {
    test(`${path} ne défile pas horizontalement`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // Les listes gardent un squelette au moins une seconde avant d'afficher leurs cartes
      await page.waitForTimeout(1500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("une fiche ville ne défile pas horizontalement", async ({ page }) => {
    const civilisations = await apiGet("/civilisations/list");
    const parent = civilisations.find(({ civilisation, villes }) => civilisation.is_public && (villes || []).length > 0);
    test.skip(!parent, "aucune ville dans la base de test");

    await page.goto(`/civilisation/${parent.civilisation.id}/ville/${parent.villes[0].id}`);
    await expect(page.locator("main.container h1")).toContainText(parent.villes[0].title);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("une fiche quartier ne défile pas horizontalement", async ({ page }) => {
    const session = await createSession("mobileq");
    const [dimension] = await apiGet("/cartographie/dimensions/read");
    const { civilisation } = await apiPost("/civilisations/create", session.token, { title: `Comté mobile ${uniqueSuffix()}`, is_public: true });
    const ville = await apiPost("/civilisations/villes/create", session.token, { title: "Bourg mobile", civilisation_id: civilisation.id, dimension_id: dimension?.id ?? 1, x: 0, z: 0, is_public: true });
    const { quartier } = await apiPost("/civilisations/quartiers/create", session.token, { title: "Quartier des artisans du bord de mer", ville_id: ville.id, is_public: true });

    await page.goto(`/quartier/${quartier.id}`);
    await expect(page.locator("main.container h1")).toContainText(quartier.title);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("la carte d'un journal tient dans l'écran", async ({ page }) => {
    await page.goto("/bibliotheque");
    const card = page.locator(".journal-card").first();
    await card.waitFor({ timeout: 8000 }).catch(() => { });
    test.skip((await card.count()) === 0, "aucun journal dans la base de test");

    const box = await card.boundingBox();
    const viewport = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  });

  test("sur la fiche de son commerce, chaque bouton est identifiable", async ({ page, context }) => {
    const session = await createSession("mobile");
    const created = await apiPost("/commerces/create", session.token, { title: `Échoppe mobile ${uniqueSuffix()}` });
    await signIn(context, session);

    await page.goto(`/commerce/${created.commerce.id}`);
    await expect(page.locator("main.container").getByRole("button", { name: "Ajouter" }).first()).toBeVisible();

    const unnamed = await page.locator("main.container").locator("a:visible, button:visible").evaluateAll((elements) => elements
      .filter((element) => !element.innerText.trim() && !element.getAttribute("aria-label") && !element.getAttribute("data-tip") && !element.getAttribute("title"))
      .map((element) => element.outerHTML.slice(0, 120)));
    expect(unnamed).toEqual([]);
  });
});
