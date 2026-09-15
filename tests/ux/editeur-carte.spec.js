import { test, expect } from "@playwright/test";
import { apiGet, apiPost, blockExternalRequests, createSession, refreshSession, uniqueSuffix } from "./helpers.js";

// Éditeur de carte ouvert depuis le site : la fausse carte (tests/ux/fake-maps.mjs, autre origine) charge le vrai
// shard-api.js de ShardUI-2-Maps et obtient la session du site par postMessage.
test.describe.configure({ mode: "serial" });

const MAPS_URL = "http://127.0.0.1:8014";

let session;
let civilisationId;
let ville;

test.beforeAll(async () => {
  session = await createSession("editeur");
  const dimension = (await apiGet("/cartographie/dimensions/read")).find((item) => item.link);
  const created = await apiPost("/civilisations/create", session.token, { title: `Cartographes ${uniqueSuffix()}`, is_public: true });
  civilisationId = created.civilisation.id;
  ville = await apiPost("/civilisations/villes/create", session.token, {
    title: `Atelier ${uniqueSuffix()}`, civilisation_id: civilisationId, dimension_id: dimension.id, x: 10, z: 20, is_public: true,
  });
});

const setMapsConfig = (config) => fetch(`${MAPS_URL}/__config`, { method: "POST", body: JSON.stringify(config) });

// Ouvre la fiche de la ville puis l'éditeur de ses frontières (nouvel onglet)
async function openEditor(browser) {
  const context = await browser.newContext({ locale: "fr-FR" });
  await blockExternalRequests(context);
  // Session ouverte sur le site seulement : la carte, sur une autre origine, n'a pas accès à son localStorage
  await context.addInitScript(([user, token, uiOrigin]) => {
    if (window.location.origin !== uiOrigin) return;
    localStorage.setItem("user", user);
    localStorage.setItem("token", token);
  }, [JSON.stringify(session.user), session.token, "http://127.0.0.1:5183"]);
  const page = await context.newPage();
  await page.goto(`/civilisation/${civilisationId}/ville/${ville.id}`);
  const [editor] = await Promise.all([
    context.waitForEvent("page"),
    page.locator("main.container").getByRole("button", { name: "Frontières", exact: true }).click(),
  ]);
  return { context, page, editor };
}

test("l'éditeur ouvert depuis le site reçoit la session et la garde", async ({ browser }) => {
  const { context, editor } = await openEditor(browser);
  await expect(editor.locator("#status")).toHaveText("connecté");
  await expect(editor.locator("#user")).toHaveText(session.account.username);

  // Quelques secondes plus tard, les requêtes authentifiées fonctionnent toujours
  await editor.waitForTimeout(6000);
  await editor.locator("#again").click();
  await expect(editor.locator("#user")).toHaveText(session.account.username);
  await context.close();
});

test("après une navigation dans l'onglet du site, l'éditeur obtient encore la session", async ({ browser }) => {
  const { context, page, editor } = await openEditor(browser);
  await expect(editor.locator("#status")).toHaveText("connecté");

  // Rechargement complet de l'onglet d'origine, puis l'éditeur (session oubliée) redemande la connexion
  await page.goto("/civilisations");
  await editor.evaluate(() => sessionStorage.clear());
  await editor.reload();
  await expect(editor.locator("#status")).toHaveText("connecté");
  await expect(editor.locator("#user")).toHaveText(session.account.username);
  await context.close();
});

test("une nouvelle connexion sur le site est reprise par l'éditeur sans le rouvrir", async ({ browser }) => {
  const { context, page, editor } = await openEditor(browser);
  await expect(editor.locator("#user")).toHaveText(session.account.username);

  // Se reconnecter révoque l'ancien jeton, que l'éditeur utilise encore
  session = await refreshSession(session);
  await page.evaluate((token) => localStorage.setItem("token", token), session.token);
  await editor.locator("#again").click();
  await expect(editor.locator("#user")).toHaveText(session.account.username);
  await context.close();
});

test("un site non autorisé par la carte obtient un message explicite", async ({ browser }) => {
  await setMapsConfig({ uiBaseUrl: "https://beta.tetrago.fr" });
  try {
    const { context, editor } = await openEditor(browser);
    await expect(editor.locator("#status")).toContainText("n'est pas autorisé");
    await expect(editor.locator("#status")).toContainText("UI_ALLOWED_ORIGINS");
    await context.close();
  } finally {
    await setMapsConfig({ uiBaseUrl: "http://127.0.0.1:5183" });
  }
});
