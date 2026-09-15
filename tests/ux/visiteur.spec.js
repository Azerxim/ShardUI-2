import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, readAlert, uniqueSuffix } from "./helpers.js";

// Un visiteur sans compte doit comprendre ce qu'il peut faire et comment aller plus loin.
test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
});

test.describe("Visiteur", () => {
  test("l'accueil propose de se connecter et de créer un compte", async ({ page }) => {
    await page.goto("/");
    const main = page.locator("main.container");
    await expect(main.getByRole("link", { name: /se connecter/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /créer un compte/i })).toBeVisible();
    await expect(page.locator("#parcours li", { hasText: "Créez votre compte" }).locator('a[href="/register"]')).toHaveCount(1);
  });

  test("le lien Discord de l'accueil est une invitation complète", async ({ page }) => {
    await page.goto("/");
    const href = await page.locator("main.container a", { hasText: "Discord" }).first().getAttribute("href");
    expect(href).toMatch(/^https:\/\/discord\.gg\/\w+/);
  });

  test("les boutons de l'accueil sont lisibles et entièrement visibles", async ({ page }) => {
    await page.goto("/");
    const row = page.locator("main.container").getByRole("link", { name: /se connecter/i }).locator("xpath=..");
    const problems = await row.locator(":scope > *").evaluateAll((elements) => elements.flatMap((element) => {
      const button = element.matches("a, button") ? element : element.querySelector("a, button");
      const hero = element.closest(".rounded-3xl").getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const label = element.innerText.replace(/\s+/g, " ").trim();
      return [
        ...(button.scrollHeight > button.clientHeight + 1 ? [`« ${label} » : texte qui déborde du bouton`] : []),
        ...(rect.left < hero.left || rect.right > hero.right ? [`« ${label} » : coupé par le bandeau`] : []),
      ];
    }));
    expect(problems).toEqual([]);
  });

  test("les boutons de la barre de navigation ont un nom accessible", async ({ page }) => {
    await page.goto("/");
    const buttons = page.locator('.navbar [role="button"]');
    await expect(buttons.first()).toBeVisible();
    for (const button of await buttons.all()) {
      expect(await button.getAttribute("aria-label")).toBeTruthy();
    }
  });

  for (const { path, tip } of [
    { path: "/civilisations", tip: "Nouvelle Civilisation" },
    { path: "/religions", tip: "Nouvelle Religion" },
    { path: "/commerces", tip: "Nouveau commerce" },
    { path: "/bibliotheque", tip: "Nouveau Livre" },
  ]) {
    test(`créer depuis ${path} sans compte invite à se connecter`, async ({ page }) => {
      await page.goto(path);
      await page.locator(`button[data-tip="${tip}"]`).first().click();
      const alert = await readAlert(page, "cancel");
      expect(alert).toMatch(/connectez-vous/i);
      await expect(page.locator("dialog[open]")).toHaveCount(0);
    });
  }

  test("une fiche religion explique comment la rejoindre", async ({ page }) => {
    const [first] = await apiGet("/religions/list");
    await page.goto(`/religion/${first.religion.id}`);
    const main = page.locator("main.container");
    await expect(main.getByRole("note")).toContainText(/connectez-vous pour rejoindre/i);
    await expect(main.getByRole("button", { name: /ajouter|modifier/i })).toHaveCount(0);
  });

  test("une fiche commerce explique comment le rejoindre", async ({ page }) => {
    const commerces = await apiGet("/commerces/list");
    const commerce = commerces.find((item) => item.commerce.is_public);
    test.skip(!commerce, "aucun commerce public dans la base de test");
    await page.goto(`/commerce/${commerce.commerce.id}`);
    await expect(page.locator("main.container").getByRole("note")).toContainText(/connectez-vous pour rejoindre/i);
  });

  test("une fiche ville présente sa civilisation, ses religions et ses commerces", async ({ page }) => {
    const civilisations = await apiGet("/civilisations/list");
    const parent = civilisations.find(({ civilisation, villes }) => civilisation.is_public && (villes || []).some((ville) => ville.is_public !== false));
    test.skip(!parent, "aucune ville publique dans la base de test");
    const ville = parent.villes.find((item) => item.is_public !== false);

    await page.goto(`/civilisation/${parent.civilisation.id}/ville/${ville.id}`);
    const main = page.locator("main.container");
    await expect(main.locator("h1")).toContainText(ville.title);
    await expect(main.getByRole("link", { name: parent.civilisation.title, exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Religions", exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { name: "Commerces", exact: true })).toBeVisible();
    await expect(main.getByRole("button", { name: /modifier|frontières|ajouter/i })).toHaveCount(0);
  });

  test("la page 404 ramène à l'accueil", async ({ page }) => {
    await page.goto("/page-qui-n-existe-pas");
    await expect(page.getByText("Retour à l'accueil").first()).toBeVisible();
  });

  test("le profil sans compte propose de se connecter", async ({ page }) => {
    await page.goto("/profil");
    await expect(page.getByText("Vous n'êtes pas connecté.")).toBeVisible();
    await expect(page.locator("main.container").getByRole("link", { name: /se connecter/i })).toBeVisible();
  });

  test("aucune erreur JavaScript sur les pages principales", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of ["/", "/codex", "/bibliotheque", "/civilisations", "/religions", "/commerces", "/register", "/login"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });

  test("les icônes du site s'affichent, et celle choisie pour une religion se charge à la demande", async ({ page }) => {
    // Icônes du code : enregistrées au démarrage (npm run icons) ; une icône oubliée est signalée par FontAwesome
    const missing = [];
    page.on("console", (message) => {
      if (/Could not find icon/i.test(message.text())) missing.push(`${page.url()} : ${message.text()}`);
    });
    for (const path of ["/", "/codex", "/bibliotheque", "/civilisations", "/religions", "/commerces", "/alliances", "/guerres", "/personnages", "/login", "/register", "/profil"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(missing).toEqual([]);

    // Icône absente du code : les packs complets sont chargés pour l'afficher
    const session = await createSession("icone");
    const title = `Culte d'Ankh ${uniqueSuffix()}`;
    await apiPost("/religions/create", session.token, { title, icon: "fa-solid fa-ankh", is_public: true });
    const religion = (await apiGet("/religions/list")).find((item) => item.religion.title === title).religion;
    await page.goto(`/religion/${religion.id}`);
    await expect(page.locator('main.container svg[data-icon="ankh"]').first()).toBeVisible();
    expect(missing).toEqual([]);
  });
});
