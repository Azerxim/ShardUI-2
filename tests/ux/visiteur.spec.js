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
    const buttons = page.locator('.navbar button, .navbar [role="button"]');
    await expect(buttons.first()).toBeVisible();
    for (const button of await buttons.all()) {
      expect(await button.getAttribute("aria-label")).toBeTruthy();
    }
  });

  test("le menu latéral est masqué jusqu'au clic sur Menu", async ({ page }) => {
    await page.goto("/");
    const menu = page.locator("#panneau-menu");
    const bouton = page.locator(".navbar").getByRole("button", { name: "Menu" });
    await expect(menu).not.toBeInViewport();
    await expect(bouton).toHaveAttribute("aria-expanded", "false");

    await bouton.click();
    await expect(menu).toBeInViewport();
    await expect(bouton).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("link", { name: "Codex" })).toBeVisible();

    // Échap le referme et rend le focus au bouton
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeInViewport();
    await expect(bouton).toBeFocused();

    // Un clic à côté du menu le referme aussi
    await bouton.click();
    await expect(menu).toBeInViewport();
    await page.mouse.click(page.viewportSize().width - 20, page.viewportSize().height / 2);
    await expect(menu).not.toBeInViewport();
  });

  test("le compte s'ouvre dans un panneau latéral", async ({ page }) => {
    await page.goto("/");
    const panneau = page.locator("#panneau-compte");
    await expect(panneau).not.toBeInViewport();
    await page.locator(".navbar").getByRole("button", { name: "Connexion ou inscription" }).click();
    await expect(panneau).toBeInViewport();
    await expect(panneau.getByRole("link", { name: "Connexion" })).toBeVisible();
    await panneau.getByRole("link", { name: "Inscription" }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("les joueurs connectés s'affichent dans un panneau latéral à droite", async ({ page }) => {
    // Réponse simulée de mcapi.us (état du serveur), prioritaire sur le blocage des requêtes externes
    await page.route(/mcapi\.us/, (route) => route.fulfill({
      json: { online: true, players: { now: 2, max: 20, sample: [{ name: "Alice_RP", id: "a" }, { name: "Bob_RP", id: "b" }] } },
    }));
    await page.goto("/");
    const panneau = page.locator("#panneau-joueurs");
    const bouton = page.locator(".navbar").getByRole("button", { name: "Joueurs connectés" });
    await expect(panneau).not.toBeInViewport();

    await bouton.click();
    await expect(panneau).toBeInViewport();
    await expect(panneau.getByText("Alice_RP")).toBeVisible();
    await expect(panneau.getByText("Bob_RP")).toBeVisible();
    const { gauche, largeur } = await panneau.evaluate((element) => ({ gauche: element.getBoundingClientRect().left, largeur: window.innerWidth }));
    expect(gauche).toBeGreaterThan(largeur / 2);

    await page.keyboard.press("Escape");
    await expect(panneau).not.toBeInViewport();
    await expect(bouton).toBeFocused();
  });

  test("le thème se choisit dans un panneau latéral", async ({ page }) => {
    await page.goto("/");
    const panneau = page.locator("#panneau-theme");
    const bouton = page.locator(".navbar").getByRole("button", { name: "Thème" });
    await expect(panneau).not.toBeInViewport();
    for (const [nom, theme] of [["Sombre", "dark"], ["Clair", "light"]]) {
      await bouton.click();
      await expect(panneau).toBeInViewport();
      await panneau.getByRole("button", { name: nom }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      // Le choix referme le panneau
      await expect(panneau).not.toBeInViewport();
    }
    await bouton.click();
    await expect(panneau.getByRole("button", { name: "Clair" })).toHaveAttribute("aria-pressed", "true");
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
    // Le lien vers la civilisation figure dans le fil d'Ariane et dans la fiche
    await expect(main.getByRole("navigation", { name: "Fil d'Ariane" }).getByRole("link", { name: parent.civilisation.title, exact: true })).toBeVisible();
    await expect(main.getByRole("link", { name: parent.civilisation.title, exact: true }).last()).toBeVisible();
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
